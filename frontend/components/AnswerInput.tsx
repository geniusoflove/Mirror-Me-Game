'use client';

import { useState, useEffect, useRef } from 'react';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  timeRemaining: number | null;
  hasSubmitted: boolean;
  hideInput?: boolean;
}

export default function AnswerInput({ onSubmit, timeRemaining, hasSubmitted, hideInput }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Reset answer when new round starts (timeRemaining resets)
    if (timeRemaining === 60 || timeRemaining === 30 || timeRemaining === 90) {
      setAnswer('');
    }
  }, [timeRemaining]);

  const handleSubmit = () => {
    if (answer.trim() && !hasSubmitted) {
      onSubmit(answer.trim());
    }
  };

  const timerColor = timeRemaining !== null && timeRemaining <= 10
    ? 'text-red-400'
    : timeRemaining !== null && timeRemaining <= 30
      ? 'text-yellow-400'
      : 'text-green-400';

  if (hasSubmitted) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
        <div className="text-green-400 text-xl font-semibold mb-2">Answer Submitted!</div>
        <div className="text-white/70">Waiting for other players...</div>
        {timeRemaining !== null && (
          <div className={`text-4xl font-bold mt-4 ${timerColor}`}>
            {timeRemaining}s
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      {timeRemaining !== null && (
        <div className={`text-center text-5xl font-bold mb-6 ${timerColor}`}>
          {timeRemaining}s
        </div>
      )}

      <div className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={hideInput ? '' : answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={hideInput ? '••••••••' : 'Enter one word...'}
          maxLength={30}
          disabled={hideInput}
          className="w-full bg-white/20 border-2 border-white/30 rounded-xl px-6 py-4 text-white text-2xl text-center placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || hideInput}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all text-xl shadow-lg"
        >
          Lock In Answer
        </button>
      </div>
    </div>
  );
}
