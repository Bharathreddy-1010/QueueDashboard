import React from 'react';
import { ArrowRight, Sparkles, AlertCircle, BarChart3, Users, Clock, Zap } from 'lucide-react';

const SUGGESTIONS = [
  {
    text: "Give me today's queue summary.",
    icon: Sparkles,
  },
  {
    text: "Which queue has the longest waiting time?",
    icon: Clock,
  },
  {
    text: "How many customers have we served today?",
    icon: Users,
  },
  {
    text: "Identify bottlenecks in my queues.",
    icon: AlertCircle,
  },
  {
    text: "Compare my queues.",
    icon: BarChart3,
  },
  {
    text: "How can I reduce average waiting time?",
    icon: Zap,
  },
];

export const AISuggestionChips = ({ onSelectPrompt, disabled = false }) => {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5F3EF]/50">
        <Sparkles className="w-3.5 h-3.5 text-[#C8FF00]" />
        Suggested questions
      </div>
      <div className="grid grid-cols-1 gap-2">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelectPrompt(item.text)}
              className="group text-left px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-[#C8FF00]/10 border border-white/5 hover:border-[#C8FF00]/30 transition-all flex items-center justify-between gap-3 text-xs text-[#F5F3EF]/90 hover:text-[#F5F3EF] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-3.5 h-3.5 text-[#C8FF00] shrink-0 opacity-80 group-hover:opacity-100" />
                <span className="truncate">{item.text}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#C8FF00] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
