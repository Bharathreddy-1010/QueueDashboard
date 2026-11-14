import React from 'react';
import { Sparkles, User, Clock, Database } from 'lucide-react';

/**
 * Lightweight safe markdown-like formatter
 * Converts bold, lists, and lines without dangerouslySetInnerHTML
 */
const FormattedContent = ({ content }) => {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-[#F5F3EF]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading lines
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm text-[#C8FF00] mt-2 mb-1">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-bold text-sm text-[#F5F3EF] mt-2 mb-1">
              {trimmed.replace(/^#+\s/, '')}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#C8FF00] mt-0.5">•</span>
              <span className="flex-1">{renderInline(itemText)}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#C8FF00] font-semibold">{numMatch[1]}.</span>
              <span className="flex-1">{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        // Regular line
        return <p key={idx}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
};

/**
 * Helper to render bold **text** and inline `code`
 */
const renderInline = (text) => {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-[#F5F3EF]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-white/10 text-[#C8FF00] font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

export const AIMessageBubble = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const timeFormatted = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const toolsUsed = message.metadata?.toolsUsed || [];
  const dataRetrievedAt = message.metadata?.dataRetrievedAt
    ? new Date(message.metadata.dataRetrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (isAssistant) {
    return (
      <div className="flex items-start gap-3 my-3">
        <div className="w-7 h-7 rounded-lg bg-[#C8FF00] flex items-center justify-center text-[#050606] shadow-sm shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/10 shadow-sm">
            <FormattedContent content={message.content} />
          </div>

          {/* Metadata Footer: Data Freshness & Tools Used */}
          {(dataRetrievedAt || toolsUsed.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 px-1 text-[10px] text-[#F5F3EF]/40 font-medium">
              {dataRetrievedAt && (
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#C8FF00]/70" />
                  Live data: {dataRetrievedAt}
                </span>
              )}
              {toolsUsed.length > 0 && (
                <span className="flex items-center gap-1">
                  • Tools: {toolsUsed.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Manager message
  return (
    <div className="flex items-start justify-end gap-2.5 my-3">
      <div className="space-y-1 max-w-[85%]">
        <div className="p-3 rounded-2xl rounded-tr-sm bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-xs text-[#F5F3EF] leading-relaxed">
          {message.content}
        </div>
        {timeFormatted && (
          <div className="text-right text-[10px] text-[#F5F3EF]/40 pr-1 flex items-center justify-end gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeFormatted}
          </div>
        )}
      </div>
      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#F5F3EF] shrink-0 mt-0.5">
        <User className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
