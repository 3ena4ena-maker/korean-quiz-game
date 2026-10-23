// =========================================================================
// 한글 징검다리 서바이벌 퀴즈 - 클라이언트 & P2P 멀티플레이어 통합 엔진 (app.js)
// GitHub Pages 정적 배포 및 로컬 서버 환경 모두 100% 실시간 동시접속 지원
// =========================================================================

const AVATAR_CATALOG = {
  bear:    { emoji: '🐻', label: '곰돌이', headColor: '#fde68a', shirtColor: '#3b82f6' },
  rabbit:  { emoji: '🐰', label: '토끼',   headColor: '#fce7f3', shirtColor: '#ec4899' },
  chick:   { emoji: '🐥', label: '삐약이', headColor: '#fef08a', shirtColor: '#f59e0b' },
  fox:     { emoji: '🦊', label: '여우',   headColor: '#ffedd5', shirtColor: '#ea580c' },
  panda:   { emoji: '🐼', label: '판다',   headColor: '#f1f5f9', shirtColor: '#10b981' },
  tiger:   { emoji: '🐯', label: '호랑이', headColor: '#fed7aa', shirtColor: '#dc2626' },
  frog:    { emoji: '🐸', label: '개구리', headColor: '#bbf7d0', shirtColor: '#16a34a' },
  cat:     { emoji: '🐱', label: '고양이', headColor: '#e0e7ff', shirtColor: '#6366f1' },
  dog:     { emoji: '🐶', label: '강아지', headColor: '#fef3c7', shirtColor: '#2563eb' },
  penguin: { emoji: '🐧', label: '펭귄',   headColor: '#dbeafe', shirtColor: '#0284c7' },
  hamster: { emoji: '🐹', label: '햄스터', headColor: '#ffedd5', shirtColor: '#d97706' },
  unicorn: { emoji: '🦄', label: '유니콘', headColor: '#f3e8ff', shirtColor: '#9333ea' }
};

const COUNTRY_LIST = ['🇰🇷', '🇺🇸', '🇯🇵', '🇻🇳', '🇨🇳', '🇫🇷', '🇪🇸', '🇧🇷', '🇺🇿', '🇮🇩', '🇩🇪', '🇹🇭', '🌏'];

const BOT_PROFILES = [
  { name: '마이클', country: '🇺🇸', avatar: 'bear' },
  { name: '유키', country: '🇯🇵', avatar: 'rabbit' },
  { name: '민트랑', country: '🇻🇳', avatar: 'chick' },
  { name: '엘레나', country: '🇫🇷', avatar: 'fox' },
  { name: '하오란', country: '🇨🇳', avatar: 'panda' },
  { name: '소피아', country: '🇪🇸', avatar: 'cat' },
  { name: '레오', country: '🇧🇷', avatar: 'tiger' },
  { name: '나타샤', country: '🇺🇿', avatar: 'unicorn' },
  { name: '아민', country: '🇮🇩', avatar: 'frog' },
  { name: '줄리아', country: '🇩🇪', avatar: 'dog' },
  { name: '케빈', country: '🇨🇦', avatar: 'penguin' },
  { name: '메이', country: '🇹🇭', avatar: 'hamster' }
];

const DEFAULT_QUIZ_DATABASE = {
  activeSetId: 'set-1',
  sets: [
    {
      id: 'set-1',
      title: '🌱 초급 1급: 조사 & 기초 동사·형용사',
      description: '외국인 학습자가 가장 자주 헷갈리는 기본 조사(을/를, 에/에서)와 기초 용언 연습',
      questions: [
        {
          id: 'q101',
          category: '조사',
          sentence: '저는 매일 아침 맛있는 사과[ _____ ] 먹어요.',
          translation: 'I eat a delicious apple every morning.',
          optionA: '를',
          optionB: '에',
          answer: 'A',
          timeLimit: 5,
          explanation: "'먹다'의 목적어 앞에는 받침이 없을 때 조사 '를'을 씁니다."
        },
        {
          id: 'q102',
          category: '조사',
          sentence: '지금 도서관[ _____ ] 한국어를 공부하고 있어요.',
          translation: 'I am studying Korean at the library right now.',
          optionA: '에',
          optionB: '에서',
          answer: 'B',
          timeLimit: 5,
          explanation: "행동(공부하다)이 이루어지는 장소 뒤에는 '에서'를 씁니다."
        },
        {
          id: 'q103',
          category: '동사',
          sentence: '오늘 날씨가 아주 추우니까 따뜻한 코트를 [ _____ ].',
          translation: "It's very cold today, so please wear a warm coat.",
          optionA: '입으세요',
          optionB: '신으세요',
          answer: 'A',
          timeLimit: 5,
          explanation: "옷(코트, 바지, 치마)은 '입다', 신발이나 양말은 '신다'를 씁니다."
        },
        {
          id: 'q104',
          category: '형용사',
          sentence: '새로 산 구두가 너무 작아서 발이 [ _____ ].',
          translation: 'My feet hurt because the new shoes are too small.',
          optionA: '고파요',
          optionB: '아파요',
          answer: 'B',
          timeLimit: 5,
          explanation: "몸에 통증이 있을 때는 '아프다(아파요)'를 사용합니다."
        },
        {
          id: 'q105',
          category: '조사',
          sentence: '이번 주말에 친구[ _____ ] 같이 영화관에 갈 거예요.',
          translation: 'I am going to the movie theater together with my friend this weekend.',
          optionA: '하고',
          optionB: '마다',
          answer: 'A',
          timeLimit: 5,
          explanation: "'~와/과 함께'의 의미로 구어체에서는 '하고'를 자주 씁니다."
        }
      ]
    },
    {
      id: 'set-2',
      title: '🌿 초급 2급: 접속사 & 연결어미 연습',
      description: '문장과 문장을 자연스럽게 이어주는 접속부사(그래서, 그러나)와 연결어미 복습',
      questions: [
        {
          id: 'q201',
          category: '접속사',
          sentence: '밖에서 비가 많이 옵니다. [ _____ ] 우산을 썼습니다.',
          translation: 'It is raining a lot outside. So I used an umbrella.',
          optionA: '그래서',
          optionB: '그러나',
          answer: 'A',
          timeLimit: 5,
          explanation: "앞 문장이 원인이 되고 뒤 문장이 결과일 때는 '그래서'를 씁니다."
        },
        {
          id: 'q202',
          category: '접속사',
          sentence: '떡볶이는 조금 맵습니다. [ _____ ] 아주 맛있습니다.',
          translation: 'Tteokbokki is a little spicy. However, it is very delicious.',
          optionA: '그러니까',
          optionB: '그렇지만',
          answer: 'B',
          timeLimit: 5,
          explanation: "앞의 내용과 반대되는 내용이 뒤에 올 때는 '그렇지만/그러나'를 씁니다."
        },
        {
          id: 'q203',
          category: '연결어미',
          sentence: '아침부터 배가 너무 [ _____ ] 밥을 두 그릇이나 먹었어요.',
          translation: 'Because I was so hungry since morning, I ate two bowls of rice.',
          optionA: '고파서',
          optionB: '고프지만',
          answer: 'A',
          timeLimit: 10,
          explanation: "'배가 고프다'에 이유를 나타내는 '-아서/어서'가 결합하면 '고파서'가 됩니다."
        },
        {
          id: 'q204',
          category: '연결어미',
          sentence: '내일 한국어 시험이 [ _____ ] 오늘 밤에 열심히 공부해야 해요.',
          translation: 'Since there is a Korean exam tomorrow, I have to study hard tonight.',
          optionA: '있으니까',
          optionB: '있느라고',
          answer: 'A',
          timeLimit: 10,
          explanation: "뒤에 명령이나 의무('~해야 해요')가 올 때는 이유 연결어미 '-(으)니까'를 씁니다."
        },
        {
          id: 'q205',
          category: '어미',
          sentence: '퇴근 시간이라 길이 많이 막히니까 지하철을 [ _____ ].',
          translation: "Since the road is very congested during rush hour, let's take the subway.",
          optionA: '탑시다',
          optionB: '탔습니다',
          answer: 'A',
          timeLimit: 5,
          explanation: "상대방에게 함께 하자고 제안(청유)할 때는 '-(으)ㅂ시다(탑시다)'를 씁니다."
        }
      ]
    },
    {
      id: 'set-3',
      title: '🌳 중급 3급: 부사 & 헷갈리는 형용사·동사',
      description: '중급 학습자들이 자주 틀리는 정도부사, 시간부사, 유사 어휘 구별하기',
      questions: [
        {
          id: 'q301',
          category: '부사',
          sentence: '시험 결과가 생각보다 잘 나와서 기분이 [ _____ ] 좋았어요.',
          translation: 'The test result came out better than expected, so I felt very good.',
          optionA: '무척',
          optionB: '별로',
          answer: 'A',
          timeLimit: 5,
          explanation: "'무척'은 긍정문에서 '매우/아주'의 뜻으로 쓰이고, '별로'는 부정문(별로 안 좋다)과 함께 쓰입니다."
        },
        {
          id: 'q302',
          category: '부사',
          sentence: '비행기 시간에 늦지 않도록 공항에 [ _____ ] 도착하세요.',
          translation: "Please arrive at the airport in advance so you won't be late for your flight.",
          optionA: '벌써',
          optionB: '미리',
          answer: 'B',
          timeLimit: 5,
          explanation: "어떤 일이 일어나기 전에 먼저 준비할 때는 '미리'를 씁니다."
        },
        {
          id: 'q303',
          category: '형용사',
          sentence: '전주는 비빔밥이 맛있기로 [ _____ ] 도시예요.',
          translation: 'Jeonju is a city famous for its delicious bibimbap.',
          optionA: '유명한',
          optionB: '유행한',
          answer: 'A',
          timeLimit: 5,
          explanation: "이름이 널리 알려져 있다는 뜻은 '유명하다(유명한)'입니다."
        },
        {
          id: 'q304',
          category: '동사',
          sentence: '약속 시간을 갑자기 [ _____ ] 정말 미안해요.',
          translation: "I'm really sorry for suddenly changing the appointment time.",
          optionA: '고쳐서',
          optionB: '바꿔서',
          answer: 'B',
          timeLimit: 10,
          explanation: "시간이나 일정을 다른 것으로 변경할 때는 '바꾸다(바꿔서)'를 씁니다."
        },
        {
          id: 'q305',
          category: '형용사',
          sentence: '외국어를 배울 때는 매일 조금씩 연습하는 습관이 가장 [ _____ ].',
          translation: 'When learning a foreign language, the habit of practicing a little every day is the most important.',
          optionA: '중요합니다',
          optionB: '위험합니다',
          answer: 'A',
          timeLimit: 5,
          explanation: "가치가 크고 꼭 필요하다는 의미의 형용사는 '중요하다(중요합니다)'입니다."
        }
      ]
    }
  ]
};

