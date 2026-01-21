'use client';

import { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Player, RoomSettings } from '../lib/shared/types';

interface LobbyProps {
  currentPlayerId: string;
}

export default function Lobby({ currentPlayerId }: LobbyProps) {
  const { room, startGame, updateSettings, toggleSpectator, kickPlayer, kickAndBlock, unblockPlayer, leaveRoom, addBot, removeBot } = useSocket();
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);

  if (!room) return null;

  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const activePlayers = room.players.filter(p => !p.isSpectator && p.isConnected);
  const spectators = room.players.filter(p => p.isSpectator && p.isConnected);
  const botCount = room.players.filter(p => p.isBot).length;
  const canStart = activePlayers.length >= room.settings.minPlayers;
  const canAddBot = room.players.length < room.settings.maxPlayers && botCount < 5;

  const handleSettingChange = (key: keyof RoomSettings, value: number) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          {/* Blocked Players Panel (Host Only) */}
          {isHost && (
            <div className={`${showBlockedPanel ? 'w-64' : 'w-12'} transition-all duration-300`}>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sticky top-4">
                <button
                  onClick={() => setShowBlockedPanel(!showBlockedPanel)}
                  className="w-full flex items-center justify-between text-white mb-2"
                >
                  {showBlockedPanel ? (
                    <>
                      <span className="font-semibold">Blocked</span>
                      <span className="text-white/50">×</span>
                    </>
                  ) : (
                    <span className="text-lg" title="Blocked Players">🚫</span>
                  )}
                </button>

                {showBlockedPanel && (
                  <div className="space-y-2">
                    {room.blockedPlayers.length === 0 ? (
                      <p className="text-white/50 text-xs">No blocked players</p>
                    ) : (
                      room.blockedPlayers.map((bp, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-red-500/20 rounded-lg p-2 text-sm"
                        >
                          <span className="text-red-200 truncate">{bp.name}</span>
                          <button
                            onClick={() => unblockPlayer(bp.name)}
                            className="text-green-400 hover:text-green-300 text-xs px-2 py-0.5 rounded hover:bg-green-500/20"
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                    {room.blockedPlayers.length > 0 && (
                      <p className="text-white/40 text-xs mt-2">
                        Blocked players cannot rejoin
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 max-w-2xl mx-auto">
            {/* Room Header */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Room Code</h2>
              <div className="text-5xl font-mono font-bold text-pink-400 tracking-widest mb-4">
                {room.code}
              </div>
              <p className="text-purple-200 text-sm">Share this code with friends to join!</p>
            </div>

            {/* Players List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                Players ({activePlayers.length}/{room.settings.maxPlayers})
              </h3>
              <div className="space-y-2">
                {activePlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isCurrentPlayer={player.id === currentPlayerId}
                    isHost={isHost}
                    onKick={() => kickPlayer(player.id)}
                    onKickAndBlock={() => kickAndBlock(player.id)}
                    onRemoveBot={() => removeBot(player.id)}
                  />
                ))}
              </div>

              {spectators.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold text-white/70 mt-6 mb-2">
                    Spectators ({spectators.length})
                  </h4>
                  <div className="space-y-2">
                    {spectators.map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        isCurrentPlayer={player.id === currentPlayerId}
                        isHost={isHost}
                        onKick={() => kickPlayer(player.id)}
                        onKickAndBlock={() => kickAndBlock(player.id)}
                        onRemoveBot={() => removeBot(player.id)}
                        isSpectator
                      />
                    ))}
                  </div>
                </>
              )}

              {activePlayers.length < room.settings.minPlayers && (
                <p className="text-yellow-300 text-sm mt-4">
                  Need {room.settings.minPlayers - activePlayers.length} more player(s) to start
                </p>
              )}

              {/* Add Bot Button (Host Only) */}
              {isHost && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <button
                    onClick={addBot}
                    disabled={!canAddBot}
                    className="w-full bg-blue-500/30 hover:bg-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-blue-200 font-semibold py-2 px-4 rounded-lg transition-all border border-blue-500/30"
                  >
                    + Add CPU Player ({botCount}/5)
                  </button>
                  <p className="text-white/50 text-xs mt-2 text-center">
                    Add bots to test the game solo
                  </p>
                </div>
              )}
            </div>

            {/* Settings (Host Only) */}
            {isHost && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4">
                <h3 className="text-xl font-semibold text-white mb-4">Game Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Timer (seconds)</label>
                    <select
                      value={room.settings.timerDuration}
                      onChange={(e) => handleSettingChange('timerDuration', Number(e.target.value) as 30 | 60 | 90)}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                    >
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Rounds</label>
                    <select
                      value={room.settings.totalRounds}
                      onChange={(e) => handleSettingChange('totalRounds', Number(e.target.value) as 5 | 10 | 15)}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                    >
                      <option value={5}>5 rounds</option>
                      <option value={10}>10 rounds</option>
                      <option value={15}>15 rounds</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {isHost && (
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg"
                >
                  {canStart ? 'Start Game' : `Need ${room.settings.minPlayers} Players`}
                </button>
              )}

              {!isHost && !currentPlayer?.isSpectator && (
                <div className="text-center text-purple-200 py-4">
                  Waiting for host to start the game...
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={toggleSpectator}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-xl transition-all border border-white/30"
                >
                  {currentPlayer?.isSpectator ? 'Join as Player' : 'Spectate'}
                </button>
                <button
                  onClick={leaveRoom}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold py-3 px-4 rounded-xl transition-all border border-red-500/30"
                >
                  Leave Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlayerRowProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHost: boolean;
  onKick: () => void;
  onKickAndBlock: () => void;
  onRemoveBot: () => void;
  isSpectator?: boolean;
}

function PlayerRow({ player, isCurrentPlayer, isHost, onKick, onKickAndBlock, onRemoveBot, isSpectator }: PlayerRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isCurrentPlayer ? 'bg-pink-500/30 border border-pink-500/50' :
        player.isBot ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/10'
      } ${!player.isConnected ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          player.isBot ? 'bg-blue-400' : player.isConnected ? 'bg-green-400' : 'bg-gray-400'
        }`} />
        <span className={`font-medium ${isSpectator ? 'text-white/70' : 'text-white'}`}>
          {player.name}
          {isCurrentPlayer && <span className="text-pink-300 ml-2">(You)</span>}
        </span>
        {player.isHost && (
          <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full">
            Host
          </span>
        )}
        {player.isBot && (
          <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
            CPU
          </span>
        )}
      </div>
      {isHost && !isCurrentPlayer && (
        player.isBot ? (
          <button
            onClick={onRemoveBot}
            className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-500/20 transition-colors"
          >
            Remove
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-20 min-w-[140px] overflow-hidden">
                  <button
                    onClick={() => {
                      onKick();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-white/10 transition-colors"
                  >
                    Kick
                  </button>
                  <button
                    onClick={() => {
                      onKickAndBlock();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors border-t border-white/10"
                  >
                    Kick & Block
                  </button>
                </div>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}
