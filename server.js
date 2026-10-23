const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3400;
const DATA_FILE = path.join(__dirname, 'data', 'quizzes.json');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Find local LAN IPv4 address so smartphones on same Wi-Fi can connect
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push(iface.address);
      }
    }
  }
  // Prefer 192.168.x.x or 10.x.x.x
  const preferred = candidates.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.'));
  return preferred || candidates[0] || 'localhost';
}

// Helper: Read & Write Quizzes
function loadQuizzes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Quiz file read error:', err);
  }
  return { activeSetId: 'set-1', sets: [] };
}

function saveQuizzes(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Quiz file write error:', err);
    return false;
  }
}

// REST Endpoints
app.get('/api/server-info', (req, res) => {
  const ip = getLocalIpAddress();
  res.json({
    ip,
    port: PORT,
    roomCode: gameState.roomCode,
    lanUrl: `http://${ip}:${PORT}`,
    studentLanUrl: `http://${ip}:${PORT}/?role=student&room=${gameState.roomCode}`
  });
});

app.get('/api/quizzes', (req, res) => {
  res.json(loadQuizzes());
});

app.post('/api/quizzes', (req, res) => {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.sets)) {
    return res.status(400).json({ error: 'Invalid quiz data format' });
  }
  const ok = saveQuizzes(payload);
  if (ok) {
    // Also update current room if in lobby
    if (payload.activeSetId) {
      gameState.activeSetId = payload.activeSetId;
    }
    broadcastState();
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save quizzes' });
  }
});

// ==========================================
// Real-Time Multiplayer Survival Game State
// ==========================================
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

let timerInterval = null;
let botTimeouts = [];

const gameState = {
  roomCode: '1004',
  phase: 'LOBBY', // 'LOBBY' | 'QUESTION' | 'REVEAL' | 'DROP' | 'WINNER'
  activeSetId: 'set-1',
  questionIndex: 0,
  currentQuestion: null,
  timeLimit: 5,
  timeRemaining: 5,
  overrideTimeLimit: null, // null (use question's default) | 5 | 10
  players: {}, // keyed by playerId
  lastEliminatedIds: [],
  roundHistory: []
};

function clearTimers() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  botTimeouts.forEach(t => clearTimeout(t));
  botTimeouts = [];
}

function getActiveSet() {
  const data = loadQuizzes();
  const found = data.sets.find(s => s.id === gameState.activeSetId) || data.sets[0];
  return found || null;
}

function getPublicState() {
  const activeSet = getActiveSet();
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
      answer: String(gameState.currentQuestion.answer || 'A').toUpperCase().trim(),
      explanation: gameState.currentQuestion.explanation || ''
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
    players: Object.values(gameState.players),
    lastEliminatedIds: gameState.lastEliminatedIds
  };
}

function broadcastState() {
  io.emit('game:state', getPublicState());
}

function scheduleBotMoves() {
  const bots = Object.values(gameState.players).filter(p => p.isBot && p.alive);
  if (!bots.length || !gameState.currentQuestion) return;

  const correctAns = gameState.currentQuestion.answer; // 'A' or 'B'
  const wrongAns = correctAns === 'A' ? 'B' : 'A';
  const maxDelayMs = Math.max(2000, (gameState.timeLimit - 1.2) * 1000);

  bots.forEach((bot) => {
    const delay = 700 + Math.random() * (maxDelayMs - 700);
    const t = setTimeout(() => {
      if (gameState.phase !== 'QUESTION' || !gameState.players[bot.id] || !gameState.players[bot.id].alive) return;
      // ~68% chance bot chooses the right answer so a few bots fall each round for exciting survival drama!
      const pickCorrect = Math.random() < 0.68;
      gameState.players[bot.id].choice = pickCorrect ? correctAns : wrongAns;
      gameState.players[bot.id].lastMoveAt = Date.now();
      broadcastState();
    }, delay);
    botTimeouts.push(t);
  });
}

