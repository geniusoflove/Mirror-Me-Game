'use client';

import { AnswerGroup } from '../lib/shared/types';

interface RevealPhaseProps {
  answerGroups: AnswerGroup[];
  prompt: string;
}

export default function RevealPhase({ answerGroups, prompt }: RevealPhaseProps) {
  // Sort by points (highest first), then by number of players
  const sortedGroups = [...answerGroups].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.playerIds.length - a.playerIds.length;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
        <div className="text-purple-300 text-sm mb-2">Prompt</div>
        <div className="text-2xl font-bold text-white">{prompt}</div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">Answers Revealed!</h3>
        <div className="space-y-3">
          {sortedGroups.map((group, index) => (
            <AnswerGroupCard key={index} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AnswerGroupCardProps {
  group: AnswerGroup;
}

function AnswerGroupCard({ group }: AnswerGroupCardProps) {
  const getBgColor = () => {
    if (group.points === 3) return 'bg-green-500/30 border-green-500/50';
    if (group.points === 1) return 'bg-blue-500/30 border-blue-500/50';
    return 'bg-gray-500/30 border-gray-500/50';
  };

  const getPointsLabel = () => {
    if (group.points === 3) return 'Perfect Match! +3';
    if (group.points === 1) return 'Close Match +1';
    return 'No Match +0';
  };

  return (
    <div className={`rounded-xl p-4 border ${getBgColor()} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-white">{group.answer}</span>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          group.points === 3 ? 'bg-green-500 text-white' :
          group.points === 1 ? 'bg-blue-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {getPointsLabel()}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {group.playerNames.map((name, i) => (
          <span
            key={i}
            className="text-sm bg-white/20 text-white px-3 py-1 rounded-full"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
