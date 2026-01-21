'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import JoinScreen from '../components/JoinScreen';
import GameRoom from '../components/GameRoom';

export default function Home() {
  const { room, playerId } = useSocket();
  const [streamerMode, setStreamerMode] = useState(false);

  // Toggle streamer mode with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        setStreamerMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!room || !playerId) {
    return <JoinScreen onRoomJoined={() => {}} />;
  }

  return (
    <>
      {streamerMode && (
        <div className="fixed top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-50">
          STREAMER MODE (Ctrl+Shift+S to toggle)
        </div>
      )}
      <GameRoom playerId={playerId} streamerMode={streamerMode} />
    </>
  );
}