// 사운드 효과 합성기 (Web Audio API)
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.12, vol = 0.12, slideTo = null) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  tick(urgent = false) {
    this.playTone(urgent ? 880 : 620, 'triangle', 0.07, urgent ? 0.14 : 0.08);
  }

  step() {
    this.playTone(380, 'sine', 0.09, 0.1, 580);
  }

  reveal() {
    this.playTone(523.25, 'triangle', 0.15, 0.15);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15, 0.15), 110);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.28, 0.18), 220);
  }

  fall() {
    this.playTone(620, 'sawtooth', 0.85, 0.15, 95);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 'triangle', 0.22, 0.18), idx * 130);
    });
  }
}

const sfx = new SoundFX();

// =========================================================================
// 전역 상태 및 멀티플레이 통신 채널 (BroadcastChannel + PeerJS WebRTC)
// =========================================================================
const urlParams = new URLSearchParams(window.location.search);
const isStudentUrlMode = urlParams.get('role') === 'student';
const roomCodeParam = urlParams.get('room') || '1004';

let quizDatabase = loadQuizDatabaseFromStorage();
let editingSetId = quizDatabase.activeSetId || quizDatabase.sets[0].id;

let serverInfo = {
  roomCode: roomCodeParam,
  studentLanUrl: getStudentInviteUrl(roomCodeParam)
};

