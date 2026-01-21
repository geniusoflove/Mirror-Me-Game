'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

interface JoinScreenProps {
  onRoomJoined: (playerId: string) => void;
}

export default function JoinScreen({ onRoomJoined }: JoinScreenProps) {
  const { isConnected, createRoom, joinRoom, error, clearError, wasKicked, wasBlocked, clearKicked } = useSocket();
  const [showKickedMessage, setShowKickedMessage] = useState(false);

  useEffect(() => {
    if (wasKicked) {
      setShowKickedMessage(true);
    }
  }, [wasKicked]);
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    clearError();

    try {
      const code = await createRoom(playerName.trim());
      onRoomJoined(code);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    clearError();

    try {
      await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      onRoomJoined(roomCode.trim().toUpperCase());
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Connecting to server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-4xl font-bold text-white text-center mb-2">Mirror Me</h1>
        <p className="text-purple-200 text-center mb-8">Match words with your friends!</p>

        {showKickedMessage && (
          <div className={`${wasBlocked ? 'bg-red-500/30 border-red-500/50' : 'bg-yellow-500/30 border-yellow-500/50'} border rounded-lg p-4 mb-4`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`${wasBlocked ? 'text-red-200' : 'text-yellow-200'} font-semibold`}>
                  {wasBlocked ? 'You have been blocked' : 'You were kicked'}
                </p>
                <p className={`${wasBlocked ? 'text-red-300/70' : 'text-yellow-300/70'} text-sm mt-1`}>
                  {wasBlocked
                    ? 'The host has blocked you from rejoining this room.'
                    : 'You were removed from the room by the host.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowKickedMessage(false);
                  clearKicked();
                }}
                className="text-white/50 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {displayError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-200 text-sm">
            {displayError}
          </div>
        )}

        {mode === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/30"
            >
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-purple-200 text-sm mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg"
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
            <button
              onClick={() => {
                setMode('menu');
                setLocalError(null);
              }}
              className="w-full text-white/70 hover:text-white py-2 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-purple-200 text-sm mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-purple-200 text-sm mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase tracking-widest text-center text-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
            <button
              onClick={() => {
                setMode('menu');
                setLocalError(null);
              }}
              className="w-full text-white/70 hover:text-white py-2 transition-colors"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
