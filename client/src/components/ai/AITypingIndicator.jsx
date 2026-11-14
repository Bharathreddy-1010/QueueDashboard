import React from 'react';
import { Sparkles } from 'lucide-react';

export const AITypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 my-2">
      <div className="w-7 h-7 rounded-lg bg-[#C8FF00] flex items-center justify-center text-[#050606] shadow-sm shrink-0">
        <Sparkles className="w-3.5 h-3.5 fill-current" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/10 text-xs text-[#F5F3EF]/80 flex items-center gap-2.5">
        <span className="font-medium text-[#F5F3EF]">QueuePro AI is analyzing your queues</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-bounce" />
        </div>
      </div>
    </div>
  );
};