function getStudentInviteUrl(code) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?role=student&room=${encodeURIComponent(code)}`;
}

function loadQuizDatabaseFromStorage() {
  const saved = localStorage.getItem('kor_quiz_custom_db_v1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.sets) && parsed.sets.length > 0) {
        return parsed;
      }
    } catch (_) {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_QUIZ_DATABASE));
}

function saveQuizDatabaseToStorage() {
  localStorage.setItem('kor_quiz_custom_db_v1', JSON.stringify(quizDatabase));
  // 로컬 서버가 켜져 있으면 서버 파일에도 백업 시도
  fetch('./api/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizDatabase)
  }).catch(() => {});
}

// 호스트(선생님) 게임 상태
const hostPlayersMap = {};
let hostTimerInterval = null;
let hostBotTimeouts = [];

let gameState = {
  roomCode: roomCodeParam,
  phase: 'LOBBY',
  activeSetId: quizDatabase.activeSetId || 'set-1',
  activeSetTitle: '',
  questionIndex: 0,
  totalQuestions: 0,
  currentQuestion: null,
  timeLimit: 5,
  timeRemaining: 5,
  overrideTimeLimit: null,
  players: [],
  lastEliminatedIds: []
};

let prevPhase = 'LOBBY';
let prevTimeInt = null;
const avatarDomMap = new Map();

let myStudentProfile = loadMyStudentProfile();
let isStudentJoined = false;
let isEditingStudentProfile = false;

function loadMyStudentProfile() {
  const saved = localStorage.getItem('kor_quiz_student_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (_) {}
  }
  const randomAvatars = Object.keys(AVATAR_CATALOG);
  const pickAv = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
  const profile = {
    playerId: 'stu_' + Math.random().toString(36).slice(2, 10),
    name: '민수',
    avatar: pickAv,
    country: '🇰🇷'
  };
  localStorage.setItem('kor_quiz_student_profile', JSON.stringify(profile));
  return profile;
}

function saveMyStudentProfile() {
  localStorage.setItem('kor_quiz_student_profile', JSON.stringify(myStudentProfile));
}

// =========================================================================
// 실시간 동기화 브릿지 (PeerJS WebRTC + BroadcastChannel)
// =========================================================================
const bcChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel(`kor_quiz_room_${roomCodeParam}`)
  : null;

let peerInstance = null;
const peerConnections = new Map(); // studentPeerId -> DataConnection
let hostConnection = null;

function initMultiplayerNetworking() {
  // 1. 같은 컴퓨터 브라우저 탭 간 즉시 동기화 (BroadcastChannel)
  if (bcChannel) {
    bcChannel.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg || !msg.type) return;
      if (!isStudentUrlMode) {
        // 선생님(호스트) 화면이 학생 액션을 수신
        handleIncomingStudentAction(msg);
      }
      if (msg.type === 'game:state') {
        applyNewGameState(msg.state);
      }
    };
  }

  // 2. 스마트폰/태블릿/다른 PC 간 인터넷 실시간 동시접속 (PeerJS WebRTC)
  if (typeof Peer === 'undefined') return;

  const hostPeerId = `kor-quiz-3ena-room-${roomCodeParam}`;

  if (!isStudentUrlMode) {
    // 선생님(호스트) 모드로 Peer 등록
    try {
      peerInstance = new Peer(hostPeerId);
      peerInstance.on('open', () => {
        broadcastHostState();
      });
      peerInstance.on('connection', (conn) => {
        conn.on('open', () => {
          peerConnections.set(conn.peer, conn);
          conn.send({ type: 'game:state', state: buildPublicState() });
        });
        conn.on('data', (data) => {
          handleIncomingStudentAction(data);
        });
        conn.on('close', () => {
          peerConnections.delete(conn.peer);
        });
      });
      peerInstance.on('error', (err) => {
        // 이미 다른 탭에서 호스트가 열려있는 경우 클라이언트로 연결
        if (err.type === 'unavailable-id') {
          connectAsPeerClient(hostPeerId);
        }
      });
    } catch (e) {
      console.warn('Peer host init warning:', e);
    }
  } else {
    // 학생 전용 화면은 호스트 Peer에 연결
    connectAsPeerClient(hostPeerId);
  }
}

function connectAsPeerClient(hostPeerId) {
  try {
    peerInstance = new Peer();
    peerInstance.on('open', () => {
      hostConnection = peerInstance.connect(hostPeerId, { reliable: true });
      hostConnection.on('open', () => {
        if (isStudentJoined || isStudentUrlMode) {
          sendStudentAction({
            type: 'student:join',
            payload: {
              playerId: myStudentProfile.playerId,
              name: myStudentProfile.name,
              avatar: myStudentProfile.avatar,
              country: myStudentProfile.country
            }
          });
        }
      });
      hostConnection.on('data', (data) => {
        if (data && data.type === 'game:state') {
          applyNewGameState(data.state);
        }
      });
    });
  } catch (e) {
    console.warn('Peer client connect warning:', e);
  }
}

function sendStudentAction(actionMsg) {
  // 같은 화면(호스트)일 때는 직접 처리
  if (!isStudentUrlMode) {
    handleIncomingStudentAction(actionMsg);
  }
  // BroadcastChannel로 전송
  if (bcChannel) {
    bcChannel.postMessage(actionMsg);
  }
  // PeerJS WebRTC로 전송
  if (hostConnection && hostConnection.open) {
    hostConnection.send(actionMsg);
  }
}

function handleIncomingStudentAction(msg) {
  if (!msg || !msg.type) return;

  if (msg.type === 'student:request-state') {
    broadcastHostState();
    return;
  }

  if (msg.type === 'student:join') {
    const p = msg.payload || {};
    const id = p.playerId || ('stu_' + Date.now());
    const existing = hostPlayersMap[id];
    hostPlayersMap[id] = {
      id,
      name: String(p.name || '학생').trim().slice(0, 14),
      avatar: p.avatar || 'bear',
      country: p.country || '🌏',
      choice: existing ? existing.choice : 'CENTER',
      alive: existing ? existing.alive : true,
      falling: false,
      score: existing ? existing.score : 0,
      isBot: false,
      emote: null
    };
    broadcastHostState();
  } else if (msg.type === 'student:choose') {
    if (gameState.phase !== 'QUESTION') return;
    const { playerId, choice } = msg.payload || {};
    const player = hostPlayersMap[playerId];
    if (!player || !player.alive) return;
    if (choice !== 'A' && choice !== 'B') return;
    player.choice = choice;
    broadcastHostState();
  } else if (msg.type === 'student:emote') {
    const { playerId, emote } = msg.payload || {};
    const player = hostPlayersMap[playerId];
    if (!player) return;
    player.emote = String(emote || '').slice(0, 16);
    broadcastHostState();
    setTimeout(() => {
      if (hostPlayersMap[playerId] && hostPlayersMap[playerId].emote === emote) {
        hostPlayersMap[playerId].emote = null;
        broadcastHostState();
      }
    }, 2800);
  }
}

// =========================================================================
// 호스트(선생님) 게임 엔진 로직
// =========================================================================
function getActiveQuizSet() {
  return quizDatabase.sets.find(s => s.id === gameState.activeSetId) || quizDatabase.sets[0] || null;
}

function clearHostTimers() {
  if (hostTimerInterval) {
    clearInterval(hostTimerInterval);
    hostTimerInterval = null;
  }
  hostBotTimeouts.forEach(t => clearTimeout(t));
  hostBotTimeouts = [];
}

function buildPublicState() {
  const activeSet = getActiveQuizSet();
  const totalQuestions = activeSet ? activeSet.questions.length : 0;
  let safeQuestion = null;

  if (gameState.currentQuestion) {
    safeQuestion = {
      id: gameState.currentQuestion.id,
      category: gameState.currentQuestion.category || '어휘/문법',
      sentence: gameState.currentQuestion.sentence,
      translation: gameState.currentQuestion.translation || '',
      optionA: gameState.currentQuestion.optionA,
      optionB: gameState.currentQuestion.optionB,
      timeLimit: gameState.timeLimit,
      answer: ['REVEAL', 'DROP', 'WINNER'].includes(gameState.phase)
        ? gameState.currentQuestion.answer
        : null,
      explanation: ['REVEAL', 'DROP', 'WINNER'].includes(gameState.phase)
        ? gameState.currentQuestion.explanation
        : ''
    };
  }

  return {
    roomCode: gameState.roomCode,
    phase: gameState.phase,
    activeSetId: activeSet ? activeSet.id : null,
    activeSetTitle: activeSet ? activeSet.title : '',
    questionIndex: gameState.questionIndex,
    totalQuestions,
    currentQuestion: safeQuestion,
    timeLimit: gameState.timeLimit,
    timeRemaining: gameState.timeRemaining,
    overrideTimeLimit: gameState.overrideTimeLimit,
    players: Object.values(hostPlayersMap),
    lastEliminatedIds: gameState.lastEliminatedIds
  };
}

function broadcastHostState() {
  const pubState = buildPublicState();
  applyNewGameState(pubState);

  if (bcChannel) {
    bcChannel.postMessage({ type: 'game:state', state: pubState });
  }
  for (const conn of peerConnections.values()) {
    if (conn.open) {
      conn.send({ type: 'game:state', state: pubState });
    }
  }
}

function hostStartQuestionRound(index) {
  clearHostTimers();
  const activeSet = getActiveQuizSet();
  if (!activeSet || !activeSet.questions.length) return;

  const qIdx = Math.max(0, Math.min(index, activeSet.questions.length - 1));
  const question = activeSet.questions[qIdx];

  const aliveList = Object.values(hostPlayersMap).filter(p => p.alive);
  if (aliveList.length === 0 && Object.keys(hostPlayersMap).length > 0) {
    Object.values(hostPlayersMap).forEach(p => {
      p.alive = true;
      p.falling = false;
    });
  }

  Object.values(hostPlayersMap).forEach(p => {
    p.choice = 'CENTER';
    p.falling = false;
    p.emote = null;
  });

  const limit = gameState.overrideTimeLimit || Number(question.timeLimit) || 5;
  gameState.questionIndex = qIdx;
  gameState.currentQuestion = question;
  gameState.timeLimit = limit;
  gameState.timeRemaining = limit;
  gameState.phase = 'QUESTION';
  gameState.lastEliminatedIds = [];

  broadcastHostState();
  hostScheduleBotMoves();

  hostTimerInterval = setInterval(() => {
    gameState.timeRemaining = Math.max(0, Number((gameState.timeRemaining - 0.5).toFixed(1)));
    broadcastHostState();
    if (gameState.timeRemaining <= 0) {
      clearHostTimers();
      hostTriggerRevealAndDrop();
    }
  }, 500);
}

function hostScheduleBotMoves() {
  const bots = Object.values(hostPlayersMap).filter(p => p.isBot && p.alive);
  if (!bots.length || !gameState.currentQuestion) return;

  const correctAns = gameState.currentQuestion.answer;
  const wrongAns = correctAns === 'A' ? 'B' : 'A';
  const maxDelayMs = Math.max(1800, (gameState.timeLimit - 1.1) * 1000);

  bots.forEach((bot) => {
    const delay = 650 + Math.random() * (maxDelayMs - 650);
    const t = setTimeout(() => {
      if (gameState.phase !== 'QUESTION' || !hostPlayersMap[bot.id] || !hostPlayersMap[bot.id].alive) return;
      const pickCorrect = Math.random() < 0.68;
      hostPlayersMap[bot.id].choice = pickCorrect ? correctAns : wrongAns;
      broadcastHostState();
    }, delay);
    hostBotTimeouts.push(t);
  });
}

function hostTriggerRevealAndDrop() {
  clearHostTimers();
  if (!gameState.currentQuestion) return;

  gameState.phase = 'REVEAL';
  const answer = gameState.currentQuestion.answer;
  const eliminated = [];

  Object.values(hostPlayersMap).forEach(p => {
    if (!p.alive) return;
    if (p.choice === answer) {
      p.score = (p.score || 0) + 1;
      p.falling = false;
    } else {
      p.falling = true;
      eliminated.push(p.id);
    }
  });

  gameState.lastEliminatedIds = eliminated;
  broadcastHostState();

  const dropTimeout = setTimeout(() => {
    gameState.phase = 'DROP';
    broadcastHostState();

    const finishDropTimeout = setTimeout(() => {
      eliminated.forEach(id => {
        if (hostPlayersMap[id]) {
          hostPlayersMap[id].alive = false;
          hostPlayersMap[id].falling = false;
        }
      });
      broadcastHostState();
    }, 1800);
    hostBotTimeouts.push(finishDropTimeout);
  }, 1200);

  hostBotTimeouts.push(dropTimeout);
}

function hostAddBots(count = 5) {
  const existingNames = new Set(Object.values(hostPlayersMap).map(p => p.name));
  let added = 0;
  for (const profile of BOT_PROFILES) {
    if (added >= count) break;
    let botName = profile.name;
    if (existingNames.has(botName)) {
      botName = `${profile.name}${Math.floor(Math.random() * 9) + 2}`;
    }
    const id = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    hostPlayersMap[id] = {
      id,
      name: botName,
      avatar: profile.avatar,
      country: profile.country,
      choice: 'CENTER',
      alive: true,
      falling: false,
      score: 0,
      isBot: true,
      emote: null
    };
    existingNames.add(botName);
    added++;
  }
  if (gameState.phase === 'QUESTION') {
    hostScheduleBotMoves();
  }
  broadcastHostState();
}

// =========================================================================
// 초기 실행 및 상태 반영
// =========================================================================
window.addEventListener('DOMContentLoaded', async () => {
  if (isStudentUrlMode) {
    document.body.classList.add('student-only-mode');
    switchView('student-full');
  }

  // 로컬 서버에서 돌아가는 경우 LAN IP 정보 가져오기 시도
  try {
    const res = await fetch('./api/server-info');
    if (res.ok) {
      const info = await res.json();
      if (info && info.studentLanUrl && location.hostname === 'localhost') {
        serverInfo.studentLanUrl = info.studentLanUrl;
      }
    }
  } catch (_) {}

  updateInviteModalUI();
  renderStageSetDropdown();
  renderEditorSidebar();
  renderEditorMain();
  bindStageEvents();
  bindEditorEvents();
  bindModalEvents();

  initMultiplayerNetworking();

  if (!isStudentUrlMode) {
    broadcastHostState();
  } else {
    joinAsStudent();
    if (bcChannel) {
      bcChannel.postMessage({ type: 'student:request-state' });
    }
  }
  renderStudentControllers();
});

function applyNewGameState(newState) {
  if (!newState) return;

  if (newState.phase !== prevPhase) {
    if (newState.phase === 'REVEAL') sfx.reveal();
    if (newState.phase === 'DROP') sfx.fall();
    if (newState.phase === 'WINNER') sfx.win();
  }

  if (newState.phase === 'QUESTION') {
    const ceilSec = Math.ceil(newState.timeRemaining);
    if (ceilSec !== prevTimeInt && ceilSec > 0) {
      prevTimeInt = ceilSec;
      sfx.tick(ceilSec <= 2);
    }
  } else {
    prevTimeInt = null;
  }

  prevPhase = newState.phase;
  gameState = newState;

  renderStageUI();
  renderAvatarsOnStage();
  renderStudentControllers();
}

// =========================================================================
// 상단 탭 전환 & 선생님 컨트롤 이벤트
// =========================================================================
function switchView(tabName) {
  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.getElementById('view-stage').classList.toggle('active', tabName === 'stage');
  document.getElementById('view-editor').classList.toggle('active', tabName === 'editor');
  document.getElementById('view-student-full').classList.toggle('active', tabName === 'student-full');

  if (tabName === 'student-full' && !isStudentJoined) {
    joinAsStudent();
  }
}

function bindStageEvents() {
  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.tab));
  });

  const toggleMiniBtn = document.getElementById('toggleMiniPhoneBtn');
  const miniDrawer = document.getElementById('miniPhoneDrawer');
  toggleMiniBtn.addEventListener('click', () => {
    const isOpen = miniDrawer.classList.toggle('open');
    toggleMiniBtn.classList.toggle('active', isOpen);
    toggleMiniBtn.textContent = isOpen ? '📱 미니 학생폰 닫기' : '📱 미니 학생폰 켜기';
    if (isOpen && !isStudentJoined) {
      joinAsStudent();
      showToast('내 아바타가 게임 무대에 입장했습니다! 리모컨으로 움직여보세요.');
    }
  });

  document.getElementById('closeMiniPhoneBtn').addEventListener('click', () => {
    miniDrawer.classList.remove('open');
    toggleMiniBtn.classList.remove('active');
    toggleMiniBtn.textContent = '📱 미니 학생폰 켜기';
  });

  const soundBtn = document.getElementById('toggleSoundBtn');
  soundBtn.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    soundBtn.textContent = sfx.enabled ? '🔊 효과음 ON' : '🔇 효과음 OFF';
  });

  document.getElementById('stageSetSelect').addEventListener('change', (e) => {
    clearHostTimers();
    gameState.activeSetId = e.target.value;
    gameState.questionIndex = 0;
    gameState.phase = 'LOBBY';
    gameState.currentQuestion = null;
    Object.values(hostPlayersMap).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
      p.score = 0;
    });
    broadcastHostState();
    showToast('수업 세트가 변경되었습니다.');
  });

  document.getElementById('timeOverrideSelect').addEventListener('change', (e) => {
    const val = e.target.value ? Number(e.target.value) : null;
    gameState.overrideTimeLimit = val;
    broadcastHostState();
    showToast(val ? `모든 문제 제한 시간을 ${val}초로 고정했습니다.` : '문제별 설정된 제한 시간을 사용합니다.');
  });

  document.getElementById('addBotsBtn').addEventListener('click', () => {
    hostAddBots(5);
    showToast('🤖 가상 외국인 학생 5명이 출발선에 합류했습니다!');
  });

  document.getElementById('clearBotsBtn').addEventListener('click', () => {
    for (const id of Object.keys(hostPlayersMap)) {
      if (hostPlayersMap[id].isBot) delete hostPlayersMap[id];
    }
    broadcastHostState();
    showToast('가상 학생 봇을 모두 내보냈습니다.');
  });

  document.getElementById('reviveAllBtn').addEventListener('click', () => {
    Object.values(hostPlayersMap).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
    });
    gameState.lastEliminatedIds = [];
    broadcastHostState();
    showToast('⚡ 탈락했던 모든 아바타가 무대 위로 부활했습니다!');
  });

  document.getElementById('resetLobbyBtn').addEventListener('click', () => {
    clearHostTimers();
    gameState.phase = 'LOBBY';
    gameState.questionIndex = 0;
    gameState.currentQuestion = null;
    Object.values(hostPlayersMap).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
      p.score = 0;
    });
    broadcastHostState();
  });

  document.getElementById('startGameBtn').addEventListener('click', () => {
    if (Object.keys(hostPlayersMap).length === 0) {
      hostAddBots(5);
      showToast('🤖 테스트를 위해 가상 학생 5명이 함께 입장했습니다!');
    }
    hostStartQuestionRound(0);
  });

  document.getElementById('openNewStudentWinBtn').addEventListener('click', openNewStudentWindow);

  document.getElementById('revealNowBtn').addEventListener('click', () => {
    if (gameState.phase === 'QUESTION') {
      hostTriggerRevealAndDrop();
    }
  });

  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    const activeSet = getActiveQuizSet();
    if (!activeSet) return;
    if (gameState.questionIndex + 1 < activeSet.questions.length) {
      hostStartQuestionRound(gameState.questionIndex + 1);
    } else {
      clearHostTimers();
      gameState.phase = 'WINNER';
      broadcastHostState();
    }
  });

  document.getElementById('showWinnerBtn').addEventListener('click', () => {
    clearHostTimers();
    gameState.phase = 'WINNER';
    broadcastHostState();
  });

  document.getElementById('playAgainBtn').addEventListener('click', () => {
    clearHostTimers();
    gameState.phase = 'LOBBY';
    gameState.questionIndex = 0;
    gameState.currentQuestion = null;
    Object.values(hostPlayersMap).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
      p.score = 0;
    });
    broadcastHostState();
  });

  document.getElementById('winnerToEditorBtn').addEventListener('click', () => {
    clearHostTimers();
    gameState.phase = 'LOBBY';
    broadcastHostState();
    switchView('editor');
  });
}

function openNewStudentWindow() {
  const url = getStudentInviteUrl(gameState.roomCode);
  window.open(url, '_blank', 'width=430,height=740');
}

// =========================================================================
// 교실 메인 스테이지 UI 렌더링
// =========================================================================
function renderStageSetDropdown() {
  const select = document.getElementById('stageSetSelect');
  if (!select) return;
  select.innerHTML = quizDatabase.sets.map(s =>
    `<option value="${escapeHtml(s.id)}" ${s.id === (gameState.activeSetId || quizDatabase.activeSetId) ? 'selected' : ''}>
      ${escapeHtml(s.title)} (${s.questions.length}문항)
    </option>`
  ).join('');
}

function renderStageUI() {
  const totalCount = gameState.players.length;
  const alivePlayers = gameState.players.filter(p => p.alive);
  const eliminatedPlayers = gameState.players.filter(p => !p.alive);

  document.getElementById('totalPlayerCount').textContent = totalCount;
  document.getElementById('alivePlayerCount').textContent = alivePlayers.length;
  document.getElementById('lobbyRoomCode').textContent = gameState.roomCode;

  const setSelect = document.getElementById('stageSetSelect');
  if (setSelect && gameState.activeSetId && setSelect.value !== gameState.activeSetId) {
    setSelect.value = gameState.activeSetId;
  }

  const boardLobby = document.getElementById('boardLobby');
  const boardActive = document.getElementById('boardActive');
  const winnerOverlay = document.getElementById('winnerOverlay');

  if (gameState.phase === 'LOBBY') {
    boardLobby.classList.remove('hidden');
    boardActive.classList.add('hidden');
    winnerOverlay.classList.add('hidden');
  } else {
    boardLobby.classList.add('hidden');
    boardActive.classList.remove('hidden');
    winnerOverlay.classList.toggle('hidden', gameState.phase !== 'WINNER');
  }

  const q = gameState.currentQuestion;
  if (q) {
    document.getElementById('qNumberBadge').textContent = `문제 ${gameState.questionIndex + 1} / ${gameState.totalQuestions}`;
    document.getElementById('qCategoryBadge').textContent = q.category || '한국어 퀴즈';

    const timerPill = document.getElementById('timerPill');
    const timerNum = document.getElementById('timerNumber');
    timerNum.textContent = Number(gameState.timeRemaining).toFixed(1);
    timerPill.classList.toggle('urgent', gameState.phase === 'QUESTION' && gameState.timeRemaining <= 2.0);

    const pct = Math.max(0, Math.min(100, (gameState.timeRemaining / (gameState.timeLimit || 5)) * 100));
    document.getElementById('timerProgressBar').style.width = `${pct}%`;

    const isRevealed = ['REVEAL', 'DROP', 'WINNER'].includes(gameState.phase);
    const correctWord = q.answer === 'A' ? q.optionA : q.optionB;
    const slotHtml = isRevealed
      ? `<span class="blank-slot revealed">${escapeHtml(correctWord)}</span>`
      : `<span class="blank-slot">?</span>`;

    const formattedSentence = escapeHtml(q.sentence).replace(/\[\s*_+\s*\]|_{2,}/g, slotHtml);
    document.getElementById('sentenceBox').innerHTML = formattedSentence;
    document.getElementById('sentenceTranslation').textContent = q.translation || '';

    const expBanner = document.getElementById('explanationBanner');
    if (isRevealed && q.explanation) {
      expBanner.classList.remove('hidden');
      document.getElementById('explanationText').textContent = q.explanation;
    } else {
      expBanner.classList.add('hidden');
    }

    const revealBtn = document.getElementById('revealNowBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const winBtn = document.getElementById('showWinnerBtn');

    revealBtn.classList.toggle('hidden', gameState.phase !== 'QUESTION');
    const hasMoreQuestions = gameState.questionIndex + 1 < gameState.totalQuestions;
    nextBtn.classList.toggle('hidden', !isRevealed || !hasMoreQuestions);
    winBtn.classList.toggle('hidden', !isRevealed);
  }

  const zoneAWord = document.getElementById('zoneAWord');
  const zoneBWord = document.getElementById('zoneBWord');
  zoneAWord.textContent = q ? q.optionA : '선택지 A';
  zoneBWord.textContent = q ? q.optionB : '선택지 B';

  const countA = alivePlayers.filter(p => p.choice === 'A').length;
  const countB = alivePlayers.filter(p => p.choice === 'B').length;
  const countCenter = alivePlayers.filter(p => p.choice !== 'A' && p.choice !== 'B').length;

  document.getElementById('zoneACount').textContent = `${countA}명`;
  document.getElementById('zoneBCount').textContent = `${countB}명`;
  document.getElementById('zoneCenterCount').textContent = `${countCenter}명`;

  const platformA = document.getElementById('platformA');
  const platformB = document.getElementById('platformB');
  const platformCenter = document.getElementById('platformCenter');

  [platformA, platformB, platformCenter].forEach(el => {
    el.classList.remove('is-correct', 'is-warning', 'is-dropped');
  });

  if (q && (gameState.phase === 'REVEAL' || gameState.phase === 'DROP')) {
    const correctZone = q.answer === 'A' ? platformA : platformB;
    const wrongZone = q.answer === 'A' ? platformB : platformA;

    correctZone.classList.add('is-correct');
    if (gameState.phase === 'REVEAL') {
      wrongZone.classList.add('is-warning');
      if (countCenter > 0) platformCenter.classList.add('is-warning');
    } else if (gameState.phase === 'DROP') {
      wrongZone.classList.add('is-dropped');
      if (countCenter > 0) platformCenter.classList.add('is-dropped');
    }
  }

  const banner = document.getElementById('stageStatusBanner');
  if (gameState.phase === 'LOBBY') {
    banner.textContent = `🐾 대기실: 현재 ${totalCount}명의 아바타가 준비 중입니다!`;
  } else if (gameState.phase === 'QUESTION') {
    banner.textContent = `🏃‍♂️ 빈칸에 들어갈 정답(A 또는 B)으로 걸어가서 앞에 서세요! (${Number(gameState.timeRemaining).toFixed(1)}초)`;
  } else if (gameState.phase === 'REVEAL') {
    banner.textContent = `🥁 정답 공개! 정답은 [${q ? q.answer : ''}] 입니다! 오답 위치를 확인합니다...`;
  } else if (gameState.phase === 'DROP') {
    banner.textContent = `🕳️ 오답 구역 바닥이 열립니다! 오답 아바타들이 아래로 떨어집니다!`;
  } else if (gameState.phase === 'WINNER') {
    banner.textContent = `👑 게임 종료! 최후까지 살아남은 우승 아바타를 축하해주세요!`;
  }

  document.getElementById('eliminatedCount').textContent = eliminatedPlayers.length;
  const elimList = document.getElementById('eliminatedList');
  if (eliminatedPlayers.length === 0) {
    elimList.innerHTML = `<span class="elim-empty">아직 떨어진 아바타가 없어요!</span>`;
  } else {
    elimList.innerHTML = eliminatedPlayers.map(p => {
      const av = AVATAR_CATALOG[p.avatar] || AVATAR_CATALOG.bear;
      return `<span class="elim-chip">${av.emoji} ${escapeHtml(p.name)}</span>`;
    }).join('');
  }

  if (gameState.phase === 'WINNER') {
    renderWinnerPodium();
  }
}

// =========================================================================
// 아바타 위치 계산 & 걷기/서있기/추락 애니메이션 제어
// =========================================================================
function renderAvatarsOnStage() {
  const layer = document.getElementById('avatarsLayer');
  if (!layer) return;

  const visiblePlayers = gameState.players.filter(p => p.alive || p.falling);
  const visibleIds = new Set(visiblePlayers.map(p => p.id));

  for (const [pid, record] of avatarDomMap.entries()) {
    if (!visibleIds.has(pid)) {
      record.el.remove();
      avatarDomMap.delete(pid);
    }
  }

  const groups = { A: [], CENTER: [], B: [] };
  visiblePlayers.forEach(p => {
    const key = (p.choice === 'A' || p.choice === 'B') ? p.choice : 'CENTER';
    groups[key].push(p);
  });

  ['A', 'CENTER', 'B'].forEach(zoneKey => {
    const list = groups[zoneKey];
    list.forEach((player, idx) => {
      const coords = computeAvatarPosition(zoneKey, idx, list.length);
      updateOrCreateAvatarDom(layer, player, coords);
    });
  });
}

function computeAvatarPosition(zoneKey, index, totalInZone) {
  let minX = 40, maxX = 60;
  if (zoneKey === 'A') { minX = 7; maxX = 32; }
  if (zoneKey === 'B') { minX = 68; maxX = 93; }

  const cols = zoneKey === 'CENTER' ? 3 : 4;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const itemsInThisRow = Math.min(cols, totalInZone - row * cols);

  const spanX = maxX - minX;
  const stepX = itemsInThisRow > 1 ? spanX / (itemsInThisRow + 0.6) : 0;
  const centerX = (minX + maxX) / 2;
  const offsetX = itemsInThisRow > 1
    ? (col - (itemsInThisRow - 1) / 2) * stepX
    : 0;

  const xPct = centerX + offsetX;
  const yPct = Math.min(82, 54 + row * 13 + (col % 2) * 3);

  return { xPct, yPct };
}

function updateOrCreateAvatarDom(layer, player, { xPct, yPct }) {
  const av = AVATAR_CATALOG[player.avatar] || AVATAR_CATALOG.bear;
  let record = avatarDomMap.get(player.id);

  if (!record) {
    const el = document.createElement('div');
    el.className = 'avatar-actor';
    el.style.setProperty('--av-color', av.headColor);
    el.style.setProperty('--av-shirt', av.shirtColor);
    el.style.left = `${xPct}%`;
    el.style.top = `${yPct}%`;

    el.innerHTML = `
      <div class="avatar-bubble hidden"></div>
      <div class="avatar-nametag">
        <span class="av-flag">${escapeHtml(player.country || '🌏')}</span>
        <span class="av-name">${escapeHtml(player.name)}</span>
      </div>
      <div class="avatar-figure">
        <div class="avatar-head">${av.emoji}</div>
        <div class="avatar-torso">
          <div class="avatar-arm left"></div>
          <div class="avatar-arm right"></div>
        </div>
        <div class="avatar-legs">
          <div class="avatar-leg left"></div>
          <div class="avatar-leg right"></div>
        </div>
      </div>
      <div class="avatar-shadow"></div>
    `;

    layer.appendChild(el);
    record = { el, lastChoice: player.choice, walkTimer: null };
    avatarDomMap.set(player.id, record);
  }

  const { el } = record;
  el.style.setProperty('--av-color', av.headColor);
  el.style.setProperty('--av-shirt', av.shirtColor);
  el.classList.toggle('is-me', player.id === myStudentProfile.playerId);

  el.querySelector('.av-flag').textContent = player.country || '🌏';
  el.querySelector('.av-name').textContent = player.name;

  if (record.lastChoice !== player.choice) {
    record.lastChoice = player.choice;
    el.classList.add('is-walking');
    sfx.step();
    if (record.walkTimer) clearTimeout(record.walkTimer);
    record.walkTimer = setTimeout(() => {
      el.classList.remove('is-walking');
    }, 680);
  }

  el.style.left = `${xPct}%`;
  el.style.top = `${yPct}%`;

  const q = gameState.currentQuestion;
  const isRightAnswer = q && player.choice === q.answer;
  const headEl = el.querySelector('.avatar-head');
  const bubbleEl = el.querySelector('.avatar-bubble');

  el.classList.remove('is-celebrating', 'is-panicking', 'is-falling');
  headEl.textContent = av.emoji;

  let bubbleText = player.emote || '';

  if (gameState.phase === 'REVEAL' && q) {
    if (isRightAnswer) {
      el.classList.add('is-celebrating');
      bubbleText = '정답! ✨';
    } else {
      el.classList.add('is-panicking');
      headEl.textContent = '😱';
      bubbleText = player.choice === 'CENTER' ? '시간 초과?! 💦' : '헉! 오답?! 💦';
    }
  } else if (gameState.phase === 'DROP' && q) {
    if (isRightAnswer) {
      el.classList.add('is-celebrating');
      bubbleText = '살았다! 🎉';
    } else if (player.falling) {
      el.classList.add('is-falling');
      headEl.textContent = '😵';
      bubbleText = '으아아악~!!';
    }
  }

  if (bubbleText) {
    bubbleEl.textContent = bubbleText;
    bubbleEl.classList.remove('hidden');
  } else {
    bubbleEl.classList.add('hidden');
  }
}

function renderWinnerPodium() {
  const survivors = gameState.players.filter(p => p.alive);
  const podium = document.getElementById('winnerPodium');
  const subtitle = document.getElementById('winnerSubtitle');

  let winners = survivors;
  if (winners.length === 0 && gameState.players.length > 0) {
    const maxScore = Math.max(...gameState.players.map(p => p.score || 0));
    winners = gameState.players.filter(p => (p.score || 0) === maxScore);
    subtitle.textContent = `마지막 라운드에 모두 떨어졌지만, 가장 많은 문제를 맞힌 최다 득점 아바타입니다!`;
  } else {
    subtitle.textContent = `총 ${gameState.players.length}명 중 끝까지 살아남은 ${winners.length}명의 한국어 서바이벌 챔피언!`;
  }

  if (winners.length === 0) {
    podium.innerHTML = `<p>참여한 아바타가 없습니다.</p>`;
    return;
  }

  podium.innerHTML = winners.map(w => {
    const av = AVATAR_CATALOG[w.avatar] || AVATAR_CATALOG.bear;
    return `
      <div class="winner-hero">
        <div class="winner-hero-crown">👑</div>
        <div class="winner-hero-emoji">${av.emoji}</div>
        <div class="winner-hero-name">${escapeHtml(w.country || '')} ${escapeHtml(w.name)}</div>
        <div class="winner-hero-score">정답 ${w.score || 0}회 성공!</div>
      </div>
    `;
  }).join('');
}

// =========================================================================
// 학생용 모바일 컨트롤러 렌더링
// =========================================================================
function joinAsStudent() {
  isStudentJoined = true;
  sendStudentAction({
    type: 'student:join',
    payload: {
      playerId: myStudentProfile.playerId,
      name: myStudentProfile.name,
      avatar: myStudentProfile.avatar,
      country: myStudentProfile.country
    }
  });
  renderStudentControllers();
}

function renderStudentControllers() {
  const mounts = [
    document.getElementById('studentFullMount'),
    document.getElementById('studentMiniMount')
  ];

  const meOnServer = gameState.players.find(p => p.id === myStudentProfile.playerId);
  const av = AVATAR_CATALOG[myStudentProfile.avatar] || AVATAR_CATALOG.bear;
  const q = gameState.currentQuestion;

  mounts.forEach((mount) => {
    if (!mount) return;

    if (!isStudentJoined || isEditingStudentProfile) {
      mount.innerHTML = `
        <div class="st-box">
          <h3 style="text-align:center; font-family:var(--font-display); font-size:1.3rem;">
            🐾 내 귀여운 아바타 만들기
          </h3>
          <div class="field-group">
            <label>이름 (외국인 학생 이름/별명)</label>
            <input type="text" class="field-input st-name-input" value="${escapeHtml(myStudentProfile.name)}" maxlength="12" placeholder="이름을 입력하세요" />
          </div>
          <div class="field-group">
            <label>국기 배지 선택</label>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${COUNTRY_LIST.map(flag => `
                <button type="button" class="btn-outline-sm st-flag-btn" data-flag="${flag}" style="font-size:1.1rem; padding:4px 8px; ${myStudentProfile.country === flag ? 'border-color:#4f46e5; background:#eef2ff;' : ''}">
                  ${flag}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="field-group">
            <label>캐릭터 선택</label>
            <div class="avatar-grid">
              ${Object.entries(AVATAR_CATALOG).map(([key, info]) => `
                <button type="button" class="avatar-pick-btn ${myStudentProfile.avatar === key ? 'selected' : ''}" data-avatar="${key}">
                  <div>${info.emoji}</div>
                  <span>${info.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-block st-save-join-btn" style="padding:12px;">
            🚀 이 아바타로 게임 입장하기!
          </button>
        </div>
      `;

      mount.querySelectorAll('.st-flag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          myStudentProfile.country = btn.dataset.flag;
          renderStudentControllers();
        });
      });

      mount.querySelectorAll('.avatar-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          myStudentProfile.avatar = btn.dataset.avatar;
          renderStudentControllers();
        });
      });

      mount.querySelector('.st-save-join-btn').addEventListener('click', () => {
        const nameVal = mount.querySelector('.st-name-input').value.trim() || '학생';
        myStudentProfile.name = nameVal;
        saveMyStudentProfile();
        isEditingStudentProfile = false;
        joinAsStudent();
      });

      return;
    }

    const isAlive = meOnServer ? meOnServer.alive : true;
    const myChoice = meOnServer ? meOnServer.choice : 'CENTER';

    let centerContentHtml = '';

    if (!isAlive) {
      centerContentHtml = `
        <div class="st-question-prompt" style="background:#fff1f2; color:#be123c;">
          🕳️ 아쉽게도 오답 구역에서 떨어졌어요!<br/>
          <small style="color:#64748b;">선생님이 [전원 부활]이나 새 게임을 시작하면 다시 참여할 수 있어요.</small>
        </div>
      `;
    } else if (gameState.phase === 'LOBBY') {
      centerContentHtml = `
        <div class="st-question-prompt">
          ✨ 출발선에서 대기 중입니다!<br/>
          <small style="color:#64748b;">선생님이 문제를 시작하면 A / B 버튼이 열립니다.</small>
        </div>
      `;
    } else if (gameState.phase === 'QUESTION' && q) {
      centerContentHtml = `
        <div class="st-question-prompt">
          <div style="font-size:0.8rem; color:#4f46e5; margin-bottom:4px;">⏰ 남은 시간: ${Number(gameState.timeRemaining).toFixed(1)}초</div>
          ${escapeHtml(q.sentence)}
        </div>
        <div class="st-ab-buttons">
          <button type="button" class="st-choice-btn btn-a ${myChoice === 'A' ? 'selected' : ''}" data-choice="A">
            <span class="st-choice-letter">A</span>
            <span class="st-choice-word">${escapeHtml(q.optionA)}</span>
          </button>
          <button type="button" class="st-choice-btn btn-b ${myChoice === 'B' ? 'selected' : ''}" data-choice="B">
            <span class="st-choice-letter">B</span>
            <span class="st-choice-word">${escapeHtml(q.optionB)}</span>
          </button>
        </div>
        <p style="text-align:center; font-size:0.8rem; color:#64748b;">
          ${myChoice === 'CENTER' ? '👆 버튼을 누르면 아바타가 선택한 정답 앞으로 걸어갑니다!' : `🏃 현재 [${myChoice}] 구역 앞에 서 있습니다!`}
        </p>
      `;
    } else if ((gameState.phase === 'REVEAL' || gameState.phase === 'DROP') && q) {
      const wonRound = myChoice === q.answer;
      centerContentHtml = `
        <div class="st-question-prompt" style="background:${wonRound ? '#ecfdf5' : '#fef2f2'}; color:${wonRound ? '#047857' : '#b91c1c'};">
          ${wonRound ? '🎉 정답입니다! 살아남았어요!' : '😱 오답입니다! 바닥이 열립니다!'}
          <div style="margin-top:6px; font-size:0.86rem; color:#334155;">정답: <strong>${q.answer}. ${escapeHtml(q.answer === 'A' ? q.optionA : q.optionB)}</strong></div>
        </div>
      `;
    } else if (gameState.phase === 'WINNER') {
      centerContentHtml = `
        <div class="st-question-prompt" style="background:#fef3c7; color:#92400e;">
          👑 최후의 서바이벌 우승자 발표 중!
        </div>
      `;
    }

    mount.innerHTML = `
      <div class="st-box">
        <div class="st-profile-bar">
          <div class="st-me-info">
            <span class="st-me-emoji">${av.emoji}</span>
            <div>
              <div class="st-me-name">${escapeHtml(myStudentProfile.country)} ${escapeHtml(myStudentProfile.name)}</div>
              <div class="st-me-status" style="color:${isAlive ? '#059669' : '#e11d48'};">
                ${isAlive ? '🌟 생존 중' : '☁️ 탈락 (관전 중)'} · 점수 ${meOnServer ? meOnServer.score : 0}점
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-outline-sm st-edit-profile-btn">아바타 변경</button>
        </div>

        ${centerContentHtml}

        <div class="field-group">
          <label>💬 내 아바타 머리 위 말풍선 보내기</label>
          <div class="st-emote-row">
            <button type="button" class="st-emote-btn" data-emote="안녕하세요! 👋">안녕👋</button>
            <button type="button" class="st-emote-btn" data-emote="자신 있어요! ✨">자신있어✨</button>
            <button type="button" class="st-emote-btn" data-emote="헷갈려요 💦">헷갈려💦</button>
            <button type="button" class="st-emote-btn" data-emote="한국어 최고! ❤️">최고❤️</button>
          </div>
        </div>
      </div>
    `;

    const editBtn = mount.querySelector('.st-edit-profile-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        isEditingStudentProfile = true;
        renderStudentControllers();
      });
    }

    mount.querySelectorAll('.st-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sendStudentAction({
          type: 'student:choose',
          payload: {
            playerId: myStudentProfile.playerId,
            choice: btn.dataset.choice
          }
        });
      });
    });

    mount.querySelectorAll('.st-emote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sendStudentAction({
          type: 'student:emote',
          payload: {
            playerId: myStudentProfile.playerId,
            emote: btn.dataset.emote
          }
        });
      });
    });
  });
}

// =========================================================================
// 선생님용 수업 문장 & 문제 편집기 (VIEW 2)
// =========================================================================
function getEditingSet() {
  return quizDatabase.sets.find(s => s.id === editingSetId) || quizDatabase.sets[0] || null;
}

function renderEditorSidebar() {
  const listEl = document.getElementById('editorSetList');
  if (!listEl) return;

  listEl.innerHTML = quizDatabase.sets.map(s => `
    <li class="set-item ${s.id === editingSetId ? 'active' : ''}" data-id="${escapeHtml(s.id)}">
      <div class="set-item-title">${escapeHtml(s.title)}</div>
      <div class="set-item-meta">문항 ${s.questions.length}개</div>
    </li>
  `).join('');

  listEl.querySelectorAll('.set-item').forEach(item => {
    item.addEventListener('click', () => {
      syncCurrentSetFromInputs();
      editingSetId = item.dataset.id;
      renderEditorSidebar();
      renderEditorMain();
    });
  });
}

function renderEditorMain() {
  const set = getEditingSet();
  if (!set) return;

  document.getElementById('editSetTitle').value = set.title || '';
  document.getElementById('editSetDesc').value = set.description || '';
  document.getElementById('editorQuestionCount').textContent = set.questions.length;

  const container = document.getElementById('questionsEditorList');
  container.innerHTML = set.questions.map((q, idx) => `
    <div class="q-editor-card" data-qindex="${idx}">
      <div class="q-card-top">
        <span class="q-num-label">문항 #${idx + 1}</span>
        <div class="q-top-controls">
          <button type="button" class="btn btn-outline-sm insert-blank-btn" data-qindex="${idx}">
            + [ _____ ] 빈칸 기호 넣기
          </button>
          <button type="button" class="btn btn-danger-outline btn-sm delete-q-btn" data-qindex="${idx}">
            삭제
          </button>
        </div>
      </div>

      <div class="q-row">
        <div class="field-group">
          <label>빈칸 문제 문장 (빈칸 자리에 <code>[ _____ ]</code>를 넣어주세요)</label>
          <input type="text" class="field-input q-sentence-input" value="${escapeHtml(q.sentence)}" placeholder="예: 날씨가 추우니까 따뜻한 옷을 [ _____ ]." />
        </div>
        <div class="field-group" style="width:140px;">
          <label>문법/품사 분류</label>
          <input type="text" class="field-input q-category-input" value="${escapeHtml(q.category || '어휘/문법')}" placeholder="예: 조사, 접속사" />
        </div>
      </div>

      <div class="q-options-grid">
        <div class="field-group">
          <label>🔵 보기 A</label>
          <input type="text" class="field-input q-opt-a" value="${escapeHtml(q.optionA)}" placeholder="예: 입으세요" />
        </div>
        <div class="field-group">
          <label>🔴 보기 B</label>
          <input type="text" class="field-input q-opt-b" value="${escapeHtml(q.optionB)}" placeholder="예: 먹으세요" />
        </div>
        <div class="field-group">
          <label>✅ 정답 구역</label>
          <select class="field-input q-answer">
            <option value="A" ${q.answer === 'A' ? 'selected' : ''}>A 구역이 정답</option>
            <option value="B" ${q.answer === 'B' ? 'selected' : ''}>B 구역이 정답</option>
          </select>
        </div>
        <div class="field-group">
          <label>⏱️ 제한 시간</label>
          <select class="field-input q-timelimit">
            <option value="5" ${Number(q.timeLimit) === 5 ? 'selected' : ''}>5초 (스피드)</option>
            <option value="10" ${Number(q.timeLimit) === 10 ? 'selected' : ''}>10초 (여유)</option>
          </select>
        </div>
      </div>

      <div class="q-row" style="grid-template-columns: 1fr 1fr;">
        <div class="field-group">
          <label>🌏 영어/외국어 번역 힌트 (선택사항)</label>
          <input type="text" class="field-input q-translation" value="${escapeHtml(q.translation || '')}" placeholder="예: It's cold, so please wear warm clothes." />
        </div>
        <div class="field-group">
          <label>💡 정답 공개 시 보여줄 해설 메모 (선택사항)</label>
          <input type="text" class="field-input q-explanation" value="${escapeHtml(q.explanation || '')}" placeholder="예: 옷은 '입다', 신발은 '신다'를 사용합니다." />
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.insert-blank-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.q-editor-card');
      const input = card.querySelector('.q-sentence-input');
      const start = input.selectionStart || input.value.length;
      const end = input.selectionEnd || input.value.length;
      input.value = input.value.slice(0, start) + '[ _____ ]' + input.value.slice(end);
      input.focus();
    });
  });

  container.querySelectorAll('.delete-q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      syncCurrentSetFromInputs();
      const idx = Number(btn.dataset.qindex);
      const currentSet = getEditingSet();
      if (currentSet.questions.length <= 1) {
        showToast('최소 1개 이상의 문항이 있어야 합니다.');
        return;
      }
      currentSet.questions.splice(idx, 1);
      renderEditorSidebar();
      renderEditorMain();
    });
  });
}

