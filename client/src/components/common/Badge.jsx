import React from 'react';
import { STATUS_CONFIG } from '../../utils/formatters';

export const Badge = ({ status, variant, children, className = '' }) => {
  if (status && STATUS_CONFIG[status]) {
    const config = STATUS_CONFIG[status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span>{children || config.label}</span>
      </span>
    );
  }

  // Active / Inactive for queues
  if (status === 'ACTIVE' || variant === 'active') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/25 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
        <span>{children || 'Active'}</span>
      </span>
    );
  }

  if (status === 'INACTIVE' || variant === 'inactive') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
        <span>{children || 'Inactive'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-[#F5F3EF] border border-white/10 ${className}`}
    >
      {children}
    </span>
  );
};
