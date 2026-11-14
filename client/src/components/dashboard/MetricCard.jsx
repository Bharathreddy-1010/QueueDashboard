import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MetricCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  diffPct = null,
  diffLabel = 'vs yesterday',
  isPositiveGood = true,
  highlight = false,
}) => {
  const isPositive = diffPct > 0;
  const isNeutral = diffPct === 0 || diffPct == null;

  let trendColor = 'text-[#626868]';
  if (!isNeutral) {
    if (isPositive) {
      trendColor = isPositiveGood ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10';
    } else {
      trendColor = isPositiveGood ? 'text-rose-600 bg-rose-500/10' : 'text-emerald-600 bg-emerald-500/10';
    }
  }

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 bg-[#F5F3EF] text-[#050606] border-[#DDD8CE] shadow-card hover:shadow-md ${
        highlight ? 'ring-2 ring-[#C8FF00]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#626868]">
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-[#050606] text-[#C8FF00] flex items-center justify-center shadow-sm">
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold tracking-tight text-[#050606] font-mono">
          {value}
        </h3>

        {diffPct != null && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColor}`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : diffPct < 0 ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(diffPct)}%</span>
          </div>
        )}
      </div>

      {subtext && <p className="mt-2 text-xs text-[#7A8080]">{subtext}</p>}
    </div>
  );
};
