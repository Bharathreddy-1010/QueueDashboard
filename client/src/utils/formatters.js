/**
 * Formats duration in seconds to "Xm Ys" or "X min"
 */
export const formatSeconds = (seconds) => {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

/**
 * Calculates live elapsed time from a start timestamp (Date or ISO string)
 */
export const getElapsedTimeSeconds = (startDate) => {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 1000));
};

/**
 * Formats date into readable string (e.g. "Nov 14, 2025, 10:30 AM")
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats time only (e.g. "10:30 AM")
 */
export const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Color classes for token statuses
 */
export const STATUS_CONFIG = {
  WAITING: {
    label: 'Waiting',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    border: 'border-amber-400/30',
  },
  IN_SERVICE: {
    label: 'In Service',
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    dot: 'bg-sky-400 animate-pulse',
    border: 'border-sky-400/40',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-[#C8FF00]/10 text-[#C8FF00] border-[#C8FF00]/20',
    dot: 'bg-[#C8FF00]',
    border: 'border-[#C8FF00]/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
    border: 'border-rose-400/30',
  },
};
