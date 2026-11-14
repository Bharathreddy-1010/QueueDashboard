import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CreateQueueModal } from '../components/queues/CreateQueueModal';
import { EditQueueModal } from '../components/queues/EditQueueModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { queueApi } from '../api/queueApi';
import {
  Layers,
  Plus,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const QueuesPage = () => {
  const { openSidebar } = useOutletContext() || {};
  const navigate = useNavigate();

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadQueues = async () => {
    try {
      const res = await queueApi.getQueues();
      if (res.success) {
        setQueues(res.data);
      }
    } catch (err) {
      toast.error('Failed to load queues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
  }, []);

  const handleCreateQueue = async (data) => {
    const res = await queueApi.createQueue(data);
    if (res.success) {
      toast.success(`Queue "${res.data.name}" created successfully`);
      loadQueues();
    }
  };

  const handleUpdateQueue = async (id, data) => {
    const res = await queueApi.updateQueue(id, data);
    if (res.success) {
      toast.success('Queue updated successfully');
      loadQueues();
    }
  };

  const handleToggleStatus = async (e, queue) => {
    e.stopPropagation();
    const newStatus = queue.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await queueApi.updateQueue(queue._id, { status: newStatus });
      if (res.success) {
        toast.success(`Queue set to ${newStatus}`);
        loadQueues();
      }
    } catch (err) {
      toast.error('Failed to update queue status');
    }
  };

  const handleOpenDelete = (e, queue) => {
    e.stopPropagation();
    setSelectedQueue(queue);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQueue) return;
    setIsDeleting(true);
    try {
      const res = await queueApi.deleteQueue(selectedQueue._id);
      if (res.success) {
        toast.success(`Queue "${selectedQueue.name}" deleted`);
        setIsDeleteOpen(false);
        setSelectedQueue(null);
        loadQueues();
      }
    } catch (err) {
      toast.error('Failed to delete queue');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredQueues = queues.filter((q) =>
    q.name.toLowerCase().includes(search.toLowerCase()) ||
    q.prefix.toLowerCase().includes(search.toLowerCase())
  );

  const totalWaiting = queues.reduce((sum, q) => sum + (q.waitingCount || 0), 0);
  const activeCount = queues.filter((q) => q.status === 'ACTIVE').length;

  return (
    <div>
      <Header
        title="Queue Management"
        subtitle="Manage service stations, prefixes, and operations"
        onMenuClick={openSidebar}
        rightAction={
          <Button
            variant="accent"
            size="sm"
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
            className="glow-accent-sm"
          >
            Create Queue
          </Button>
        }
      />

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Summary Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-[#8E9393] tracking-wider">Total Stations</p>
              <h3 className="text-2xl font-extrabold text-[#F5F3EF] font-mono mt-1">{queues.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0D0F0F] text-[#C8FF00] flex items-center justify-center border border-[#272D2D]">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-[#8E9393] tracking-wider">Active Queues</p>
              <h3 className="text-2xl font-extrabold text-[#C8FF00] font-mono mt-1">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0D0F0F] text-[#C8FF00] flex items-center justify-center border border-[#272D2D]">
              <Power className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-[#8E9393] tracking-wider">Total Waiting</p>
              <h3 className="text-2xl font-extrabold text-[#FFAA00] font-mono mt-1">{totalWaiting}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0D0F0F] text-[#FFAA00] flex items-center justify-center border border-[#272D2D]">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8E9393] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter queues by name or prefix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#131616] border border-[#272D2D] text-sm text-[#F5F3EF] placeholder-[#656B6B] focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] outline-none transition-colors"
            />
          </div>

          <p className="text-xs text-[#8E9393] self-end sm:self-auto">
            Showing {filteredQueues.length} of {queues.length} queues
          </p>
        </div>

        {/* Queues Grid */}
        {loading ? (
          <CardSkeleton count={3} />
        ) : filteredQueues.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#131616] border border-[#272D2D] text-[#8E9393]">
            <Layers className="w-10 h-10 text-[#656B6B] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F3EF]">No queues found</h4>
            <p className="text-xs mt-1">Create your first queue station to start issuing customer tokens.</p>
            <Button
              variant="accent"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
              className="mt-4"
            >
              Create New Queue
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueues.map((queue) => {
              const isActive = queue.status === 'ACTIVE';

              return (
                <div
                  key={queue._id}
                  onClick={() => navigate(`/queues/${queue._id}`)}
                  className="rounded-2xl p-6 transition-all duration-200 cursor-pointer bg-[#F5F3EF] text-[#050606] border border-[#DDD8CE] shadow-card hover:shadow-lg hover:-translate-y-0.5 group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Prefix, Status, Actions */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-[#050606] text-[#C8FF00]">
                          {queue.prefix}
                        </span>
                        <Badge status={queue.status} />
                      </div>

                      {/* Dropdown / Quick Action buttons */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleStatus(e, queue)}
                          title={isActive ? 'Deactivate queue' : 'Activate queue'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isActive
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-neutral-300 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedQueue(queue);
                            setIsEditOpen(true);
                          }}
                          title="Edit queue"
                          className="p-1.5 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] hover:text-[#050606] hover:bg-[#ECE9E2] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleOpenDelete(e, queue)}
                          title="Delete queue"
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Queue Name & Description */}
                    <h3 className="text-lg font-bold text-[#050606] group-hover:text-black transition-colors">
                      {queue.name}
                    </h3>
                    <p className="text-xs text-[#626868] mt-1.5 line-clamp-2 min-h-[32px]">
                      {queue.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Metrics & Currently Serving */}
                  <div className="mt-6 pt-4 border-t border-[#E2DDD5] space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="block text-[10px] font-bold uppercase text-amber-800">Waiting</span>
                        <span className="font-mono text-base font-extrabold text-amber-900">
                          {queue.waitingCount || 0}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                        <span className="block text-[10px] font-bold uppercase text-sky-800">In Service</span>
                        <span className="font-mono text-base font-extrabold text-sky-900">
                          {queue.inServiceCount || 0}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="block text-[10px] font-bold uppercase text-emerald-800">Served</span>
                        <span className="font-mono text-base font-extrabold text-emerald-900">
                          {queue.completedCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Open Queue link */}
                    <div className="flex items-center justify-between text-xs font-bold text-[#050606] pt-1">
                      <span>Open Operations & Tokens</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateQueueModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateQueue={handleCreateQueue}
      />

      <EditQueueModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedQueue(null);
        }}
        queue={selectedQueue}
        onUpdateQueue={handleUpdateQueue}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedQueue(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Queue"
        message={`Are you sure you want to permanently delete "${selectedQueue?.name}"? All associated tokens, service logs, and analytics will be permanently removed.`}
        confirmText="Delete Queue"
        isLoading={isDeleting}
      />
    </div>
  );
};
