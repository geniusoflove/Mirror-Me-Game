'use client';

import { Player } from '../lib/shared/types';

interface GameOverProps {
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function GameOver({ players, currentPlayerId, isHost, onPlayAgain, onLeave }: GameOverProps) {
  const sortedPlayers = [...players]
    .filter(p => !p.isSpectator)
    .sort((a, b) => b.score - a.score);

  const winner = sortedPlayers[0];
  const isWinner = winner?.id === currentPlayerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        {/* Winner Announcement */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center mb-4">
          <div className="text-6xl mb-4">
            {isWinner ? '🎉' : '🏆'}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isWinner ? 'You Won!' : `${winner?.name} Wins!`}
          </h2>
          <div className="text-5xl font-bold text-yellow-400 mb-4">
            {winner?.score} points
          </div>
        </div>

        {/* Final Standings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">Final Standings</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const isCurrentPlayer = player.id === currentPlayerId;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentPlayer ? 'bg-pink-500/30 border border-pink-500/50' : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-8 text-center">{medal || index + 1}</span>
                    <span className={`font-medium ${isCurrentPlayer ? 'text-pink-200' : 'text-white'}`}>
                      {player.name}
                      {isCurrentPlayer && <span className="text-pink-300 ml-1">(You)</span>}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-white">{player.score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg"
            >
              Play Again
            </button>
          ) : (
            <div className="text-center text-purple-200 py-4">
              Waiting for host to start a new game...
            </div>
          )}
          <button
            onClick={onLeave}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-white/30"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
