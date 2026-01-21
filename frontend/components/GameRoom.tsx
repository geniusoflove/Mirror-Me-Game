'use client';

import { useSocket } from '../contexts/SocketContext';
import Lobby from './Lobby';
import PromptCard from './PromptCard';
import AnswerInput from './AnswerInput';
import RevealPhase from './RevealPhase';
import ScoreBoard from './ScoreBoard';
import GameOver from './GameOver';

interface GameRoomProps {
  playerId: string;
  streamerMode?: boolean;
}

export default function GameRoom({ playerId, streamerMode }: GameRoomProps) {
  const { room, answerGroups, roundResult, timeRemaining, submitAnswer, nextRound, leaveRoom, startGame } = useSocket();

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const currentPlayer = room.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const isSpectator = currentPlayer?.isSpectator ?? false;

  // Lobby phase
  if (room.phase === 'lobby') {
    return <Lobby currentPlayerId={playerId} />;
  }

  // Game over phase
  if (room.phase === 'gameOver') {
    return (
      <GameOver
        players={room.players}
        currentPlayerId={playerId}
        isHost={isHost}
        onPlayAgain={startGame}
        onLeave={leaveRoom}
      />
    );
  }

  // Active game phases
  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 ${
      streamerMode ? 'bg-transparent' : ''
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header with room code */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/70">
            Room: <span className="font-mono font-bold text-pink-400">{room.code}</span>
          </div>
          <div className="text-white/70">
            Round {room.currentRound} of {room.settings.totalRounds}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Main game area */}
          <div className="md:col-span-2 space-y-4">
            {/* Prompt display */}
            {room.currentPrompt && (room.phase === 'answering' || room.phase === 'prompt') && (
              <PromptCard
                prompt={room.currentPrompt}
                round={room.currentRound}
                totalRounds={room.settings.totalRounds}
              />
            )}

            {/* Answer input (answering phase) */}
            {room.phase === 'answering' && !isSpectator && (
              <AnswerInput
                onSubmit={submitAnswer}
                timeRemaining={timeRemaining}
                hasSubmitted={currentPlayer?.hasSubmitted ?? false}
                hideInput={streamerMode}
              />
            )}

            {/* Spectator view during answering */}
            {room.phase === 'answering' && isSpectator && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
                <div className="text-white/70 text-lg">Spectating...</div>
                <div className="text-4xl font-bold text-pink-400 mt-2">
                  {room.players.filter(p => p.hasSubmitted && !p.isSpectator).length} / {room.players.filter(p => !p.isSpectator).length}
                </div>
                <div className="text-white/50 text-sm mt-1">players answered</div>
                {timeRemaining !== null && (
                  <div className={`text-3xl font-bold mt-4 ${
                    timeRemaining <= 10 ? 'text-red-400' : timeRemaining <= 30 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {timeRemaining}s
                  </div>
                )}
              </div>
            )}

            {/* Reveal phase */}
            {room.phase === 'reveal' && answerGroups && room.currentPrompt && (
              <RevealPhase answerGroups={answerGroups} prompt={room.currentPrompt} />
            )}

            {/* Scoring phase */}
            {room.phase === 'scoring' && (
              <div className="space-y-4">
                {answerGroups && room.currentPrompt && (
                  <RevealPhase answerGroups={answerGroups} prompt={room.currentPrompt} />
                )}

                {isHost && (
                  <button
                    onClick={nextRound}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-xl transition-all text-xl shadow-lg"
                  >
                    {room.currentRound >= room.settings.totalRounds ? 'See Final Results' : 'Next Round'}
                  </button>
                )}

                {!isHost && (
                  <div className="text-center text-purple-200 py-4">
                    Waiting for host to continue...
                  </div>
                )}
              </div>
            )}

            {/* Prompt phase (brief transition) */}
            {room.phase === 'prompt' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                <div className="text-2xl text-white animate-pulse">Get Ready...</div>
              </div>
            )}
          </div>

          {/* Sidebar - Scoreboard */}
          <div className="md:col-span-1">
            <ScoreBoard
              players={room.players}
              roundResult={roundResult}
              currentPlayerId={playerId}
              showRoundScores={room.phase === 'scoring'}
            />

            {/* Players submitted indicator during answering */}
            {room.phase === 'answering' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-4">
                <div className="text-white/70 text-sm text-center mb-2">Submitted</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {room.players
                    .filter(p => !p.isSpectator)
                    .map(player => (
                      <div
                        key={player.id}
                        className={`w-3 h-3 rounded-full transition-all ${
                          player.hasSubmitted ? 'bg-green-400' : 'bg-white/30'
                        }`}
                        title={player.name}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
