import React from 'react';
import { Sparkles, RotateCcw, X } from 'lucide-react';

export const AIChatHeader = ({ onNewConversation, onClose, isConfigured = true }) => {
  return (
    <div className="px-5 py-4 border-b border-white/10 bg-[#050606]/80 backdrop-blur-md flex items-center justify-between shrink-0">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#C8FF00] flex items-center justify-center text-[#050606] shadow-sm shadow-[#C8FF00]/30 shrink-0">
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#F5F3EF] tracking-tight">QueuePro AI</h3>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-[#C8FF00] animate-pulse' : 'bg-amber-400'}`} />
              {isConfigured ? 'Copilot Active' : 'Setup Required'}
            </span>
          </div>
          <p className="text-[11px] text-[#F5F3EF]/60 font-medium">Your intelligent queue copilot</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onNewConversation}
          title="New Conversation"
          className="p-1.5 rounded-lg text-[#F5F3EF]/70 hover:text-[#C8FF00] hover:bg-white/5 transition-colors focus:outline-none"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          title="Close AI Assistant"
          className="p-1.5 rounded-lg text-[#F5F3EF]/70 hover:text-[#F5F3EF] hover:bg-white/5 transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
