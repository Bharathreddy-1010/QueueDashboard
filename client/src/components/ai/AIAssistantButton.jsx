import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

export const AIAssistantButton = ({ isOpen, onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#050606]/90 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#F5F3EF] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
        Ask QueuePro AI
        <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#050606]/90" />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onClick}
        aria-label="Ask QueuePro AI"
        aria-expanded={isOpen}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-xl ${
          isOpen
            ? 'bg-white/15 text-[#C8FF00] border border-[#C8FF00]/40 shadow-[#C8FF00]/10 rotate-90 scale-95'
            : 'bg-[#C8FF00] text-[#050606] hover:bg-[#bbf000] hover:scale-105 active:scale-95 shadow-[#C8FF00]/25'
        }`}
      >
        <Sparkles className="w-6 h-6 fill-current transition-transform" />

        {/* Ambient Pulsing Ring when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-2xl bg-[#C8FF00]/20 animate-ping pointer-events-none -z-10 [animation-duration:3s]" />
        )}
      </button>
    </div>
  );
};
