import React, { useEffect, useRef } from 'react';
import { AIMessageBubble } from './AIMessageBubble';
import { AITypingIndicator } from './AITypingIndicator';
import { AISuggestionChips } from './AISuggestionChips';
import { Sparkles } from 'lucide-react';

export const AIMessageList = ({ messages, isLoading, onSelectPrompt }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
      {messages.length === 0 ? (
        <div className="py-4 space-y-4">
          <div className="text-center px-4 py-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center mx-auto text-[#C8FF00]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#F5F3EF]">How can I assist your operations?</h4>
            <p className="text-xs text-[#F5F3EF]/60 max-w-xs mx-auto leading-relaxed">
              Ask about active queue lengths, waiting times, service rates, or let me detect bottlenecks.
            </p>
          </div>

          <AISuggestionChips onSelectPrompt={onSelectPrompt} disabled={isLoading} />
        </div>
      ) : (
        <>
          {messages.map((msg, idx) => (
            <AIMessageBubble key={msg.id || idx} message={msg} />
          ))}
          {isLoading && <AITypingIndicator />}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
