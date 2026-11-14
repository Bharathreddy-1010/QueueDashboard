import React from 'react';

export const LoadingSkeleton = ({ lines = 4, className = '' }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="h-12 bg-white/5 border border-white/5 rounded-xl w-full"
          style={{ opacity: 1 - idx * 0.15 }}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-32 bg-[#F5F3EF]/10 border border-[#DDD8CE]/10 rounded-2xl p-5"
        />
      ))}
    </div>
  );
};
