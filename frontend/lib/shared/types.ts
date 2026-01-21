// Game phases
export type GamePhase = 'lobby' | 'prompt' | 'answering' | 'reveal' | 'scoring' | 'gameOver';

// Player state
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isSpectator: boolean;
  isBot: boolean;
  score: number;
  currentAnswer?: string;
  hasSubmitted: boolean;
}

// Room settings
export interface RoomSettings {
  timerDuration: 30 | 60 | 90;
  totalRounds: 5 | 10 | 15;
  minPlayers: number;
  maxPlayers: number;
}

// Blocked player info
export interface BlockedPlayer {
  name: string;
  blockedAt: number;
}

// Room state
export interface Room {
  code: string;
  players: Player[];
  blockedPlayers: BlockedPlayer[];
  phase: GamePhase;
  settings: RoomSettings;
  currentRound: number;
  currentPrompt: string | null;
  timerEndTime: number | null;
  roundResults: RoundResult[];
}

// Answer with player info for reveal
export interface AnswerGroup {
  answer: string;
  normalizedAnswer: string;
  playerIds: string[];
  playerNames: string[];
  points: number;
}

// Round result
export interface RoundResult {
  round: number;
  prompt: string;
  answerGroups: AnswerGroup[];
  playerScores: { playerId: string; points: number }[];
}

// Client to Server events
export interface ClientToServerEvents {
  createRoom: (playerName: string, callback: (response: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => void;
  joinRoom: (roomCode: string, playerName: string, callback: (response: { success: boolean; playerId?: string; error?: string }) => void) => void;
  leaveRoom: () => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  nextRound: () => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  toggleSpectator: () => void;
  kickPlayer: (playerId: string) => void;
  kickAndBlock: (playerId: string) => void;
  unblockPlayer: (playerName: string) => void;
  addBot: () => void;
  removeBot: (botId: string) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  roomState: (room: Room) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  playerDisconnected: (playerId: string) => void;
  playerReconnected: (playerId: string) => void;
  gameStarted: () => void;
  newPrompt: (prompt: string, timerEndTime: number) => void;
  playerSubmitted: (playerId: string) => void;
  revealAnswers: (answerGroups: AnswerGroup[]) => void;
  roundScores: (result: RoundResult) => void;
  gameOver: (finalScores: { playerId: string; playerName: string; score: number }[]) => void;
  error: (message: string) => void;
  timerUpdate: (timeRemaining: number) => void;
  settingsUpdated: (settings: RoomSettings) => void;
  hostTransferred: (newHostId: string) => void;
  kicked: (blocked: boolean) => void;
}

// Socket data attached to each socket
export interface SocketData {
  playerId: string;
  playerName: string;
  roomCode: string | null;
}

// Default settings
export const DEFAULT_SETTINGS: RoomSettings = {
  timerDuration: 60,
  totalRounds: 10,
  minPlayers: 3,
  maxPlayers: 8,
};

// Room code characters (excluding ambiguous: 0/O, 1/I/L)
export const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;
