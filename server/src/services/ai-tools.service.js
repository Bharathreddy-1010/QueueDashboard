const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Token = require('../models/Token');
const QueueEvent = require('../models/QueueEvent');

/**
 * Format seconds into readable duration string "X min" or "Xm Ys"
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
 * Helper to compute date boundaries based on filter
 */
const getDateRange = (range = 'today', customStart, customEnd) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now);

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (range === 'last_7_days' || range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'last_30_days' || range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  return { startDate, endDate };
};

/**
 * Tool 1: list_my_queues
 * Retrieve all queues belonging to the authenticated manager
 */
const listMyQueues = async ({ managerId }) => {
  if (!managerId) {
    throw new Error('Manager authentication required');
  }

  const queues = await Queue.find({ managerId }).sort({ createdAt: -1 });

  const queueSummaries = await Promise.all(
    queues.map(async (queue) => {
      const [waitingCount, currentServing] = await Promise.all([
        Token.countDocuments({ queueId: queue._id, status: 'WAITING' }),
        Token.findOne({ queueId: queue._id, status: 'IN_SERVICE' }).select('tokenNumber customerName calledAt'),
      ]);

      return {
        queueId: queue._id.toString(),
        name: queue.name,
        prefix: queue.prefix,
        status: queue.status,
        description: queue.description || '',
        waitingCount,
        currentlyServing: currentServing
          ? {
              tokenNumber: currentServing.tokenNumber,
              customerName: currentServing.customerName,
              calledAt: currentServing.calledAt,
            }
          : null,
        createdAt: queue.createdAt,
      };
    })
  );

  return {
    success: true,
    totalQueues: queues.length,
    activeQueuesCount: queues.filter((q) => q.status === 'ACTIVE').length,
    queues: queueSummaries,
    dataRetrievedAt: new Date().toISOString(),
  };
};

/**
 * Tool 2: get_queue_status
 * Retrieve detailed status of a specific queue. Privacy protected (no phone numbers).
 */
const getQueueStatus = async ({ managerId, queueId }) => {
  if (!queueId) {
    throw new Error('queueId is required');
  }
  if (!mongoose.Types.ObjectId.isValid(queueId)) {
    throw new Error('Invalid queueId format');
  }

  const queue = await Queue.findOne({ _id: queueId, managerId });
  if (!queue) {
    return {
      success: false,
      error: 'Queue not found or unauthorized for this manager',
      dataRetrievedAt: new Date().toISOString(),
    };
  }

  const [waitingTokens, inServiceToken] = await Promise.all([
    Token.find({ queueId: queue._id, status: 'WAITING' })
      .sort({ position: 1, createdAt: 1 })
      .select('tokenNumber customerName position createdAt'),
    Token.findOne({ queueId: queue._id, status: 'IN_SERVICE' }).select(
      'tokenNumber customerName calledAt createdAt'
    ),
  ]);

  const now = Date.now();
  const waitingPreview = waitingTokens.slice(0, 15).map((t) => {
    const elapsedSeconds = Math.max(0, Math.round((now - new Date(t.createdAt).getTime()) / 1000));
    return {
      tokenNumber: t.tokenNumber,
      customerName: t.customerName,
      position: t.position,
      elapsedWaitSeconds: elapsedSeconds,
      elapsedWaitFormatted: formatDuration(elapsedSeconds),
    };
  });

  let currentServiceDuration = null;
  if (inServiceToken && inServiceToken.calledAt) {
    const durationSeconds = Math.max(0, Math.round((now - new Date(inServiceToken.calledAt).getTime()) / 1000));
    currentServiceDuration = {
      tokenNumber: inServiceToken.tokenNumber,
      customerName: inServiceToken.customerName,
      calledAt: inServiceToken.calledAt,
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
    };
  }

  return {
    success: true,
    queue: {
      queueId: queue._id.toString(),
      name: queue.name,
      prefix: queue.prefix,
      status: queue.status,
      description: queue.description || '',
    },
    waitingCount: waitingTokens.length,
    currentlyServing: currentServiceDuration,
    waitingTokensPreview: waitingPreview,
    hasMoreWaiting: waitingTokens.length > 15,
    dataRetrievedAt: new Date().toISOString(),
  };
};

