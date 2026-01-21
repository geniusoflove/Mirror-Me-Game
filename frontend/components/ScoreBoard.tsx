'use client';

import { Player, RoundResult } from '../lib/shared/types';

interface ScoreBoardProps {
  players: Player[];
  roundResult?: RoundResult | null;
  currentPlayerId: string;
  showRoundScores?: boolean;
}

export default function ScoreBoard({ players, roundResult, currentPlayerId, showRoundScores }: ScoreBoardProps) {
  // Sort players by score (highest first)
  const sortedPlayers = [...players]
    .filter(p => !p.isSpectator)
    .sort((a, b) => b.score - a.score);

  const getRoundPoints = (playerId: string): number | null => {
    if (!roundResult) return null;
    const ps = roundResult.playerScores.find(s => s.playerId === playerId);
    return ps ? ps.points : null;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 text-center">Scoreboard</h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const roundPoints = showRoundScores ? getRoundPoints(player.id) : null;
          const isLeader = index === 0;
          const isCurrentPlayer = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isCurrentPlayer
                  ? 'bg-pink-500/30 border border-pink-500/50'
                  : isLeader
                    ? 'bg-yellow-500/20 border border-yellow-500/30'
                    : 'bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-white/20 text-white'
                }`}>
                  {index + 1}
                </span>
                <span className={`font-medium ${isCurrentPlayer ? 'text-pink-200' : 'text-white'}`}>
                  {player.name}
                  {isCurrentPlayer && <span className="text-pink-300 ml-1">(You)</span>}
                </span>
                {!player.isConnected && (
                  <span className="text-xs text-gray-400">(disconnected)</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {roundPoints !== null && (
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                    roundPoints === 3 ? 'bg-green-500/30 text-green-300' :
                    roundPoints === 1 ? 'bg-blue-500/30 text-blue-300' :
                    'bg-gray-500/30 text-gray-400'
                  }`}>
                    +{roundPoints}
                  </span>
                )}
                <span className="text-2xl font-bold text-white">{player.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
