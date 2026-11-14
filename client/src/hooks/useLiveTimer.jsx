import { useState, useEffect } from 'react';
import { getElapsedTimeSeconds, formatSeconds } from '../utils/formatters';

export const useLiveTimer = (startTime) => {
  const [seconds, setSeconds] = useState(() => getElapsedTimeSeconds(startTime));

  useEffect(() => {
    if (!startTime) return;

    setSeconds(getElapsedTimeSeconds(startTime));

    const interval = setInterval(() => {
      setSeconds(getElapsedTimeSeconds(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return {
    seconds,
    formatted: formatSeconds(seconds),
  };
};

export const LiveTimerDisplay = ({ startTime, fallback = '0s' }) => {
  const { formatted } = useLiveTimer(startTime);
  if (!startTime) return <span>{fallback}</span>;
  return <span className="font-mono">{formatted}</span>;
};