/**
 * Tool 3: get_queue_analytics
 * Retrieve performance metrics for a specific queue or all queues
 */
const getQueueAnalytics = async ({ managerId, queueId, dateRange = 'today', startDate, endDate }) => {
  const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate);

  const queueQuery = { managerId };
  if (queueId) {
    if (!mongoose.Types.ObjectId.isValid(queueId)) {
      throw new Error('Invalid queueId format');
    }
    queueQuery._id = queueId;
  }

  const queues = await Queue.find(queueQuery).select('_id name');
  if (queues.length === 0) {
    return {
      success: false,
      error: queueId ? 'Queue not found or unauthorized' : 'No queues found for manager',
      dataRetrievedAt: new Date().toISOString(),
    };
  }

  const queueIds = queues.map((q) => q._id);

  // Aggregate completed and cancelled tokens in the date range
  const [completedTokens, cancelledTokens, currentWaitingCount, currentInServiceCount] = await Promise.all([
    Token.find({
      queueId: { $in: queueIds },
      status: 'COMPLETED',
      completedAt: { $gte: start, $lte: end },
    }).select('createdAt calledAt completedAt'),
    Token.find({
      queueId: { $in: queueIds },
      status: 'CANCELLED',
      cancelledAt: { $gte: start, $lte: end },
    }).select('createdAt cancelledAt cancellationReason'),
    Token.countDocuments({ queueId: { $in: queueIds }, status: 'WAITING' }),
    Token.countDocuments({ queueId: { $in: queueIds }, status: 'IN_SERVICE' }),
  ]);

  // Calculate Average Waiting Time: (calledAt - createdAt) for served tokens
  let totalWaitSeconds = 0;
  let waitCount = 0;
  let totalServiceSeconds = 0;
  let serviceCount = 0;

  for (const t of completedTokens) {
    if (t.calledAt && t.createdAt) {
      const wait = Math.max(0, Math.round((new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime()) / 1000));
      totalWaitSeconds += wait;
      waitCount++;
    }
    if (t.completedAt && t.calledAt) {
      const dur = Math.max(0, Math.round((new Date(t.completedAt).getTime() - new Date(t.calledAt).getTime()) / 1000));
      totalServiceSeconds += dur;
      serviceCount++;
    }
  }

  const avgWaitSeconds = waitCount > 0 ? Math.round(totalWaitSeconds / waitCount) : 0;
  const avgServiceSeconds = serviceCount > 0 ? Math.round(totalServiceSeconds / serviceCount) : 0;

  const totalCompleted = completedTokens.length;
  const totalCancelled = cancelledTokens.length;
  const totalProcessed = totalCompleted + totalCancelled;
  const efficiencyPercentage = totalProcessed > 0 ? Math.round((totalCompleted / totalProcessed) * 100) : 100;

  return {
    success: true,
    scope: queueId ? 'single_queue' : 'all_manager_queues',
    queueName: queueId && queues.length === 1 ? queues[0].name : 'All Queues',
    dateRange,
    period: {
      from: start.toISOString(),
      to: end.toISOString(),
    },
    metrics: {
      currentWaitingCount,
      currentInServiceCount,
      completedCount: totalCompleted,
      cancelledCount: totalCancelled,
      totalProcessed,
      avgWaitingTimeSeconds: avgWaitSeconds,
      avgWaitingTimeFormatted: formatDuration(avgWaitSeconds),
      avgServiceDurationSeconds: avgServiceSeconds,
      avgServiceDurationFormatted: formatDuration(avgServiceSeconds),
      queueEfficiencyPercentage: efficiencyPercentage,
    },
    dataRetrievedAt: new Date().toISOString(),
  };
};

/**
 * Tool 4: compare_my_queues
 * Side-by-side comparison of all queues owned by the manager
 */
