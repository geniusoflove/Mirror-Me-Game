import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  Room,
  Player,
  RoomSettings,
  DEFAULT_SETTINGS,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  GamePhase,
} from './shared/types';
import { getGamePrompts } from './shared/prompts';
import { calculateRoundResult } from './shared/scoring';

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// In-memory storage
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const playerIdToSocketId = new Map<string, string>(); // Track socket IDs for kicking
const disconnectedPlayers = new Map<string, { roomCode: string; playerId: string; timeout: NodeJS.Timeout }>();

// Game prompts per room (shuffled for each game)
const roomPrompts = new Map<string, string[]>();

// Bot names
const BOT_NAMES = ['CPU Alpha', 'CPU Beta', 'CPU Gamma', 'CPU Delta', 'CPU Epsilon'];

// Common answers for bots to use (varied to make gameplay interesting)
const BOT_ANSWERS: Record<string, string[]> = {
  'Birthday': ['cake', 'party', 'present', 'candle', 'wish'],
  'Chocolate': ['cake', 'chip', 'bar', 'milk', 'dark'],
  'Hot': ['dog', 'sauce', 'weather', 'fire', 'summer'],
  'Cold': ['water', 'weather', 'ice', 'winter', 'snow'],
  'default': ['thing', 'stuff', 'time', 'place', 'person', 'day', 'way', 'world', 'life', 'hand'],
};

// Get a random bot answer for a prompt
function getBotAnswer(prompt: string): string {
  // Extract the word part of the prompt (before or after ___)
  const parts = prompt.split('___');
  const keyword = (parts[0] || parts[1] || '').trim();

  // Check if we have specific answers for this keyword
  const answers = BOT_ANSWERS[keyword] || BOT_ANSWERS['default'];
  return answers[Math.floor(Math.random() * answers.length)];
}

// Make bots submit their answers
function submitBotAnswers(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'answering') return;

  const bots = room.players.filter(p => p.isBot && !p.hasSubmitted);

  // Bots submit with random delays (1-5 seconds)
  bots.forEach(bot => {
    const delay = 1000 + Math.random() * 4000;
    setTimeout(() => {
      const currentRoom = rooms.get(roomCode);
      if (!currentRoom || currentRoom.phase !== 'answering') return;

      const botPlayer = currentRoom.players.find(p => p.id === bot.id);
      if (!botPlayer || botPlayer.hasSubmitted) return;

      botPlayer.currentAnswer = getBotAnswer(currentRoom.currentPrompt || '');
      botPlayer.hasSubmitted = true;
      rooms.set(roomCode, currentRoom);

      io.to(roomCode).emit('playerSubmitted', bot.id);
      checkAllSubmitted(roomCode);
    }, delay);
  });
}

// Generate unique room code
function generateRoomCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

// Generate unique player ID
function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get active (non-spectator, connected) players
function getActivePlayers(room: Room): Player[] {
  return room.players.filter(p => !p.isSpectator && p.isConnected);
}

// Broadcast room state to all players in the room
function broadcastRoomState(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Don't send answers to clients during answering phase
  const sanitizedRoom: Room = {
    ...room,
    players: room.players.map(p => ({
      ...p,
      currentAnswer: room.phase === 'reveal' || room.phase === 'scoring' || room.phase === 'gameOver'
        ? p.currentAnswer
        : undefined,
    })),
  };

  io.to(roomCode).emit('roomState', sanitizedRoom);
}

// Start a timer for the answering phase
function startAnswerTimer(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  const duration = room.settings.timerDuration * 1000;
  room.timerEndTime = Date.now() + duration;
  rooms.set(roomCode, room);

  // Timer countdown
  const interval = setInterval(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom || currentRoom.phase !== 'answering') {
      clearInterval(interval);
      return;
    }

    const remaining = Math.max(0, Math.ceil((currentRoom.timerEndTime! - Date.now()) / 1000));
    io.to(roomCode).emit('timerUpdate', remaining);

    if (remaining <= 0) {
      clearInterval(interval);
      endAnsweringPhase(roomCode);
    }
  }, 1000);
}

