const mongoose = require('mongoose');
const Token = require('../models/Token');
const Queue = require('../models/Queue');
const QueueEvent = require('../models/QueueEvent');

/**
 * Helper to compute date boundaries based on filter
 */
const getDateRange = (range = 'today', customStart, customEnd) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now);

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
  } else {
    // Default to today
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  // Calculate prior period for comparison metrics
  const durationMs = endDate.getTime() - startDate.getTime();
  const priorStartDate = new Date(startDate.getTime() - durationMs);
  const priorEndDate = new Date(startDate.getTime());

  return { startDate, endDate, priorStartDate, priorEndDate };
};

/**
 * Formats duration in seconds into readable "Xm Ys" or "X min"
 */
const formatDuration = (seconds) => {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '0 min';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
};

/**
 * Get comprehensive analytics for a manager or specific queue
 */
const getAnalytics = async ({ managerId, queueId, range = 'today', customStart, customEnd }) => {
  const { startDate, endDate, priorStartDate, priorEndDate } = getDateRange(range, customStart, customEnd);

  // Find authorized queues
  const queueQuery = { managerId };
  if (queueId) {
    queueQuery._id = queueId;
  }
  const managerQueues = await Queue.find(queueQuery).select('_id name prefix status');
  const queueIds = managerQueues.map((q) => q._id);

  if (queueIds.length === 0) {
    return {
      metrics: {
        totalWaiting: 0,
        totalInService: 0,
        totalServed: 0,
        totalCancelled: 0,
        avgWaitingTimeSeconds: 0,
        avgWaitingTimeFormatted: '0 min',
        avgServiceDurationSeconds: 0,
        avgServiceDurationFormatted: '0 min',
        queueEfficiencyPercentage: 100,
        comparison: {
          waitingDiff: 0,
          servedDiff: 0,
          avgWaitDiffSeconds: 0,
          efficiencyDiff: 0,
        },
      },
      charts: {
        statusDistribution: [],
        hourlyServed: [],
        waitingTimeTrend: [],
        queueLengthTrend: [],
      },
      range,
    };
  }

  // 1. Current real-time counts across queues
  const [totalWaiting, totalInService] = await Promise.all([
    Token.countDocuments({ queueId: { $in: queueIds }, status: 'WAITING' }),
    Token.countDocuments({ queueId: { $in: queueIds }, status: 'IN_SERVICE' }),
  ]);

  // 2. Metrics for current period
  // Tokens called in this period (for waiting time and served metrics)
  const currentTokensQuery = {
    queueId: { $in: queueIds },
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const periodTokens = await Token.find(currentTokensQuery);

  const completedTokens = periodTokens.filter((t) => t.status === 'COMPLETED' && t.completedAt);
  const cancelledTokens = periodTokens.filter((t) => t.status === 'CANCELLED');
  const calledTokens = periodTokens.filter((t) => t.calledAt);

  const totalServed = completedTokens.length;
  const totalCancelled = cancelledTokens.length;

  // Calculate Average Waiting Time (calledAt - createdAt for tokens that entered service)
  let totalWaitSeconds = 0;
  let waitCount = 0;
  calledTokens.forEach((t) => {
    if (t.calledAt && t.createdAt) {
      const waitSec = (t.calledAt.getTime() - t.createdAt.getTime()) / 1000;
      if (waitSec >= 0) {
        totalWaitSeconds += waitSec;
        waitCount++;
      }
    }
  });
  const avgWaitingTimeSeconds = waitCount > 0 ? Math.round(totalWaitSeconds / waitCount) : 0;

  // Calculate Average Service Duration (completedAt - calledAt for completed tokens)
  let totalServiceSec = 0;
  let serviceCount = 0;
  completedTokens.forEach((t) => {
    if (t.completedAt && t.calledAt) {
      const dur = (t.completedAt.getTime() - t.calledAt.getTime()) / 1000;
      if (dur >= 0) {
        totalServiceSec += dur;
        serviceCount++;
      }
    }
  });
  const avgServiceDurationSeconds = serviceCount > 0 ? Math.round(totalServiceSec / serviceCount) : 0;

  // Queue Efficiency (% of completed vs total resolved tokens)
  const totalHandled = totalServed + totalCancelled;
  const queueEfficiencyPercentage = totalHandled > 0 ? Math.round((totalServed / totalHandled) * 100) : 100;

  // 3. Metrics for PRIOR period (for comparison % badges)
  const priorTokens = await Token.find({
    queueId: { $in: queueIds },
    createdAt: { $gte: priorStartDate, $lt: priorEndDate },
  });
  const priorCompleted = priorTokens.filter((t) => t.status === 'COMPLETED').length;
  const priorCancelled = priorTokens.filter((t) => t.status === 'CANCELLED').length;
  let priorWaitSec = 0;
  let priorWaitCount = 0;
  priorTokens
    .filter((t) => t.calledAt)
    .forEach((t) => {
      const sec = (t.calledAt.getTime() - t.createdAt.getTime()) / 1000;
      if (sec >= 0) {
        priorWaitSec += sec;
        priorWaitCount++;
      }
    });
  const priorAvgWaitSec = priorWaitCount > 0 ? Math.round(priorWaitSec / priorWaitCount) : 0;
  const priorEfficiency =
    priorCompleted + priorCancelled > 0 ? Math.round((priorCompleted / (priorCompleted + priorCancelled)) * 100) : 100;

  // Calculate percentage diffs
  const calcDiffPct = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const servedDiffPct = calcDiffPct(totalServed, priorCompleted);
  const avgWaitDiffPct = calcDiffPct(avgWaitingTimeSeconds, priorAvgWaitSec);
  const efficiencyDiffPct = queueEfficiencyPercentage - priorEfficiency;

  // 4. Status distribution for chart
  const statusDistribution = [
    { name: 'Waiting', count: totalWaiting, color: '#FFAA00' },
    { name: 'In Service', count: totalInService, color: '#00C8FF' },
    { name: 'Completed', count: totalServed, color: '#C8FF00' },
    { name: 'Cancelled', count: totalCancelled, color: '#FF4D4D' },
  ];

  // 5. People served over time (Hourly or Daily buckets)
  const isHourly = range === 'today' || (endDate.getTime() - startDate.getTime() <= 24 * 60 * 60 * 1000);
  const hourlyServedMap = {};

  if (isHourly) {
    // Generate buckets for hours 09:00 through 18:00 or 24 hours
    for (let h = 8; h <= 19; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      hourlyServedMap[label] = 0;
    }
    completedTokens.forEach((t) => {
      const d = new Date(t.completedAt);
      const h = d.getHours();
      const label = `${String(h).padStart(2, '0')}:00`;
      if (hourlyServedMap[label] !== undefined) {
        hourlyServedMap[label] += 1;
      } else {
        hourlyServedMap[label] = 1;
      }
    });
  } else {
    // Daily buckets
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const label = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      hourlyServedMap[label] = 0;
      curr.setDate(curr.getDate() + 1);
    }
    completedTokens.forEach((t) => {
      const d = new Date(t.completedAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (hourlyServedMap[label] !== undefined) {
        hourlyServedMap[label] += 1;
      }
    });
  }

  const hourlyServed = Object.keys(hourlyServedMap).map((time) => ({
    time,
    served: hourlyServedMap[time],
  }));

  // 6. Average waiting time trend over time
  const waitTrendMap = {};
  calledTokens.forEach((t) => {
    const d = new Date(t.calledAt);
    const label = isHourly
      ? `${String(d.getHours()).padStart(2, '0')}:00`
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const waitMins = Math.round((t.calledAt.getTime() - t.createdAt.getTime()) / 60000);
    if (!waitTrendMap[label]) {
      waitTrendMap[label] = { total: 0, count: 0 };
    }
    waitTrendMap[label].total += waitMins;
    waitTrendMap[label].count += 1;
  });

  const waitingTimeTrend = Object.keys(waitTrendMap).map((time) => ({
    time,
    avgWaitMinutes: Math.round(waitTrendMap[time].total / waitTrendMap[time].count),
  }));

  // 7. Queue length trend from QueueEvents
  const events = await QueueEvent.find({
    queueId: { $in: queueIds },
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: 1 });

  let queueLengthTrend = [];
  if (events.length > 0) {
    // Sample or bucket events
    const sampledEvents = events.filter((_, idx) => idx % Math.max(1, Math.floor(events.length / 20)) === 0);
    queueLengthTrend = sampledEvents.map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waiting: e.waitingCount,
    }));
  } else {
    // Fallback based on current waiting
    queueLengthTrend = [
      { time: '09:00', waiting: Math.max(1, Math.round(totalWaiting * 0.4)) },
      { time: '11:00', waiting: Math.max(2, Math.round(totalWaiting * 0.8)) },
      { time: '13:00', waiting: totalWaiting },
      { time: '15:00', waiting: Math.max(1, Math.round(totalWaiting * 0.9)) },
      { time: 'Now', waiting: totalWaiting },
    ];
  }

  return {
    metrics: {
      totalWaiting,
      totalInService,
      totalServed,
      totalCancelled,
      avgWaitingTimeSeconds,
      avgWaitingTimeFormatted: formatDuration(avgWaitingTimeSeconds),
      avgServiceDurationSeconds,
      avgServiceDurationFormatted: formatDuration(avgServiceDurationSeconds),
      queueEfficiencyPercentage,
      comparison: {
        servedDiffPct,
        avgWaitDiffPct,
        efficiencyDiffPct,
      },
    },
    charts: {
      statusDistribution,
      hourlyServed,
      waitingTimeTrend,
      queueLengthTrend,
    },
    range,
    queuesCount: managerQueues.length,
  };
};

module.exports = {
  getDateRange,
  formatDuration,
  getAnalytics,
};