const compareMyQueues = async ({ managerId, dateRange = 'today' }) => {
  const { startDate: start, endDate: end } = getDateRange(dateRange);

  const queues = await Queue.find({ managerId }).sort({ name: 1 });
  if (queues.length === 0) {
    return {
      success: true,
      message: 'No queues found for this manager',
      comparison: [],
      dataRetrievedAt: new Date().toISOString(),
    };
  }

  const comparison = await Promise.all(
    queues.map(async (queue) => {
      const [waitingCount, completedTokens, cancelledCount, currentServing] = await Promise.all([
        Token.countDocuments({ queueId: queue._id, status: 'WAITING' }),
        Token.find({
          queueId: queue._id,
          status: 'COMPLETED',
          completedAt: { $gte: start, $lte: end },
        }).select('createdAt calledAt completedAt'),
        Token.countDocuments({
          queueId: queue._id,
          status: 'CANCELLED',
          cancelledAt: { $gte: start, $lte: end },
        }),
        Token.findOne({ queueId: queue._id, status: 'IN_SERVICE' }).select('tokenNumber customerName'),
      ]);

      let totalWaitSec = 0;
      let waitCount = 0;
      let totalServiceSec = 0;
      let serviceCount = 0;

      for (const t of completedTokens) {
        if (t.calledAt && t.createdAt) {
          totalWaitSec += Math.max(0, Math.round((new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime()) / 1000));
          waitCount++;
        }
        if (t.completedAt && t.calledAt) {
          totalServiceSec += Math.max(0, Math.round((new Date(t.completedAt).getTime() - new Date(t.calledAt).getTime()) / 1000));
          serviceCount++;
        }
      }

      const avgWaitSec = waitCount > 0 ? Math.round(totalWaitSec / waitCount) : 0;
      const avgServiceSec = serviceCount > 0 ? Math.round(totalServiceSec / serviceCount) : 0;
      const servedCount = completedTokens.length;
      const totalDecided = servedCount + cancelledCount;
      const efficiency = totalDecided > 0 ? Math.round((servedCount / totalDecided) * 100) : 100;

      return {
        queueId: queue._id.toString(),
        name: queue.name,
        prefix: queue.prefix,
        status: queue.status,
        currentWaiting: waitingCount,
        currentlyServing: currentServing ? currentServing.tokenNumber : 'None',
        peopleServedToday: servedCount,
        cancellationsToday: cancelledCount,
        avgWaitSeconds: avgWaitSec,
        avgWaitFormatted: formatDuration(avgWaitSec),
        avgServiceFormatted: formatDuration(avgServiceSec),
        efficiencyPercentage: efficiency,
      };
    })
  );

  return {
    success: true,
    totalQueues: queues.length,
    dateRange,
    comparison,
    dataRetrievedAt: new Date().toISOString(),
  };
};

/**
 * Tool 5: identify_queue_bottlenecks
 * Operational bottleneck detection using verified transparent thresholds
 */
