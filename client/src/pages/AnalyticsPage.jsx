import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/dashboard/MetricCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { analyticsApi } from '../api/analyticsApi';
import { queueApi } from '../api/queueApi';
import {
  Users,
  CheckCircle2,
  Clock,
  Timer,
  XCircle,
  Zap,
  Calendar,
  Layers,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050606] border border-[#272D2D] p-3 rounded-xl shadow-2xl text-xs">
        <p className="font-semibold text-[#8E9393] mb-1.5">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="font-mono font-bold text-[#F5F3EF]">
            <span style={{ color: item.color || item.fill }}>{item.name}: </span>
            {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsPage = () => {
  const { openSidebar } = useOutletContext() || {};

  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('ALL');
  const [dateRange, setDateRange] = useState('today'); // 'today', '7d', '30d', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch queues
  useEffect(() => {
    queueApi.getQueues().then((res) => {
      if (res.success) setQueues(res.data);
    });
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = { range: dateRange };
      if (dateRange === 'custom') {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      let res;
      if (selectedQueueId === 'ALL') {
        res = await analyticsApi.getOverview(params);
      } else {
        res = await analyticsApi.getQueueAnalytics(selectedQueueId, params);
      }

      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedQueueId, dateRange, customStart, customEnd]);

  const metrics = analytics?.metrics || {};
  const charts = analytics?.charts || {};

  const rangeButtons = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: 'custom', label: 'Custom Range' },
  ];

  return (
    <div>
      <Header
        title="Queue Analytics & Reports"
        subtitle="Computed live metrics, wait times, throughput, and trends"
        onMenuClick={openSidebar}
        rightAction={
          <Button
            variant="dark"
            size="sm"
            icon={RefreshCw}
            onClick={loadAnalytics}
            isLoading={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Controls Bar: Date Filter + Station Filter */}
        <div className="p-4 rounded-2xl bg-[#131616] border border-[#272D2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Station Selector */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#C8FF00] border border-[#222727]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9393] block">
                Queue Filter
              </span>
              <select
                value={selectedQueueId}
                onChange={(e) => setSelectedQueueId(e.target.value)}
                className="bg-[#0D0F0F] text-[#F5F3EF] text-sm font-semibold px-3 py-1.5 rounded-xl border border-[#272D2D] focus:border-[#C8FF00] outline-none mt-0.5"
              >
                <option value="ALL">All Queues Combined</option>
                {queues.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.name} ({q.prefix})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {rangeButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setDateRange(btn.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  dateRange === btn.key
                    ? 'bg-[#C8FF00] text-[#050606] shadow-accent-sm'
                    : 'bg-[#0D0F0F] text-[#8E9393] hover:text-[#F5F3EF] border border-[#222727]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="p-4 rounded-2xl bg-[#0D0F0F] border border-[#222727] flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#8E9393]">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#131616] border border-[#272D2D] text-[#F5F3EF] outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8E9393]">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#131616] border border-[#272D2D] text-[#F5F3EF] outline-none"
              />
            </div>
          </div>
        )}

        {/* KPI Metrics - Secondary Light Cards */}
        {loading ? (
          <CardSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="People Served"
              value={metrics.totalServed ?? 0}
              subtext="Completed tickets"
              icon={CheckCircle2}
              diffPct={metrics.comparison?.servedDiffPct}
              isPositiveGood={true}
            />

            <MetricCard
              title="Average Waiting"
              value={metrics.avgWaitingTimeFormatted || '0 min'}
              subtext="From arrival to counter"
              icon={Clock}
              diffPct={metrics.comparison?.avgWaitDiffPct}
              isPositiveGood={false}
            />

            <MetricCard
              title="Average Service"
              value={metrics.avgServiceDurationFormatted || '0 min'}
              subtext="Desk handling duration"
              icon={Timer}
              isPositiveGood={false}
            />

            <MetricCard
              title="Cancellations"
              value={metrics.totalCancelled ?? 0}
              subtext="No-show or cancelled"
              icon={XCircle}
              isPositiveGood={false}
            />

            <MetricCard
              title="Queue Efficiency"
              value={`${metrics.queueEfficiencyPercentage ?? 100}%`}
              subtext="Resolution rate"
              icon={Zap}
              diffPct={metrics.comparison?.efficiencyDiffPct}
              isPositiveGood={true}
            />
          </div>
        )}

        {/* Charts Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. People Served Over Time (Bar Chart) */}
          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#C8FF00] border border-[#272D2D]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F5F3EF]">Customer Throughput</h4>
                <p className="text-xs text-[#8E9393]">People served across time intervals</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {charts.hourlyServed?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.hourlyServed} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" stroke="#656B6B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#656B6B" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Bar dataKey="served" name="People Served" fill="#C8FF00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#8E9393]">
                  No served customer records in this time range.
                </div>
              )}
            </div>
          </div>

          {/* 2. Queue Length Volume Trend (Area Chart) */}
          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#00C8FF] border border-[#272D2D]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F5F3EF]">Queue Length Timeline</h4>
                <p className="text-xs text-[#8E9393]">Recorded queue length from system events</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {charts.queueLengthTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.queueLengthTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00C8FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#656B6B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#656B6B" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="waiting"
                      name="Queue Size"
                      stroke="#00C8FF"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#areaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#8E9393]">
                  No queue volume events recorded.
                </div>
              )}
            </div>
          </div>

          {/* 3. Average Waiting Time Trend (Line Chart) */}
          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#FFAA00] border border-[#272D2D]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F5F3EF]">Average Waiting Time Trend</h4>
                <p className="text-xs text-[#8E9393]">Wait duration in minutes before service</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {charts.waitingTimeTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.waitingTimeTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" stroke="#656B6B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#656B6B" fontSize={11} tickLine={false} unit="m" />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="avgWaitMinutes"
                      name="Avg Wait (Minutes)"
                      stroke="#FFAA00"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#FFAA00' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#8E9393]">
                  Insufficient waiting history for line graph.
                </div>
              )}
            </div>
          </div>

          {/* 4. Token Status Distribution (Donut Chart) */}
          <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#C8FF00] border border-[#272D2D]">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F5F3EF]">Token Status Breakdown</h4>
                <p className="text-xs text-[#8E9393]">Waiting vs in-service vs completed vs cancelled</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {charts.statusDistribution?.length > 0 &&
              charts.statusDistribution.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.statusDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {charts.statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || '#C8FF00'}
                          stroke="#131616"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(val) => <span className="text-xs text-[#8E9393]">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#8E9393]">
                  No token status records found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operational Performance Summary Table */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-3xl p-6 border border-[#DDD8CE] shadow-sm">
          <h4 className="text-base font-bold text-[#050606] mb-1">Queue Health Audit</h4>
          <p className="text-xs text-[#626868] mb-4">
            Audited database calculations based on actual token timestamps and events
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#DDD8CE]">
              <span className="font-bold text-[#050606] block mb-1">Service Formula</span>
              <p className="text-[#626868]">
                Wait Duration: <code className="font-mono text-[#050606]">calledAt - createdAt</code>
              </p>
              <p className="text-[#626868] mt-1">
                Service Duration: <code className="font-mono text-[#050606]">completedAt - calledAt</code>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DDD8CE]">
              <span className="font-bold text-[#050606] block mb-1">Timezone & Timestamps</span>
              <p className="text-[#626868]">
                Database records stored in UTC. Calculations rendered in your local client timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DDD8CE]">
              <span className="font-bold text-[#050606] block mb-1">Cancellation Policy</span>
              <p className="text-[#626868]">
                Cancelled tokens are strictly excluded from served statistics and do not distort average wait calculations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
