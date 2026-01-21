'use client';

interface PromptCardProps {
  prompt: string;
  round: number;
  totalRounds: number;
}

export default function PromptCard({ prompt, round, totalRounds }: PromptCardProps) {
  // Split the prompt to highlight the blank
  const parts = prompt.split('___');

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
      <div className="text-purple-300 text-sm mb-2">
        Round {round} of {totalRounds}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white leading-relaxed">
        {parts[0]}
        <span className="inline-block min-w-[120px] border-b-4 border-pink-400 mx-2" />
        {parts[1]}
      </div>
    </div>
  );
}