function syncCurrentSetFromInputs() {
  const set = getEditingSet();
  if (!set) return;

  const titleEl = document.getElementById('editSetTitle');
  const descEl = document.getElementById('editSetDesc');
  if (titleEl) set.title = titleEl.value.trim() || '이름 없는 수업 세트';
  if (descEl) set.description = descEl.value.trim();

  const cards = document.querySelectorAll('.q-editor-card');
  const updatedQuestions = [];
  cards.forEach((card, i) => {
    const existingId = set.questions[i] ? set.questions[i].id : `q_${Date.now()}_${i}`;
    updatedQuestions.push({
      id: existingId,
      category: card.querySelector('.q-category-input').value.trim() || '어휘/문법',
      sentence: card.querySelector('.q-sentence-input').value.trim() || '빈칸 [ _____ ] 문장을 입력하세요.',
      optionA: card.querySelector('.q-opt-a').value.trim() || '보기 A',
      optionB: card.querySelector('.q-opt-b').value.trim() || '보기 B',
      answer: card.querySelector('.q-answer').value === 'B' ? 'B' : 'A',
      timeLimit: Number(card.querySelector('.q-timelimit').value) || 5,
      translation: card.querySelector('.q-translation').value.trim(),
      explanation: card.querySelector('.q-explanation').value.trim()
    });
  });

  if (updatedQuestions.length > 0) {
    set.questions = updatedQuestions;
  }
}