const identifyQueueBottlenecks = async ({ managerId, queueId }) => {
  const queueQuery = { managerId };
  if (queueId) {
    if (!mongoose.Types.ObjectId.isValid(queueId)) {
      throw new Error('Invalid queueId format');
    }
    queueQuery._id = queueId;
  }

  const queues = await Queue.find(queueQuery);
  if (queues.length === 0) {
    return {
      success: true,
      bottlenecksFound: 0,
      summary: 'No queues found to analyze',
      findings: [],
      dataRetrievedAt: new Date().toISOString(),
    };
  }

  const now = Date.now();
  const { startDate: todayStart, endDate: todayEnd } = getDateRange('today');
  const findings = [];

  for (const queue of queues) {
    const [waitingTokens, completedTokens, cancelledCount, inServiceToken] = await Promise.all([
      Token.find({ queueId: queue._id, status: 'WAITING' }).sort({ createdAt: 1 }).select('createdAt tokenNumber'),
      Token.find({
        queueId: queue._id,
        status: 'COMPLETED',
        completedAt: { $gte: todayStart, $lte: todayEnd },
      }).select('createdAt calledAt completedAt'),
      Token.countDocuments({
        queueId: queue._id,
        status: 'CANCELLED',
        cancelledAt: { $gte: todayStart, $lte: todayEnd },
      }),
      Token.findOne({ queueId: queue._id, status: 'IN_SERVICE' }).select('tokenNumber calledAt'),
    ]);

    const waitingCount = waitingTokens.length;
    const servedCount = completedTokens.length;
    const totalDecided = servedCount + cancelledCount;
    const cancelRate = totalDecided >= 5 ? Math.round((cancelledCount / totalDecided) * 100) : 0;

    let totalWaitSec = 0;
    let waitCount = 0;
    for (const t of completedTokens) {
      if (t.calledAt && t.createdAt) {
        totalWaitSec += Math.max(0, Math.round((new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime()) / 1000));
        waitCount++;
      }
    }
    const avgWaitMinutes = waitCount > 0 ? Math.round(totalWaitSec / waitCount / 60) : 0;

    // Check longest waiting customer currently in line
    let longestElapsedMinutes = 0;
    if (waitingTokens.length > 0) {
      const oldestWaitSec = Math.max(0, Math.round((now - new Date(waitingTokens[0].createdAt).getTime()) / 1000));
      longestElapsedMinutes = Math.round(oldestWaitSec / 60);
    }

    // Check in-service duration
    let servingDurationMinutes = 0;
    if (inServiceToken && inServiceToken.calledAt) {
      const servingSec = Math.max(0, Math.round((now - new Date(inServiceToken.calledAt).getTime()) / 1000));
      servingDurationMinutes = Math.round(servingSec / 60);
    }

    // Threshold Checks:
    // 1. Critical Queue Backlog
    if (waitingCount >= 8) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'CRITICAL',
        type: 'HIGH_BACKLOG',
        title: `Heavy queue backlog in ${queue.name}`,
        observation: `${waitingCount} customers are currently waiting in line.`,
        recommendation: 'Open an additional service desk or reassign staff from lower-traffic queues.',
        metrics: { waitingCount, longestElapsedMinutes },
      });
    } else if (waitingCount >= 4) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'WARNING',
        type: 'MODERATE_BACKLOG',
        title: `Building queue length in ${queue.name}`,
        observation: `${waitingCount} customers waiting.`,
        recommendation: 'Monitor counter throughput to ensure waiting times do not spike.',
        metrics: { waitingCount, longestElapsedMinutes },
      });
    }

    // 2. Long Average Waiting Time
    if (avgWaitMinutes >= 15) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'CRITICAL',
        type: 'EXCESSIVE_WAIT_TIME',
        title: `Excessive average wait time in ${queue.name}`,
        observation: `Average wait time is ${avgWaitMinutes} minutes (exceeds 15 min threshold).`,
        recommendation: 'Streamline consultation steps or prioritize quick service inquiries.',
        metrics: { avgWaitMinutes, longestElapsedMinutes },
      });
    } else if (avgWaitMinutes >= 10) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'WARNING',
        type: 'ELEVATED_WAIT_TIME',
        title: `Elevated wait time in ${queue.name}`,
        observation: `Average wait time is ${avgWaitMinutes} minutes.`,
        recommendation: 'Review service duration per customer to optimize handling speed.',
        metrics: { avgWaitMinutes, longestElapsedMinutes },
      });
    }

    // 3. High Cancellation Rate
    if (cancelRate >= 20) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'WARNING',
        type: 'HIGH_CANCELLATION_RATE',
        title: `High cancellation rate in ${queue.name}`,
        observation: `${cancelRate}% of customers cancelled today (${cancelledCount} cancellations).`,
        recommendation: 'Customers may be abandoning due to perceived wait times. Consider displaying live token updates.',
        metrics: { cancelRate, cancelledCount, servedCount },
      });
    }

    // 4. Stagnant In-Service Token
    if (servingDurationMinutes >= 25 && inServiceToken) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'WARNING',
        type: 'STAGNANT_SERVICE',
        title: `Extended service duration on Token ${inServiceToken.tokenNumber}`,
        observation: `Token ${inServiceToken.tokenNumber} has been in service for ${servingDurationMinutes} minutes.`,
        recommendation: 'Verify if the customer consultation requires escalation or if the ticket was left uncompleted.',
        metrics: { tokenNumber: inServiceToken.tokenNumber, servingDurationMinutes },
      });
    }

    // 5. Inactive Queue with Waiting Tokens
    if (queue.status === 'INACTIVE' && waitingCount > 0) {
      findings.push({
        queueId: queue._id.toString(),
        queueName: queue.name,
        severity: 'CRITICAL',
        type: 'INACTIVE_QUEUE_WITH_CUSTOMERS',
        title: `Inactive queue has stranded customers: ${queue.name}`,
        observation: `Queue is marked INACTIVE but has ${waitingCount} customer(s) waiting.`,
        recommendation: 'Activate the queue immediately or transfer waiting customers to an active station.',
        metrics: { waitingCount },
      });
    }
  }

  return {
    success: true,
    bottlenecksFound: findings.length,
    summary:
      findings.length === 0
        ? 'All queues are operating smoothly within healthy thresholds.'
        : `Identified ${findings.length} operational bottleneck(s) requiring manager attention.`,
    findings,
    dataRetrievedAt: new Date().toISOString(),
  };
};