function startQuestionRound(index) {
  clearTimers();
  const activeSet = getActiveSet();
  if (!activeSet || !activeSet.questions.length) return;

  const qIdx = Math.max(0, Math.min(index, activeSet.questions.length - 1));
  const question = activeSet.questions[qIdx];

  // If no players are alive when starting a new round, automatically revive everyone
  const alivePlayers = Object.values(gameState.players).filter(p => p.alive);
  if (alivePlayers.length === 0 && Object.keys(gameState.players).length > 0) {
    Object.values(gameState.players).forEach(p => {
      p.alive = true;
      p.falling = false;
    });
  }

  // Reset everyone's position to CENTER before they walk to A or B
  Object.values(gameState.players).forEach(p => {
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

  broadcastState();
  scheduleBotMoves();

  timerInterval = setInterval(() => {
    gameState.timeRemaining = Math.max(0, Number((gameState.timeRemaining - 0.5).toFixed(1)));
    broadcastState();
    if (gameState.timeRemaining <= 0) {
      clearTimers();
      triggerRevealAndDrop();
    }
  }, 500);
}

function triggerRevealAndDrop() {
  clearTimers();
  if (!gameState.currentQuestion) return;

  // Step 1: REVEAL phase (show the answer & wrong players panic for 1.3s)
  gameState.phase = 'REVEAL';
  const answer = String(gameState.currentQuestion.answer || 'A').toUpperCase().trim();
  const eliminated = [];

  Object.values(gameState.players).forEach(p => {
    if (!p.alive) return;
    const pChoice = String(p.choice || '').toUpperCase().trim();
    if (pChoice === answer) {
      p.score = (p.score || 0) + 1;
      p.falling = false;
    } else {
      // Standing on wrong platform or failed to choose in time
      p.falling = true;
      eliminated.push(p.id);
    }
  });

  gameState.lastEliminatedIds = eliminated;
  broadcastState();

  // Step 2: After 1.2 seconds of answer reveal & panic, open the trapdoor and DROP wrong avatars!
  const dropTimeout = setTimeout(() => {
    gameState.phase = 'DROP';
    broadcastState();

    // After fall animation completes (1.8s), mark fallen players as alive = false
    const finishDropTimeout = setTimeout(() => {
      eliminated.forEach(id => {
        if (gameState.players[id]) {
          gameState.players[id].alive = false;
          gameState.players[id].falling = false;
        }
      });
      broadcastState();
    }, 1800);
    botTimeouts.push(finishDropTimeout);
  }, 1200);

  botTimeouts.push(dropTimeout);
}

// Socket.io Connection Handling
io.on('connection', (socket) => {
  // Immediately send current state
  socket.emit('game:state', getPublicState());

  // Student joins or updates profile
  socket.on('student:join', (payload, ack) => {
    const id = payload.playerId || `p_${socket.id}`;
    const existing = gameState.players[id];

    gameState.players[id] = {
      id,
      socketId: socket.id,
      name: (payload.name || '학생').trim().slice(0, 14),
      avatar: payload.avatar || 'bear',
      country: payload.country || '🌏',
      choice: existing ? existing.choice : 'CENTER',
      alive: existing ? existing.alive : (gameState.phase === 'LOBBY' ? true : true),
      falling: false,
      score: existing ? existing.score : 0,
      isBot: false,
      emote: null,
      joinedAt: existing ? existing.joinedAt : Date.now()
    };

    broadcastState();
    if (typeof ack === 'function') {
      ack({ success: true, player: gameState.players[id] });
    }
  });

  // Student selects A or B
  socket.on('student:choose', ({ playerId, choice }) => {
    if (gameState.phase !== 'QUESTION') return;
    const player = gameState.players[playerId];
    if (!player || !player.alive) return;
    if (choice !== 'A' && choice !== 'B') return;

    player.choice = choice;
    player.lastMoveAt = Date.now();
    broadcastState();
  });

  // Student sends cute quick emote
  socket.on('student:emote', ({ playerId, emote }) => {
    const player = gameState.players[playerId];
    if (!player) return;
    player.emote = String(emote || '').slice(0, 16);
    broadcastState();
    setTimeout(() => {
      if (gameState.players[playerId] && gameState.players[playerId].emote === emote) {
        gameState.players[playerId].emote = null;
        broadcastState();
      }
    }, 2800);
  });

  // Teacher: Change active quiz set
  socket.on('teacher:set-quiz-set', ({ setId }) => {
    clearTimers();
    gameState.activeSetId = setId;
    gameState.questionIndex = 0;
    gameState.phase = 'LOBBY';
    gameState.currentQuestion = null;
    Object.values(gameState.players).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
      p.score = 0;
    });
    broadcastState();
  });

  // Teacher: Set global timer override (null, 5, or 10)
  socket.on('teacher:set-time-override', ({ seconds }) => {
    gameState.overrideTimeLimit = seconds ? Number(seconds) : null;
    broadcastState();
  });

  // Teacher: Start game or specific question
  socket.on('teacher:start-question', ({ questionIndex }) => {
    const idx = typeof questionIndex === 'number' ? questionIndex : gameState.questionIndex;
    startQuestionRound(idx);
  });

  // Teacher: Reveal answer immediately
  socket.on('teacher:reveal-now', () => {
    if (gameState.phase === 'QUESTION') {
      triggerRevealAndDrop();
    }
  });

  // Teacher: Next question or Winner ceremony
  socket.on('teacher:next-step', () => {
    const activeSet = getActiveSet();
    if (!activeSet) return;
    if (gameState.questionIndex + 1 < activeSet.questions.length) {
      startQuestionRound(gameState.questionIndex + 1);
    } else {
      clearTimers();
      gameState.phase = 'WINNER';
      broadcastState();
    }
  });

  // Teacher: Show Final Winner screen immediately
  socket.on('teacher:show-winner', () => {
    clearTimers();
    gameState.phase = 'WINNER';
    broadcastState();
  });

  // Teacher: Revive all fallen students (패자부활전)
  socket.on('teacher:revive-all', () => {
    Object.values(gameState.players).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
    });
    gameState.lastEliminatedIds = [];
    broadcastState();
  });

  // Teacher: Return to Lobby
  socket.on('teacher:reset-lobby', () => {
    clearTimers();
    gameState.phase = 'LOBBY';
    gameState.questionIndex = 0;
    gameState.currentQuestion = null;
    gameState.lastEliminatedIds = [];
    Object.values(gameState.players).forEach(p => {
      p.alive = true;
      p.falling = false;
      p.choice = 'CENTER';
      p.score = 0;
    });
    broadcastState();
  });

  // Teacher: Add virtual foreign student bots for testing or fun
  socket.on('teacher:add-bots', ({ count = 5 } = {}) => {
    const existingNames = new Set(Object.values(gameState.players).map(p => p.name));
    let added = 0;
    for (const profile of BOT_PROFILES) {
      if (added >= count) break;
      let botName = profile.name;
      if (existingNames.has(botName)) {
        botName = `${profile.name}${Math.floor(Math.random() * 9) + 2}`;
      }
      const id = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      gameState.players[id] = {
        id,
        socketId: null,
        name: botName,
        avatar: profile.avatar,
        country: profile.country,
        choice: 'CENTER',
        alive: true,
        falling: false,
        score: 0,
        isBot: true,
        emote: null,
        joinedAt: Date.now()
      };
      existingNames.add(botName);
      added++;
    }
    if (gameState.phase === 'QUESTION') {
      scheduleBotMoves();
    }
    broadcastState();
  });

  // Teacher: Remove all bots
  socket.on('teacher:clear-bots', () => {
    for (const id of Object.keys(gameState.players)) {
      if (gameState.players[id].isBot) {
        delete gameState.players[id];
      }
    }
    broadcastState();
  });

  // Teacher: Remove specific player
  socket.on('teacher:kick-player', ({ playerId }) => {
    if (gameState.players[playerId]) {
      delete gameState.players[playerId];
      broadcastState();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress();
  console.log('====================================================');
  console.log(' 🇰🇷 한국어 서바이벌 퀴즈 웹앱 서버가 시작되었습니다!');
  console.log(` ▶ 선생님 컴퓨터 접속 주소 : http://localhost:${PORT}`);
  console.log(` ▶ 학생 스마트폰 동시접속  : http://${ip}:${PORT}/?role=student`);
  console.log('====================================================');
});
