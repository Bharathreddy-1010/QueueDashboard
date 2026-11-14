import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp } from 'lucide-react';

export const AIChatInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-3 border-t border-white/10 bg-[#050606]/90 backdrop-blur-md">
      <div className="relative flex items-end gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#C8FF00]/50 transition-colors">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Waiting for response...' : 'Ask about your queues (Enter to send)...'}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#F5F3EF] placeholder-[#F5F3EF]/30 outline-none resize-none max-h-28 scrollbar-thin scrollbar-thumb-white/10"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          title="Send question"
          className="p-2 rounded-xl bg-[#C8FF00] text-[#050606] font-bold hover:bg-[#b5e600] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm shrink-0"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-[#F5F3EF]/40 font-medium">
        <span>Powered by Groq • Read-Only Copilot</span>
        <span>Shift + Enter for new line</span>
      </div>
    </div>
  );
};