// Check if all players have submitted
function checkAllSubmitted(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'answering') return;

  const activePlayers = getActivePlayers(room);
  const allSubmitted = activePlayers.every(p => p.hasSubmitted);

  if (allSubmitted) {
    endAnsweringPhase(roomCode);
  }
}

// End the answering phase and move to reveal
function endAnsweringPhase(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'answering') return;

  room.phase = 'reveal';
  room.timerEndTime = null;
  rooms.set(roomCode, room);

  // Calculate results
  const result = calculateRoundResult(room.currentRound, room.currentPrompt!, room.players);
  room.roundResults.push(result);

  // Update player scores
  for (const ps of result.playerScores) {
    const player = room.players.find(p => p.id === ps.playerId);
    if (player) {
      player.score += ps.points;
    }
  }

  rooms.set(roomCode, room);

  io.to(roomCode).emit('revealAnswers', result.answerGroups);
  broadcastRoomState(roomCode);

  // Auto-advance to scoring after a delay
  setTimeout(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom || currentRoom.phase !== 'reveal') return;

    currentRoom.phase = 'scoring';
    rooms.set(roomCode, currentRoom);
    io.to(roomCode).emit('roundScores', result);
    broadcastRoomState(roomCode);
  }, 3000);
}

// Start next round or end game
function startNextRound(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Check if game is over
  if (room.currentRound >= room.settings.totalRounds) {
    room.phase = 'gameOver';
    rooms.set(roomCode, room);

    const finalScores = room.players
      .filter(p => !p.isSpectator)
      .map(p => ({ playerId: p.id, playerName: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    io.to(roomCode).emit('gameOver', finalScores);
    broadcastRoomState(roomCode);
    return;
  }

  // Get next prompt
  const prompts = roomPrompts.get(roomCode);
  if (!prompts || prompts.length === 0) return;

  room.currentRound++;
  room.currentPrompt = prompts[room.currentRound - 1];
  room.phase = 'answering';

  // Reset player answers
  for (const player of room.players) {
    player.currentAnswer = undefined;
    player.hasSubmitted = false;
  }

  rooms.set(roomCode, room);

  io.to(roomCode).emit('newPrompt', room.currentPrompt, Date.now() + room.settings.timerDuration * 1000);
  broadcastRoomState(roomCode);
  startAnswerTimer(roomCode);

  // Make bots submit their answers
  submitBotAnswers(roomCode);
}

// Transfer host to next available player
function transferHost(room: Room, oldHostId: string): void {
  const newHost = room.players.find(p => p.id !== oldHostId && p.isConnected && !p.isSpectator);
  if (newHost) {
    const oldHost = room.players.find(p => p.id === oldHostId);
    if (oldHost) oldHost.isHost = false;
    newHost.isHost = true;
    io.to(room.code).emit('hostTransferred', newHost.id);
  }
}

// Socket connection handler
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('createRoom', (playerName, callback) => {
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();

    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: true,
      isConnected: true,
      isSpectator: false,
      isBot: false,
      score: 0,
      hasSubmitted: false,
    };

    const room: Room = {
      code: roomCode,
      players: [player],
      blockedPlayers: [],
      phase: 'lobby',
      settings: { ...DEFAULT_SETTINGS },
      currentRound: 0,
      currentPrompt: null,
      timerEndTime: null,
      roundResults: [],
    };

    rooms.set(roomCode, room);
    socketToRoom.set(socket.id, roomCode);
    playerIdToSocketId.set(playerId, socket.id);
    socket.data.playerId = playerId;
    socket.data.playerName = playerName;
    socket.data.roomCode = roomCode;

    socket.join(roomCode);
    callback({ success: true, roomCode, playerId });
    broadcastRoomState(roomCode);
  });

  socket.on('joinRoom', (roomCode, playerName, callback) => {
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    // Check if player is blocked (case-insensitive name match)
    const isBlocked = room.blockedPlayers.some(
      bp => bp.name.toLowerCase() === playerName.toLowerCase()
    );
    if (isBlocked) {
      callback({ success: false, error: 'You have been blocked from this room' });
      return;
    }

    if (room.players.filter(p => p.isConnected).length >= room.settings.maxPlayers) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    if (room.phase !== 'lobby') {
      // Allow joining as spectator if game in progress
      const playerId = generatePlayerId();
      const player: Player = {
        id: playerId,
        name: playerName,
        isHost: false,
        isConnected: true,
        isSpectator: true,
        isBot: false,
        score: 0,
        hasSubmitted: false,
      };

      room.players.push(player);
      rooms.set(room.code, room);
      socketToRoom.set(socket.id, room.code);
      playerIdToSocketId.set(playerId, socket.id);
      socket.data.playerId = playerId;
      socket.data.playerName = playerName;
      socket.data.roomCode = room.code;

      socket.join(room.code);
      callback({ success: true, playerId });
      io.to(room.code).emit('playerJoined', player);
      broadcastRoomState(room.code);
      return;
    }

    const playerId = generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      isConnected: true,
      isSpectator: false,
      isBot: false,
      score: 0,
      hasSubmitted: false,
    };

    room.players.push(player);
    rooms.set(room.code, room);
    socketToRoom.set(socket.id, room.code);
    playerIdToSocketId.set(playerId, socket.id);
    socket.data.playerId = playerId;
    socket.data.playerName = playerName;
    socket.data.roomCode = room.code;

    socket.join(room.code);
    callback({ success: true, playerId });
    io.to(room.code).emit('playerJoined', player);
    broadcastRoomState(room.code);
  });

  socket.on('addBot', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can add bots');
      return;
    }

    // Count existing bots
    const botCount = room.players.filter(p => p.isBot).length;
    if (botCount >= BOT_NAMES.length) {
      socket.emit('error', 'Maximum bots reached');
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('error', 'Room is full');
      return;
    }

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const bot: Player = {
      id: botId,
      name: BOT_NAMES[botCount],
      isHost: false,
      isConnected: true,
      isSpectator: false,
      isBot: true,
      score: 0,
      hasSubmitted: false,
    };

    room.players.push(bot);
    rooms.set(roomCode, room);

    io.to(roomCode).emit('playerJoined', bot);
    broadcastRoomState(roomCode);
  });

  socket.on('removeBot', (botId) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can remove bots');
      return;
    }

    const botIndex = room.players.findIndex(p => p.id === botId && p.isBot);
    if (botIndex === -1) return;

    room.players.splice(botIndex, 1);
    rooms.set(roomCode, room);

    io.to(roomCode).emit('playerLeft', botId);
    broadcastRoomState(roomCode);
  });

  socket.on('leaveRoom', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const playerId = socket.data.playerId;
    const playerIndex = room.players.findIndex(p => p.id === playerId);

    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      room.players.splice(playerIndex, 1);

      if (player.isHost && room.players.length > 0) {
        transferHost(room, playerId);
      }

      if (room.players.length === 0) {
        rooms.delete(roomCode);
        roomPrompts.delete(roomCode);
      } else {
        rooms.set(roomCode, room);
        io.to(roomCode).emit('playerLeft', playerId);
        broadcastRoomState(roomCode);
      }
    }

    socket.leave(roomCode);
    socketToRoom.delete(socket.id);
    socket.data.roomCode = null;
  });

  socket.on('startGame', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }

    const activePlayers = getActivePlayers(room);
    if (activePlayers.length < room.settings.minPlayers) {
      socket.emit('error', `Need at least ${room.settings.minPlayers} players to start`);
      return;
    }

    // Generate prompts for this game
    const prompts = getGamePrompts(room.settings.totalRounds);
    roomPrompts.set(roomCode, prompts);

    room.phase = 'prompt';
    rooms.set(roomCode, room);

    io.to(roomCode).emit('gameStarted');
    broadcastRoomState(roomCode);

    // Start first round after short delay
    setTimeout(() => startNextRound(roomCode), 1500);
  });

  socket.on('submitAnswer', (answer) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'answering') return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player || player.isSpectator || player.hasSubmitted) return;

    player.currentAnswer = answer.trim();
    player.hasSubmitted = true;
    rooms.set(roomCode, room);

    io.to(roomCode).emit('playerSubmitted', player.id);
    checkAllSubmitted(roomCode);
  });

  socket.on('nextRound', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'scoring') return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can advance to the next round');
      return;
    }

    startNextRound(roomCode);
  });

  socket.on('updateSettings', (settings) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can update settings');
      return;
    }

    room.settings = { ...room.settings, ...settings };
    rooms.set(roomCode, room);

    io.to(roomCode).emit('settingsUpdated', room.settings);
    broadcastRoomState(roomCode);
  });

  socket.on('toggleSpectator', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player) return;

    // Can only toggle in lobby
    if (room.phase !== 'lobby') {
      socket.emit('error', 'Can only toggle spectator mode in lobby');
      return;
    }

    player.isSpectator = !player.isSpectator;

    // If host becomes spectator, transfer host
    if (player.isHost && player.isSpectator) {
      transferHost(room, player.id);
    }

    rooms.set(roomCode, room);
    broadcastRoomState(roomCode);
  });

  socket.on('kickPlayer', (targetPlayerId) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can kick players');
      return;
    }

    const targetIndex = room.players.findIndex(p => p.id === targetPlayerId);
    if (targetIndex === -1 || targetPlayerId === player.id) return;

    const targetPlayer = room.players[targetIndex];

    // Notify the kicked player
    const targetSocketId = playerIdToSocketId.get(targetPlayerId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('kicked', false);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(roomCode);
        targetSocket.data.roomCode = null;
      }
      playerIdToSocketId.delete(targetPlayerId);
    }

    room.players.splice(targetIndex, 1);
    rooms.set(roomCode, room);

    io.to(roomCode).emit('playerLeft', targetPlayerId);
    broadcastRoomState(roomCode);
  });

  socket.on('kickAndBlock', (targetPlayerId) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can kick and block players');
      return;
    }

    const targetIndex = room.players.findIndex(p => p.id === targetPlayerId);
    if (targetIndex === -1 || targetPlayerId === player.id) return;

    const targetPlayer = room.players[targetIndex];

    // Can't block bots
    if (targetPlayer.isBot) {
      socket.emit('error', 'Cannot block bots');
      return;
    }

    // Add to blocked list
    room.blockedPlayers.push({
      name: targetPlayer.name,
      blockedAt: Date.now(),
    });

    // Notify the kicked player
    const targetSocketId = playerIdToSocketId.get(targetPlayerId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('kicked', true);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(roomCode);
        targetSocket.data.roomCode = null;
      }
      playerIdToSocketId.delete(targetPlayerId);
    }

    room.players.splice(targetIndex, 1);
    rooms.set(roomCode, room);

    io.to(roomCode).emit('playerLeft', targetPlayerId);
    broadcastRoomState(roomCode);
  });

  socket.on('unblockPlayer', (playerName) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can unblock players');
      return;
    }

    const blockedIndex = room.blockedPlayers.findIndex(
      bp => bp.name.toLowerCase() === playerName.toLowerCase()
    );

    if (blockedIndex !== -1) {
      room.blockedPlayers.splice(blockedIndex, 1);
      rooms.set(roomCode, room);
      broadcastRoomState(roomCode);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const playerId = socket.data.playerId;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.isConnected = false;
    rooms.set(roomCode, room);

    io.to(roomCode).emit('playerDisconnected', playerId);

    // Set up reconnection timeout (60 seconds)
    const timeout = setTimeout(() => {
      const currentRoom = rooms.get(roomCode);
      if (!currentRoom) return;

      const playerIndex = currentRoom.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1 && !currentRoom.players[playerIndex].isConnected) {
        const wasHost = currentRoom.players[playerIndex].isHost;
        currentRoom.players.splice(playerIndex, 1);

        if (wasHost && currentRoom.players.length > 0) {
          transferHost(currentRoom, playerId);
        }

        if (currentRoom.players.length === 0) {
          rooms.delete(roomCode);
          roomPrompts.delete(roomCode);
        } else {
          rooms.set(roomCode, currentRoom);
          io.to(roomCode).emit('playerLeft', playerId);
          broadcastRoomState(roomCode);
        }
      }

      disconnectedPlayers.delete(socket.id);
    }, 60000);

    disconnectedPlayers.set(socket.id, { roomCode, playerId, timeout });
    socketToRoom.delete(socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
