import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LiveTimerDisplay } from '../hooks/useLiveTimer';
import { CurrentServingBanner } from '../components/dashboard/CurrentServingBanner';
import { AddTokenModal } from '../components/tokens/AddTokenModal';
import { CancelTokenModal } from '../components/tokens/CancelTokenModal';
import { EditQueueModal } from '../components/queues/EditQueueModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { queueApi } from '../api/queueApi';
import { tokenApi } from '../api/tokenApi';
import { useSocket } from '../context/SocketContext';
import { formatDateTime, formatSeconds } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Play,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Edit2,
  Trash2,
  Power,
  Users,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const QueueDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext() || {};
  const { socket, joinQueue, leaveQueue } = useSocket();

  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [counts, setCounts] = useState({ total: 0, waiting: 0, inService: 0, completed: 0, cancelled: 0 });
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [tokenToCancel, setTokenToCancel] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isServingLoading, setIsServingLoading] = useState(false);
  const [isCompleteLoading, setIsCompleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [queueRes, tokensRes] = await Promise.all([
        queueApi.getQueueById(id),
        tokenApi.getTokens(id, { status: statusFilter, search }),
      ]);

      if (queueRes.success) {
        setQueue(queueRes.data);
        setCurrentlyServing(queueRes.data.currentlyServing || null);
      }

      if (tokensRes.success) {
        setTokens(tokensRes.data.tokens || []);
        if (tokensRes.data.counts) {
          setCounts(tokensRes.data.counts);
        }
      }
    } catch (err) {
      toast.error('Failed to load queue details');
      navigate('/queues');
    } finally {
      setLoading(false);
    }
  }, [id, statusFilter, search, navigate]);

  useEffect(() => {
    loadData();
    joinQueue(id);

    return () => {
      leaveQueue(id);
    };
  }, [id, loadData, joinQueue, leaveQueue]);

  // Socket.IO real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (payload) => {
      if (payload.queueId === id) {
        loadData();
      }
    };

    socket.on('queue:token_added', handleUpdate);
    socket.on('queue:token_moved', handleUpdate);
    socket.on('queue:token_served', handleUpdate);
    socket.on('queue:token_completed', handleUpdate);
    socket.on('queue:token_cancelled', handleUpdate);
    socket.on('queue:updated', handleUpdate);

    return () => {
      socket.off('queue:token_added', handleUpdate);
      socket.off('queue:token_moved', handleUpdate);
      socket.off('queue:token_served', handleUpdate);
      socket.off('queue:token_completed', handleUpdate);
      socket.off('queue:token_cancelled', handleUpdate);
      socket.off('queue:updated', handleUpdate);
    };
  }, [socket, id, loadData]);

  // Token Operations
  const handleAddToken = async (data) => {
    const res = await tokenApi.addToken(id, data);
    if (res.success) {
      toast.success(`Token ${res.data.tokenNumber} issued successfully`);
      loadData();
    }
  };

  const handleServeNext = async () => {
    setIsServingLoading(true);
    try {
      const res = await tokenApi.serveNext(id);
      if (res.success) {
        toast.success(`Serving next: ${res.data.tokenNumber} (${res.data.customerName})`, { icon: '🛎️' });
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to serve next');
    } finally {
      setIsServingLoading(false);
    }
  };

  const handleCompleteToken = async (token) => {
    setIsCompleteLoading(true);
    try {
      const res = await tokenApi.completeToken(token._id);
      if (res.success) {
        toast.success(`Service completed for ${token.tokenNumber}`, { icon: '✅' });
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete service');
    } finally {
      setIsCompleteLoading(false);
    }
  };

  const handleMoveToken = async (tokenId, direction) => {
    try {
      const res = await tokenApi.moveToken(tokenId, { direction });
      if (res.success) {
        toast.success(`Token ${res.data.tokenNumber} moved to position #${res.data.position}`);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move token');
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
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel token');
    }
  };

  const handleToggleStatus = async () => {
    if (!queue) return;
    const newStatus = queue.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await queueApi.updateQueue(queue._id, { status: newStatus });
    if (res.success) {
      toast.success(`Queue status set to ${newStatus}`);
      loadData();
    }
  };

  const handleUpdateQueue = async (queueId, data) => {
    const res = await queueApi.updateQueue(queueId, data);
    if (res.success) {
      toast.success('Queue updated successfully');
      loadData();
    }
  };

  const handleDeleteQueue = async () => {
    const res = await queueApi.deleteQueue(id);
    if (res.success) {
      toast.success('Queue deleted successfully');
      navigate('/queues');
    }
  };

  const waitingTokensList = tokens.filter((t) => t.status === 'WAITING');

  const filterTabs = [
    { key: 'ALL', label: 'All Tokens', count: counts.total },
    { key: 'WAITING', label: 'Waiting', count: counts.waiting },
    { key: 'IN_SERVICE', label: 'In Service', count: counts.inService },
    { key: 'COMPLETED', label: 'Completed', count: counts.completed },
    { key: 'CANCELLED', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <div>
      <Header
        title={queue?.name || 'Queue Operations'}
        subtitle={queue?.description || 'Manage real-time customer tokens'}
        onMenuClick={openSidebar}
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              variant="dark"
              size="sm"
              icon={Edit2}
              onClick={() => setIsEditOpen(true)}
            >
              <span className="hidden sm:inline">Edit Settings</span>
            </Button>

            <Button
              variant="accent"
              size="sm"
              icon={UserPlus}
              onClick={() => setIsAddOpen(true)}
              className="glow-accent-sm"
            >
              Add Person
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/queues"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E9393] hover:text-[#C8FF00] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Queues</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                queue?.status === 'ACTIVE'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{queue?.status === 'ACTIVE' ? 'Active (Click to Pause)' : 'Paused (Click to Activate)'}</span>
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Delete this queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Currently Serving Station Banner */}
        <CurrentServingBanner
          token={currentlyServing}
          waitingCount={counts.waiting}
          onServeNext={handleServeNext}
          onComplete={handleCompleteToken}
          onCancel={handleOpenCancel}
          isServingLoading={isServingLoading}
          isCompleteLoading={isCompleteLoading}
        />

        {/* Tokens Management Surface - 20% Secondary light surface #F5F3EF */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-3xl border border-[#DDD8CE] shadow-sm overflow-hidden">
          {/* Header Controls: Search & Tabs */}
          <div className="p-5 border-b border-[#E2DDD5] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      statusFilter === tab.key
                        ? 'bg-[#050606] text-[#C8FF00] shadow-sm'
                        : 'bg-white/80 text-[#626868] hover:bg-white hover:text-[#050606] border border-[#DDD8CE]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        statusFilter === tab.key
                          ? 'bg-[#C8FF00] text-[#050606]'
                          : 'bg-[#ECE9E2] text-[#4A5050]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#8E9393] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search token, name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD8CE] text-xs text-[#050606] placeholder-[#8E9393] focus:border-[#050606] focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tokens Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#ECE9E2] text-[#4A5050] text-[11px] font-bold uppercase tracking-wider border-b border-[#DDD8CE]">
                <tr>
                  <th className="py-3 px-5 w-12">#</th>
                  <th className="py-3 px-5">Token</th>
                  <th className="py-3 px-5">Customer Name</th>
                  <th className="py-3 px-5">Phone</th>
                  <th className="py-3 px-5">Timeline</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {tokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A8080]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-[#A5ABA8]" />
                        <p className="font-semibold text-sm text-[#050606]">No tokens found</p>
                        <p className="text-xs">
                          {search
                            ? `No results match "${search}"`
                            : 'No customer tokens registered in this filter category.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tokens.map((token, index) => {
                    const isWaiting = token.status === 'WAITING';
                    const isInService = token.status === 'IN_SERVICE';
                    const isCompleted = token.status === 'COMPLETED';
                    const isCancelled = token.status === 'CANCELLED';

                    const waitingIdx = waitingTokensList.findIndex((t) => t._id === token._id);
                    const isFirstWaiting = waitingIdx === 0;
                    const isLastWaiting = waitingIdx === waitingTokensList.length - 1;

                    return (
                      <tr
                        key={token._id}
                        className="hover:bg-[#ECE9E2]/60 transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#626868]">
                          {isWaiting ? `#${token.position || index + 1}` : '—'}
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="font-mono font-bold text-[#050606] px-2.5 py-1 rounded-lg bg-[#ECE9E2] border border-[#DDD8CE]">
                            {token.tokenNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 font-semibold text-[#050606]">
                          {token.customerName}
                        </td>

                        <td className="py-3.5 px-5 text-xs text-[#626868] font-mono">
                          {token.phoneNumber || '—'}
                        </td>

                        <td className="py-3.5 px-5 text-xs font-mono text-[#050606]">
                          {isWaiting && (
                            <div className="flex items-center gap-1.5 text-[#3A4040]">
                              <Clock className="w-3.5 h-3.5 text-[#626868]" />
                              <span>Wait: </span>
                              <LiveTimerDisplay startTime={token.createdAt} />
                            </div>
                          )}

                          {isInService && (
                            <div className="flex items-center gap-1.5 text-sky-700 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <span>In desk: </span>
                              <LiveTimerDisplay startTime={token.calledAt} />
                            </div>
                          )}

                          {isCompleted && (
                            <div className="space-y-0.5 text-[11px] text-[#4A5050]">
                              <div>Completed: {formatDateTime(token.completedAt)}</div>
                              <div className="text-[10px] text-[#7A8080]">
                                Wait: {formatSeconds(token.waitingTimeSeconds)} • Service:{' '}
                                {formatSeconds(token.serviceDurationSeconds)}
                              </div>
                            </div>
                          )}

                          {isCancelled && (
                            <div className="space-y-0.5 text-[11px] text-rose-700">
                              <div>Cancelled: {formatDateTime(token.cancelledAt)}</div>
                              {token.cancellationReason && (
                                <div className="text-[10px] text-[#7A8080] truncate max-w-xs">
                                  Reason: {token.cancellationReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          <Badge status={token.status} />
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Actions for WAITING tokens */}
                            {isWaiting && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMoveToken(token._id, 'up')}
                                  disabled={isFirstWaiting}
                                  title="Move up"
                                  className="p-1.5 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] hover:text-[#050606] hover:bg-[#ECE9E2] disabled:opacity-30 transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMoveToken(token._id, 'down')}
                                  disabled={isLastWaiting}
                                  title="Move down"
                                  className="p-1.5 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] hover:text-[#050606] hover:bg-[#ECE9E2] disabled:opacity-30 transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCancel(token)}
                                  title="Cancel token"
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors ml-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Actions for IN_SERVICE tokens */}
                            {isInService && (
                              <>
                                <Button
                                  variant="accent"
                                  size="xs"
                                  icon={CheckCircle2}
                                  onClick={() => handleCompleteToken(token)}
                                  isLoading={isCompleteLoading}
                                >
                                  Complete
                                </Button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCancel(token)}
                                  title="Cancel token"
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors ml-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* For Completed / Cancelled */}
                            {(isCompleted || isCancelled) && (
                              <span className="text-xs text-[#8E9393]">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTokenModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddToken={handleAddToken}
        queueName={queue?.name}
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

      <EditQueueModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        queue={queue}
        onUpdateQueue={handleUpdateQueue}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteQueue}
        title="Delete Queue"
        message={`Are you sure you want to permanently delete "${queue?.name}"? All associated tokens and analytics will be permanently destroyed.`}
        confirmText="Delete Queue"
      />
    </div>
  );
};
