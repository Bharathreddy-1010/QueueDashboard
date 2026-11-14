import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const AIErrorState = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="mx-4 my-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 flex items-start gap-3">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="font-medium text-red-300">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-semibold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
