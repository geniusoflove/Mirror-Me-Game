'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  Player,
  RoomSettings,
  AnswerGroup,
  RoundResult,
} from '../lib/shared/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: GameSocket | null;
  isConnected: boolean;
  room: Room | null;
  playerId: string | null;
  error: string | null;
  answerGroups: AnswerGroup[] | null;
  roundResult: RoundResult | null;
  timeRemaining: number | null;
  wasKicked: boolean;
  wasBlocked: boolean;
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
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
  clearError: () => void;
  clearKicked: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answerGroups, setAnswerGroups] = useState<AnswerGroup[] | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [wasKicked, setWasKicked] = useState(false);
  const [wasBlocked, setWasBlocked] = useState(false);
  const playerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
    const newSocket: GameSocket = io(serverUrl);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('roomState', (roomState) => {
      setRoom(roomState);
      // Find our player ID from the room state if we don't have it
      if (!playerIdRef.current && roomState) {
        const ourPlayer = roomState.players.find(p => p.isConnected);
        if (ourPlayer) {
          playerIdRef.current = ourPlayer.id;
          setPlayerId(ourPlayer.id);
        }
      }
    });

    newSocket.on('error', (message) => {
      setError(message);
    });

    newSocket.on('revealAnswers', (groups) => {
      setAnswerGroups(groups);
    });

    newSocket.on('roundScores', (result) => {
      setRoundResult(result);
    });

    newSocket.on('timerUpdate', (remaining) => {
      setTimeRemaining(remaining);
    });

    newSocket.on('newPrompt', () => {
      setAnswerGroups(null);
      setRoundResult(null);
    });

    newSocket.on('gameStarted', () => {
      setAnswerGroups(null);
      setRoundResult(null);
    });

    newSocket.on('kicked', (blocked) => {
      setRoom(null);
      setPlayerId(null);
      playerIdRef.current = null;
      setWasKicked(true);
      setWasBlocked(blocked);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = useCallback(async (playerName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('createRoom', playerName, (response) => {
        if (response.success && response.roomCode && response.playerId) {
          playerIdRef.current = response.playerId;
          setPlayerId(response.playerId);
          resolve(response.roomCode);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }, [socket]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('joinRoom', roomCode, playerName, (response) => {
        if (response.success && response.playerId) {
          playerIdRef.current = response.playerId;
          setPlayerId(response.playerId);
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket?.emit('leaveRoom');
    setRoom(null);
    setPlayerId(null);
    playerIdRef.current = null;
    setAnswerGroups(null);
    setRoundResult(null);
    setTimeRemaining(null);
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('startGame');
  }, [socket]);

  const submitAnswer = useCallback((answer: string) => {
    socket?.emit('submitAnswer', answer);
  }, [socket]);

  const nextRound = useCallback(() => {
    socket?.emit('nextRound');
  }, [socket]);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    socket?.emit('updateSettings', settings);
  }, [socket]);

  const toggleSpectator = useCallback(() => {
    socket?.emit('toggleSpectator');
  }, [socket]);

  const kickPlayer = useCallback((targetPlayerId: string) => {
    socket?.emit('kickPlayer', targetPlayerId);
  }, [socket]);

  const kickAndBlock = useCallback((targetPlayerId: string) => {
    socket?.emit('kickAndBlock', targetPlayerId);
  }, [socket]);

  const unblockPlayer = useCallback((playerName: string) => {
    socket?.emit('unblockPlayer', playerName);
  }, [socket]);

  const addBot = useCallback(() => {
    socket?.emit('addBot');
  }, [socket]);

  const removeBot = useCallback((botId: string) => {
    socket?.emit('removeBot', botId);
  }, [socket]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearKicked = useCallback(() => {
    setWasKicked(false);
    setWasBlocked(false);
  }, []);

  // Update playerId when room state changes
  useEffect(() => {
    if (room && !playerId) {
      // The server assigns playerId - we need to track it from the room state
      // For now, we'll use the first connected player that matches our socket
    }
  }, [room, playerId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        room,
        playerId,
        error,
        answerGroups,
        roundResult,
        timeRemaining,
        wasKicked,
        wasBlocked,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        submitAnswer,
        nextRound,
        updateSettings,
        toggleSpectator,
        kickPlayer,
        kickAndBlock,
        unblockPlayer,
        addBot,
        removeBot,
        clearError,
        clearKicked,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
