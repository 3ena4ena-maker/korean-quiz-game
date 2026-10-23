// Cloudflare Durable Object Realtime Room Relay & Authoritative Judge Server
const KNOWN_ANSWERS = {
  q101: 'A',
  q102: 'B',
  q103: 'A',
  q104: 'B',
  q105: 'A',
  q201: 'A',
  q202: 'B',
  q203: 'A',
  q204: 'A',
  q205: 'A',
  q301: 'A',
  q302: 'B',
  q303: 'A',
  q304: 'B',
  q305: 'A'
};

export class QuizRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sessions = new Set();
    this.customAnswersMap = {}; // questionId -> 'A' | 'B'
    this.kickedIds = new Set();
    this.roomState = {
      roomCode: '1004',
      phase: 'LOBBY',
      activeSetId: 'set-1',
      activeSetTitle: '',
      questionIndex: 0,
      totalQuestions: 5,
      currentQuestion: null,
      timeLimit: 10,
      timeRemaining: 10,
      overrideTimeLimit: null,
      players: {},
      lastEliminatedIds: [],
      updatedAt: Date.now()
    };
  }

  resolveCorrectAnswer(questionObj) {
    if (!questionObj) return 'A';
    const rawAns = String(questionObj.answer || '').toUpperCase().trim();
    if (rawAns === 'A' || rawAns === 'B') {
      if (questionObj.id) this.customAnswersMap[questionObj.id] = rawAns;
      return rawAns;
    }
    if (questionObj.id && this.customAnswersMap[questionObj.id]) {
      return this.customAnswersMap[questionObj.id];
    }
    if (questionObj.id && KNOWN_ANSWERS[questionObj.id]) {
      return KNOWN_ANSWERS[questionObj.id];
    }
    const prevQ = this.roomState.currentQuestion;
    if (prevQ && prevQ.id === questionObj.id) {
      const prevAns = String(prevQ.answer || '').toUpperCase().trim();
      if (prevAns === 'A' || prevAns === 'B') return prevAns;
    }
    return 'A';
  }

  getPublicState() {
    const raw = this.roomState.players;
    const list = Array.isArray(raw) ? raw : Object.values(raw || {});
    return {
      ...this.roomState,
      players: list
    };
  }

  broadcast() {
    const payload = JSON.stringify({
      type: 'game:state',
      state: this.getPublicState()
    });
    for (const ws of this.sessions) {
      try {
        ws.send(payload);
      } catch (_) {
        this.sessions.delete(ws);
      }
    }
  }

  forwardToAll(obj) {
    const raw = JSON.stringify(obj);
    for (const ws of this.sessions) {
      try {
        ws.send(raw);
      } catch (_) {
        this.sessions.delete(ws);
      }
    }
  }

  handleAction(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'host:sync-state' && msg.state) {
      const incoming = msg.state;
      const nextPhase = incoming.phase || this.roomState.phase;

      // Detect if a brand new question or lobby reset started
      const prevQId = this.roomState.currentQuestion ? this.roomState.currentQuestion.id : null;
      const nextQId = incoming.currentQuestion ? incoming.currentQuestion.id : null;
      const isNewRoundStart =
        Boolean(msg.resetChoices) ||
        (this.roomState.phase !== 'QUESTION' && nextPhase === 'QUESTION') ||
        (nextPhase === 'QUESTION' && prevQId !== nextQId);

      // Ensure currentQuestion ALWAYS has a valid 'A' or 'B' answer (never null!)
      let fixedQuestion = incoming.currentQuestion !== undefined
        ? incoming.currentQuestion
        : this.roomState.currentQuestion;

      let authoritativeAnswer = 'A';
      if (fixedQuestion) {
        authoritativeAnswer = this.resolveCorrectAnswer(fixedQuestion);
        fixedQuestion = {
          ...fixedQuestion,
          answer: authoritativeAnswer
        };
      }

      const mergedPlayers = {};
      const existingMap = {};
      if (Array.isArray(this.roomState.players)) {
        this.roomState.players.forEach(p => { if (p && p.id) existingMap[p.id] = p; });
      } else if (this.roomState.players) {
        Object.assign(existingMap, this.roomState.players);
      }

      // 1. Preserve ONLY real (non-bot) students from roomState that might not be in incoming yet
      for (const [id, existingPlayer] of Object.entries(existingMap)) {
        if (!existingPlayer.isBot) {
          mergedPlayers[id] = { ...existingPlayer };
        }
      }

      // 2. Merge incoming players from host (bots are only included if clearBotsOnly is FALSE)
      if (Array.isArray(incoming.players)) {
        for (const p of incoming.players) {
          if (!p || !p.id) continue;
          if (p.isBot) {
            if (!msg.clearBotsOnly) {
              mergedPlayers[p.id] = p;
            }
          } else if (mergedPlayers[p.id]) {
            const existingChoice = mergedPlayers[p.id].choice;
            const incomingChoice = p.choice;
            mergedPlayers[p.id] = {
              ...mergedPlayers[p.id],
              name: p.name || mergedPlayers[p.id].name,
              avatar: p.avatar || mergedPlayers[p.id].avatar || 'coral_peach',
              country: p.country || mergedPlayers[p.id].country || '🌏',
              alive: (msg.reviveAll || isNewRoundStart) ? true : mergedPlayers[p.id].alive,
              falling: (msg.reviveAll || isNewRoundStart) ? false : mergedPlayers[p.id].falling,
              score: msg.resetScores ? 0 : Math.max(mergedPlayers[p.id].score || 0, p.score || 0),
              choice: (isNewRoundStart || msg.resetChoices)
                ? 'CENTER'
                : ((existingChoice === 'A' || existingChoice === 'B') ? existingChoice : (incomingChoice || 'CENTER'))
            };
          } else {
            mergedPlayers[p.id] = p;
          }
        }
      }

      if (Array.isArray(msg.kickedIds)) {
        msg.kickedIds.forEach(id => this.kickedIds.add(id));
      }
      if (msg.reviveAll && msg.resetScores) {
        this.kickedIds.clear();
      }
      for (const kid of this.kickedIds) {
        delete mergedPlayers[kid];
      }

      if (isNewRoundStart || msg.resetChoices) {
        for (const p of Object.values(mergedPlayers)) {
          p.choice = 'CENTER';
          p.falling = false;
          p.alive = true;
          if (msg.resetScores) p.score = 0;
        }
      }

      // 3. AUTHORITATIVE JUDGE: During REVEAL or DROP, enforce accurate survival based on authoritativeAnswer!
      const authoritativeEliminated = [];
      if ((nextPhase === 'REVEAL' || nextPhase === 'DROP') && fixedQuestion) {
        for (const p of Object.values(mergedPlayers)) {
          const pChoice = String(p.choice || '').toUpperCase().trim();
          if (pChoice === authoritativeAnswer) {
            // Player picked the RIGHT answer -> MUST SURVIVE!
            p.alive = true;
            p.falling = false;
            if (this.roomState.phase === 'QUESTION' && nextPhase === 'REVEAL') {
              p.score = (p.score || 0) + 1;
            }
          } else {
            // Player picked the WRONG answer (or stayed in CENTER) -> ELIMINATED!
            authoritativeEliminated.push(p.id);
            if (nextPhase === 'REVEAL') {
              p.falling = true;
            } else if (nextPhase === 'DROP') {
              // If host already finished drop animation, mark alive=false
              const hostVersion = Array.isArray(incoming.players)
                ? incoming.players.find(hp => hp && hp.id === p.id)
                : null;
              if (hostVersion && hostVersion.alive === false && hostVersion.falling === false) {
                p.alive = false;
                p.falling = false;
              } else {
                p.falling = true;
              }
            }
          }
        }
      }

      this.roomState = {
        ...this.roomState,
        roomCode: incoming.roomCode || this.roomState.roomCode,
        phase: nextPhase,
        activeSetId: incoming.activeSetId || this.roomState.activeSetId,
        activeSetTitle: incoming.activeSetTitle || this.roomState.activeSetTitle,
        questionIndex: typeof incoming.questionIndex === 'number' ? incoming.questionIndex : this.roomState.questionIndex,
        totalQuestions: typeof incoming.totalQuestions === 'number' ? incoming.totalQuestions : this.roomState.totalQuestions,
        currentQuestion: fixedQuestion,
        timeLimit: incoming.timeLimit || this.roomState.timeLimit,
        timeRemaining: incoming.timeRemaining !== undefined ? incoming.timeRemaining : this.roomState.timeRemaining,
        overrideTimeLimit: incoming.overrideTimeLimit !== undefined ? incoming.overrideTimeLimit : this.roomState.overrideTimeLimit,
        players: mergedPlayers,
        lastEliminatedIds: (nextPhase === 'REVEAL' || nextPhase === 'DROP')
          ? authoritativeEliminated
          : (incoming.lastEliminatedIds || []),
        updatedAt: Date.now()
      };

      this.broadcast();
      return;
    }

    if (msg.type === 'host:kick-player' && msg.playerId) {
      this.kickedIds.add(msg.playerId);
      if (Array.isArray(this.roomState.players)) {
        this.roomState.players = this.roomState.players.filter(p => p && p.id !== msg.playerId);
      } else if (this.roomState.players && typeof this.roomState.players === 'object') {
        delete this.roomState.players[msg.playerId];
      }
      this.forwardToAll({ type: 'player:kicked', playerId: msg.playerId });
      this.broadcast();
      return;
    }

    if (msg.type === 'teacher:clear-bots') {
      if (Array.isArray(this.roomState.players)) {
        this.roomState.players = this.roomState.players.filter(p => !p || !p.isBot);
      } else if (this.roomState.players && typeof this.roomState.players === 'object') {
        for (const id of Object.keys(this.roomState.players)) {
          if (this.roomState.players[id].isBot) {
            delete this.roomState.players[id];
          }
        }
      }
      this.broadcast();
      return;
    }

    if (msg.type === 'student:join') {
      const p = msg.payload || {};
      const id = p.playerId || ('stu_' + Date.now());
      if (this.kickedIds.has(id)) {
        return;
      }
      const existing = this.roomState.players[id];
      this.roomState.players[id] = {
        id,
        name: String(p.name || '학생').trim().slice(0, 14),
        avatar: p.avatar || 'coral_peach',
        country: p.country || '🌏',
        choice: existing ? existing.choice : 'CENTER',
        alive: existing ? existing.alive : true,
        falling: false,
        score: existing ? existing.score : 0,
        isBot: false,
        emote: p.emote || null,
        joinedAt: existing ? existing.joinedAt : Date.now()
      };
      this.roomState.updatedAt = Date.now();
      this.forwardToAll({ type: 'relay:student-action', action: msg });
      this.broadcast();
      return;
    }

    if (msg.type === 'student:choose') {
      const { playerId, choice } = msg.payload || {};
      const cleanChoice = String(choice || '').toUpperCase().trim();
      if (cleanChoice === 'A' || cleanChoice === 'B') {
        let player = this.roomState.players[playerId];
        if (!player) {
          player = {
            id: playerId,
            name: '학생',
            avatar: 'coral_peach',
            country: '🌏',
            choice: 'CENTER',
            alive: true,
            falling: false,
            score: 0,
            isBot: false,
            emote: null
          };
          this.roomState.players[playerId] = player;
        }
        player.choice = cleanChoice;
        this.roomState.updatedAt = Date.now();
        this.forwardToAll({ type: 'relay:student-action', action: msg });
        this.broadcast();
      }
      return;
    }

    if (msg.type === 'student:emote') {
      const { playerId, emote } = msg.payload || {};
      const player = this.roomState.players[playerId];
      if (player) {
        player.emote = String(emote || '').slice(0, 16);
        this.roomState.updatedAt = Date.now();
      }
      this.forwardToAll({ type: 'relay:student-action', action: msg });
      this.broadcast();
      return;
    }
  }

  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sessions.add(server);

      server.send(JSON.stringify({
        type: 'game:state',
        state: this.getPublicState()
      }));

      server.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleAction(data);
        } catch (_) {}
      });

      server.addEventListener('close', () => {
        this.sessions.delete(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        this.handleAction(body);
        return new Response(JSON.stringify({ ok: true, state: this.getPublicState() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ ok: true, state: this.getPublicState() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const roomCode = url.searchParams.get('room') || '1004';
    const id = env.QUIZ_ROOM.idFromName(`room-${roomCode}`);
    const stub = env.QUIZ_ROOM.get(id);
    return stub.fetch(request);
  }
};