/**
 * Tool dispatcher mapping allowed function names
 */
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'list_my_queues',
      description:
        "Retrieve all queues owned by the authenticated manager with their status, prefix, waiting customer counts, and currently serving token number.",
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_queue_status',
      description:
        "Retrieve live operational status for a single queue, including waiting count, current in-service token with duration, and preview of currently waiting tokens with elapsed wait times. Customer contact details are redacted for privacy.",
      parameters: {
        type: 'object',
        properties: {
          queueId: {
            type: 'string',
            description: 'The unique MongoDB ObjectId of the queue.',
          },
        },
        required: ['queueId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_queue_analytics',
      description:
        "Retrieve real operational performance metrics (average waiting time, service duration, completed count, cancellation count, queue efficiency) for a specific queue or across all queues for today, last_7_days, last_30_days, or custom range.",
      parameters: {
        type: 'object',
        properties: {
          queueId: {
            type: ['string', 'null'],
            description: 'Optional ObjectId of a specific queue. If omitted or null, aggregates across all manager queues.',
          },
          dateRange: {
            type: ['string', 'null'],
            enum: ['today', 'last_7_days', 'last_30_days', 'custom', null],
            description: "Date range filter. Defaults to 'today'.",
          },
          startDate: {
            type: ['string', 'null'],
            description: 'ISO start date string when dateRange is custom.',
          },
          endDate: {
            type: ['string', 'null'],
            description: 'ISO end date string when dateRange is custom.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_my_queues',
      description:
        "Compare all queues owned by the manager side-by-side, analyzing current waiting count, average wait times, completed counts, cancellations, and efficiency percentages.",
      parameters: {
        type: 'object',
        properties: {
          dateRange: {
            type: ['string', 'null'],
            enum: ['today', 'last_7_days', 'last_30_days', null],
            description: "Aggregation period for completed metrics. Defaults to 'today'.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'identify_queue_bottlenecks',
      description:
        "Analyze real queue metrics against transparent operational thresholds to detect backlogs, prolonged wait times, high cancellations, stranded tokens, or stagnant consultations.",
      parameters: {
        type: 'object',
        properties: {
          queueId: {
            type: ['string', 'null'],
            description: 'Optional ObjectId of a specific queue to focus bottleneck analysis on. Pass null to analyze all queues.',
          },
        },
        additionalProperties: false,
      },
    },
  },
];

/**
 * Execute an allowlisted tool with authenticated manager context
 */
const executeTool = async (name, args = {}, managerId) => {
  const cleanArgs = { ...args };
  if (cleanArgs.queueId === null || cleanArgs.queueId === 'null') cleanArgs.queueId = undefined;
  if (cleanArgs.startDate === null) cleanArgs.startDate = undefined;
  if (cleanArgs.endDate === null) cleanArgs.endDate = undefined;
  if (cleanArgs.dateRange === null) cleanArgs.dateRange = 'today';

  switch (name) {
    case 'list_my_queues':
      return await listMyQueues({ managerId });
    case 'get_queue_status':
      return await getQueueStatus({ managerId, queueId: cleanArgs.queueId });
    case 'get_queue_analytics':
      return await getQueueAnalytics({
        managerId,
        queueId: cleanArgs.queueId,
        dateRange: cleanArgs.dateRange,
        startDate: cleanArgs.startDate,
        endDate: cleanArgs.endDate,
      });
    case 'compare_my_queues':
      return await compareMyQueues({ managerId, dateRange: cleanArgs.dateRange });
    case 'identify_queue_bottlenecks':
      return await identifyQueueBottlenecks({ managerId, queueId: cleanArgs.queueId });
    default:
      throw new Error(`Tool "${name}" is not allowlisted`);
  }
};

module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
  listMyQueues,
  getQueueStatus,
  getQueueAnalytics,
  compareMyQueues,
  identifyQueueBottlenecks,
};
