import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/dashboard/MetricCard';
import { CurrentServingBanner } from '../components/dashboard/CurrentServingBanner';
import { QueueOverviewTable } from '../components/dashboard/QueueOverviewTable';
import { QuickAnalytics } from '../components/dashboard/QuickAnalytics';
import { AddTokenModal } from '../components/tokens/AddTokenModal';
import { CancelTokenModal } from '../components/tokens/CancelTokenModal';
import { CardSkeleton, LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { queueApi } from '../api/queueApi';
import { tokenApi } from '../api/tokenApi';
import { analyticsApi } from '../api/analyticsApi';
import { useSocket } from '../context/SocketContext';
import {
  Users,
  Clock,
  CheckCircle,
  Zap,
  Plus,
  RefreshCw,
  Layers,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardPage = () => {
  const { openSidebar } = useOutletContext() || {};
  const { socket, joinQueue, leaveQueue } = useSocket();

  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [tokenToCancel, setTokenToCancel] = useState(null);

  // Action loading states
  const [isServingLoading, setIsServingLoading] = useState(false);
  const [isCompleteLoading, setIsCompleteLoading] = useState(false);

  // Load initial Queues and Analytics
  const loadDashboardData = useCallback(async (queueIdToSelect = null) => {
    try {
      const [queuesRes, analyticsRes] = await Promise.all([
        queueApi.getQueues(),
        analyticsApi.getOverview({ range: 'today' }),
      ]);

      if (queuesRes.success) {
        setQueues(queuesRes.data);
        const activeQueueId =
          queueIdToSelect ||
          selectedQueueId ||
          (queuesRes.data.length > 0 ? queuesRes.data[0]._id : null);

        setSelectedQueueId(activeQueueId);
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedQueueId]);

  // Load Tokens and Details for selected queue
  const loadQueueTokens = useCallback(async (queueId) => {
    if (!queueId) return;
    try {
      const [tokensRes, queueRes] = await Promise.all([
        tokenApi.getTokens(queueId),
        queueApi.getQueueById(queueId),
      ]);

      if (tokensRes.success) {
        setTokens(tokensRes.data.tokens || []);
      }
      if (queueRes.success) {
        setSelectedQueue(queueRes.data);
        setCurrentlyServing(queueRes.data.currentlyServing || null);
      }
    } catch (err) {
      console.error('Failed to load queue tokens:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedQueueId) {
      loadQueueTokens(selectedQueueId);
      joinQueue(selectedQueueId);

      return () => {
        leaveQueue(selectedQueueId);
      };
    }
  }, [selectedQueueId, loadQueueTokens, joinQueue, leaveQueue]);

  // Socket.IO event listeners for real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleTokenAdded = (payload) => {
      if (payload.queueId === selectedQueueId) {
        loadQueueTokens(selectedQueueId);
      }
      // Refresh overall analytics
      analyticsApi.getOverview({ range: 'today' }).then((res) => {
        if (res.success) setAnalytics(res.data);
      });
    };

    const handleTokenMoved = (payload) => {
      if (payload.queueId === selectedQueueId) {
        loadQueueTokens(selectedQueueId);
      }
    };

    const handleTokenServed = (payload) => {
      if (payload.queueId === selectedQueueId) {
        loadQueueTokens(selectedQueueId);
      }
      analyticsApi.getOverview({ range: 'today' }).then((res) => {
        if (res.success) setAnalytics(res.data);
      });
    };

    const handleTokenCompleted = (payload) => {
      if (payload.queueId === selectedQueueId) {
        loadQueueTokens(selectedQueueId);
      }
      analyticsApi.getOverview({ range: 'today' }).then((res) => {
        if (res.success) setAnalytics(res.data);
      });
    };

    const handleTokenCancelled = (payload) => {
      if (payload.queueId === selectedQueueId) {
        loadQueueTokens(selectedQueueId);
      }
      analyticsApi.getOverview({ range: 'today' }).then((res) => {
        if (res.success) setAnalytics(res.data);
      });
    };

    socket.on('queue:token_added', handleTokenAdded);
    socket.on('queue:token_moved', handleTokenMoved);
    socket.on('queue:token_served', handleTokenServed);
    socket.on('queue:token_completed', handleTokenCompleted);
    socket.on('queue:token_cancelled', handleTokenCancelled);

    return () => {
      socket.off('queue:token_added', handleTokenAdded);
      socket.off('queue:token_moved', handleTokenMoved);
      socket.off('queue:token_served', handleTokenServed);
      socket.off('queue:token_completed', handleTokenCompleted);
      socket.off('queue:token_cancelled', handleTokenCancelled);
    };
  }, [socket, selectedQueueId, loadQueueTokens]);

  // Handle Token Actions
  const handleAddToken = async ({ customerName, phoneNumber }) => {
    if (!selectedQueueId) return;
    const res = await tokenApi.addToken(selectedQueueId, { customerName, phoneNumber });
    if (res.success) {
      toast.success(`Token ${res.data.tokenNumber} created for ${customerName}`);
      loadQueueTokens(selectedQueueId);
    }
  };

  const handleServeNext = async () => {
    if (!selectedQueueId) return;
    setIsServingLoading(true);
    try {
      const res = await tokenApi.serveNext(selectedQueueId);
      if (res.success) {
        toast.success(`Now serving: ${res.data.tokenNumber} (${res.data.customerName})`, {
          icon: '🛎️',
        });
        await loadQueueTokens(selectedQueueId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to serve next token');
    } finally {
      setIsServingLoading(false);
    }
  };

  const handleCompleteService = async (token) => {
    if (!token?._id) return;
    setIsCompleteLoading(true);
    try {
      const res = await tokenApi.completeToken(token._id);
      if (res.success) {
        toast.success(`Service completed for ${token.tokenNumber}`, {
          icon: '✅',
        });
        await loadQueueTokens(selectedQueueId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete service');
    } finally {
      setIsCompleteLoading(false);
    }
  };

  const handleMoveUp = async (tokenId) => {
    try {
      const res = await tokenApi.moveToken(tokenId, { direction: 'up' });
      if (res.success) {
        toast.success(`Moved ${res.data.tokenNumber} up to position #${res.data.position}`);
        await loadQueueTokens(selectedQueueId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot move token up');
    }
  };

  const handleMoveDown = async (tokenId) => {
    try {
      const res = await tokenApi.moveToken(tokenId, { direction: 'down' });
      if (res.success) {
        toast.success(`Moved ${res.data.tokenNumber} down to position #${res.data.position}`);
        await loadQueueTokens(selectedQueueId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot move token down');
    }
  };

  const handleOpenCancel = (token) => {
    setTokenToCancel(token);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (tokenId, reason) => {
    try {
      const res = await tokenApi.cancelToken(tokenId, { reason });
      if (res.success) {
        toast.success(`Token ${res.data.tokenNumber} cancelled`);
        await loadQueueTokens(selectedQueueId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel token');
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData(selectedQueueId);
    if (selectedQueueId) {
      loadQueueTokens(selectedQueueId);
    }
  };

  const waitingCount = tokens.filter((t) => t.status === 'WAITING').length;
  const metrics = analytics?.metrics || {};

  return (
    <div>
      <Header
        title="Operations Dashboard"
        subtitle="Live queue monitoring, customer dispatch & metrics"
        onMenuClick={openSidebar}
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              variant="dark"
              size="sm"
              icon={RefreshCw}
              onClick={handleManualRefresh}
              isLoading={refreshing}
              title="Refresh live state"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="accent"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
              className="glow-accent-sm"
            >
              Add Person
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* 1. Four Summary Metric Cards */}
        {loading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total in Queue"
              value={metrics.totalWaiting ?? 0}
              subtext="Customers currently waiting"
              icon={Users}
              diffPct={metrics.comparison?.servedDiffPct}
              diffLabel="vs yesterday"
              highlight={true}
            />

            <MetricCard
              title="Average Waiting Time"
              value={metrics.avgWaitingTimeFormatted || '0 min'}
              subtext="Wait time to reach counter"
              icon={Clock}
              diffPct={metrics.comparison?.avgWaitDiffPct}
              isPositiveGood={false}
            />

            <MetricCard
              title="People Served Today"
              value={metrics.totalServed ?? 0}
              subtext="Completed tickets today"
              icon={CheckCircle}
              diffPct={metrics.comparison?.servedDiffPct}
              isPositiveGood={true}
            />

            <MetricCard
              title="Queue Efficiency"
              value={`${metrics.queueEfficiencyPercentage ?? 100}%`}
              subtext="Service completion rate"
              icon={Zap}
              diffPct={metrics.comparison?.efficiencyDiffPct}
              isPositiveGood={true}
            />
          </div>
        )}

        {/* 2. Queue Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D0F0F] border border-[#1D2222]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#131616] text-[#C8FF00] border border-[#272D2D]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#8E9393] uppercase tracking-wider">
                Active Queue Station
              </p>
              <div className="relative inline-block mt-0.5">
                <select
                  value={selectedQueueId || ''}
                  onChange={(e) => setSelectedQueueId(e.target.value)}
                  className="appearance-none bg-[#131616] text-[#F5F3EF] font-bold text-base pr-8 pl-3 py-1.5 rounded-xl border border-[#272D2D] hover:border-[#3B4242] focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] outline-none transition-colors cursor-pointer"
                >
                  {queues.map((q) => (
                    <option key={q._id} value={q._id} className="bg-[#131616] text-[#F5F3EF]">
                      {q.name} ({q.waitingCount || 0} waiting)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#8E9393] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedQueue && (
              <span className="text-xs text-[#8E9393]">
                Prefix: <strong className="font-mono text-[#F5F3EF]">{selectedQueue.prefix}</strong>
                {' • '}
                Status: <strong className="text-[#C8FF00]">{selectedQueue.status}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 3. Currently Serving Banner */}
        <CurrentServingBanner
          token={currentlyServing}
          waitingCount={waitingCount}
          onServeNext={handleServeNext}
          onComplete={handleCompleteService}
          onCancel={handleOpenCancel}
          isServingLoading={isServingLoading}
          isCompleteLoading={isCompleteLoading}
        />

        {/* 4. Queue Overview Table */}
        <QueueOverviewTable
          tokens={tokens}
          queueName={selectedQueue?.name}
          queueStatus={selectedQueue?.status}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onCancel={handleOpenCancel}
          onServeNext={handleServeNext}
          onAddPerson={() => setIsAddModalOpen(true)}
          isServingLoading={isServingLoading}
        />

        {/* 5. Queue Analytics Visual Section */}
        <QuickAnalytics
          charts={analytics?.charts || {}}
          metrics={metrics}
        />
      </div>

      {/* Modals */}
      <AddTokenModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddToken={handleAddToken}
        queueName={selectedQueue?.name}
      />

      <CancelTokenModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setTokenToCancel(null);
        }}
        token={tokenToCancel}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
};