function saveQuizzesAndApply() {
  syncCurrentSetFromInputs();
  quizDatabase.activeSetId = editingSetId;
  gameState.activeSetId = editingSetId;
  saveQuizDatabaseToStorage();
  renderStageSetDropdown();
  renderEditorSidebar();
  broadcastHostState();
  showToast('💾 수업 문장이 저장되어 게임에 바로 반영되었습니다!');
}

function bindEditorEvents() {
  document.getElementById('addNewSetBtn').addEventListener('click', () => {
    syncCurrentSetFromInputs();
    const newId = 'set_' + Date.now();
    quizDatabase.sets.push({
      id: newId,
      title: `✨ 새 한국어 수업 (${quizDatabase.sets.length + 1})`,
      description: '수업에 맞게 문장과 단어를 자유롭게 수정하세요.',
      questions: [
        {
          id: 'q_' + Date.now(),
          category: '형용사/동사',
          sentence: '한국어 공부가 정말 [ _____ ]!',
          translation: 'Studying Korean is really fun!',
          optionA: '재미있어요',
          optionB: '짜증나요',
          answer: 'A',
          timeLimit: 5,
          explanation: "즐겁고 흥미로울 때는 형용사 '재미있다(재미있어요)'를 씁니다."
        }
      ]
    });
    editingSetId = newId;
    renderEditorSidebar();
    renderEditorMain();
    showToast('새 수업 세트가 생성되었습니다.');
  });

  document.getElementById('addQuestionBtn').addEventListener('click', () => {
    syncCurrentSetFromInputs();
    const set = getEditingSet();
    if (!set) return;
    set.questions.push({
      id: 'q_' + Date.now(),
      category: '어휘/문법',
      sentence: '빈칸에 알맞은 말을 고르세요: [ _____ ]',
      translation: '',
      optionA: '정답 단어',
      optionB: '오답 단어',
      answer: 'A',
      timeLimit: 5,
      explanation: ''
    });
    renderEditorSidebar();
    renderEditorMain();
  });

  document.getElementById('deleteSetBtn').addEventListener('click', () => {
    if (quizDatabase.sets.length <= 1) {
      showToast('최소 1개의 수업 세트는 남아있어야 합니다.');
      return;
    }
    quizDatabase.sets = quizDatabase.sets.filter(s => s.id !== editingSetId);
    editingSetId = quizDatabase.sets[0].id;
    renderEditorSidebar();
    renderEditorMain();
    saveQuizzesAndApply();
  });

  document.getElementById('saveAllQuizzesBtn').addEventListener('click', saveQuizzesAndApply);

  document.getElementById('exportQuizzesBtn').addEventListener('click', () => {
    syncCurrentSetFromInputs();
    const blob = new Blob([JSON.stringify(quizDatabase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `한국어수업_퀴즈세트_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('importQuizzesInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && Array.isArray(parsed.sets)) {
          quizDatabase = parsed;
          editingSetId = quizDatabase.sets[0].id;
          renderEditorSidebar();
          renderEditorMain();
          saveQuizzesAndApply();
        }
      } catch (_) {
        showToast('올바른 퀴즈 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  });
}

// =========================================================================
// 모달 이벤트 (QR 초대 & 대량 텍스트 붙여넣기)
// =========================================================================
function updateInviteModalUI() {
  const url = serverInfo.studentLanUrl || getStudentInviteUrl(gameState.roomCode);
  const input = document.getElementById('studentLanUrlInput');
  const qrImg = document.getElementById('qrCodeImage');
  const codeEl = document.getElementById('modalRoomCode');

  if (input) input.value = url;
  if (codeEl) codeEl.textContent = gameState.roomCode || '1004';
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }
}

function bindModalEvents() {
  const inviteModal = document.getElementById('inviteModal');
  document.getElementById('openInviteModalBtn').addEventListener('click', () => {
    updateInviteModalUI();
    inviteModal.classList.remove('hidden');
  });
  document.getElementById('closeInviteModalBtn').addEventListener('click', () => {
    inviteModal.classList.add('hidden');
  });
  document.getElementById('copyLanUrlBtn').addEventListener('click', () => {
    const input = document.getElementById('studentLanUrlInput');
    navigator.clipboard.writeText(input.value);
    showToast('학생 접속 주소가 복사되었습니다!');
  });
  document.getElementById('modalOpenStudentWinBtn').addEventListener('click', openNewStudentWindow);

  const bulkModal = document.getElementById('bulkPasteModal');
  document.getElementById('openBulkPasteModalBtn').addEventListener('click', () => {
    bulkModal.classList.remove('hidden');
  });
  document.getElementById('closeBulkPasteModalBtn').addEventListener('click', () => {
    bulkModal.classList.add('hidden');
  });
  document.getElementById('cancelBulkPasteBtn').addEventListener('click', () => {
    bulkModal.classList.add('hidden');
  });

  document.getElementById('confirmBulkPasteBtn').addEventListener('click', () => {
    syncCurrentSetFromInputs();
    const raw = document.getElementById('bulkPasteTextarea').value.trim();
    if (!raw) return;

    const set = getEditingSet();
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let added = 0;

    lines.forEach((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const sentence = parts[0].includes('[') || parts[0].includes('___')
          ? parts[0].replace(/_{2,}/g, '[ _____ ]')
          : `${parts[0]} [ _____ ]`;
        const optionA = parts[1] || '보기 A';
        const optionB = parts[2] || '보기 B';
        const ans = (parts[3] || 'A').toUpperCase() === 'B' ? 'B' : 'A';
        const time = Number(parts[4]) === 10 ? 10 : 5;

        set.questions.push({
          id: `q_bulk_${Date.now()}_${idx}`,
          category: '어휘/문법',
          sentence,
          translation: '',
          optionA,
          optionB,
          answer: ans,
          timeLimit: time,
          explanation: ''
        });
        added++;
      }
    });

    if (added > 0) {
      document.getElementById('bulkPasteTextarea').value = '';
      bulkModal.classList.add('hidden');
      renderEditorSidebar();
      renderEditorMain();
      showToast(`${added}개의 문장이 현재 세트에 추가되었습니다!`);
    } else {
      showToast('형식에 맞게 입력해주세요. (문장 | 보기A | 보기B | 정답 | 시간)');
    }
  });
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3000);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
