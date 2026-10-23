// Cloudflare Durable Object Realtime Room Relay & Authoritative State Server
export class QuizRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sessions = new Set();
    this.roomState = {
      roomCode: '1004',
      phase: 'LOBBY',
      activeSetId: 'set-1',
      activeSetTitle: '',
      questionIndex: 0,
      totalQuestions: 5,
      currentQuestion: null,
      timeLimit: 5,
      timeRemaining: 5,
      overrideTimeLimit: null,
      players: {},
      lastEliminatedIds: [],
      updatedAt: Date.now()
    };
  }

  getPublicState() {
    return {
      ...this.roomState,
      players: Object.values(this.roomState.players)
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
      const mergedPlayers = {};

      // 1. Preserve all real (non-bot) students already connected to the cloud room
      for (const [id, existingPlayer] of Object.entries(this.roomState.players)) {
        if (!existingPlayer.isBot) {
          mergedPlayers[id] = { ...existingPlayer };
        }
      }

      // 2. Merge incoming players from host (bots + round status updates for real students)
      if (Array.isArray(incoming.players)) {
        for (const p of incoming.players) {
          if (!p || !p.id) continue;
          if (p.isBot) {
            if (!msg.clearBotsOnly) {
              mergedPlayers[p.id] = p;
            }
          } else if (mergedPlayers[p.id]) {
            // Real student already exists in roomState:
            // Only overwrite choice if host explicitly reset choices (new question / lobby / revive)
            mergedPlayers[p.id] = {
              ...mergedPlayers[p.id],
              alive: p.alive,
              falling: p.falling,
              score: p.score,
              choice: msg.resetChoices ? p.choice : mergedPlayers[p.id].choice
            };
          } else {
            mergedPlayers[p.id] = p;
          }
        }
      }

      // If host explicitly reset choices (new question round / reset lobby / revive all), apply to all real students too
      if (msg.resetChoices) {
        for (const p of Object.values(mergedPlayers)) {
          p.choice = 'CENTER';
          p.falling = false;
          if (msg.reviveAll) p.alive = true;
          if (msg.resetScores) p.score = 0;
        }
      }

      this.roomState = {
        ...this.roomState,
        roomCode: incoming.roomCode || this.roomState.roomCode,
        phase: incoming.phase || this.roomState.phase,
        activeSetId: incoming.activeSetId || this.roomState.activeSetId,
        activeSetTitle: incoming.activeSetTitle || this.roomState.activeSetTitle,
        questionIndex: typeof incoming.questionIndex === 'number' ? incoming.questionIndex : this.roomState.questionIndex,
        totalQuestions: typeof incoming.totalQuestions === 'number' ? incoming.totalQuestions : this.roomState.totalQuestions,
        currentQuestion: incoming.currentQuestion !== undefined ? incoming.currentQuestion : this.roomState.currentQuestion,
        timeLimit: incoming.timeLimit || this.roomState.timeLimit,
        timeRemaining: incoming.timeRemaining !== undefined ? incoming.timeRemaining : this.roomState.timeRemaining,
        overrideTimeLimit: incoming.overrideTimeLimit !== undefined ? incoming.overrideTimeLimit : this.roomState.overrideTimeLimit,
        players: mergedPlayers,
        lastEliminatedIds: incoming.lastEliminatedIds || [],
        updatedAt: Date.now()
      };

      this.broadcast();
      return;
    }

    if (msg.type === 'teacher:clear-bots') {
      for (const id of Object.keys(this.roomState.players)) {
        if (this.roomState.players[id].isBot) {
          delete this.roomState.players[id];
        }
      }
      this.broadcast();
      return;
    }

    if (msg.type === 'student:join') {
      const p = msg.payload || {};
      const id = p.playerId || ('stu_' + Date.now());
      const existing = this.roomState.players[id];
      this.roomState.players[id] = {
        id,
        name: String(p.name || '학생').trim().slice(0, 14),
        avatar: p.avatar || 'bear',
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
      const player = this.roomState.players[playerId];
      if (player && player.alive && (choice === 'A' || choice === 'B')) {
        player.choice = choice;
        this.roomState.updatedAt = Date.now();
      }
      this.forwardToAll({ type: 'relay:student-action', action: msg });
      this.broadcast();
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
