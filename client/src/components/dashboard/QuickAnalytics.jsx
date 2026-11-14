import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050606] border border-[#272D2D] p-2.5 rounded-xl shadow-xl text-xs">
        <p className="font-semibold text-[#8E9393] mb-1">{label}</p>
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

export const QuickAnalytics = ({ charts = {}, metrics = {} }) => {
  const queueLengthData = charts.queueLengthTrend || [];
  const statusData = charts.statusDistribution || [];
  const hourlyData = charts.hourlyServed || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Queue Length Trend */}
      <div className="lg:col-span-2 bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#C8FF00] border border-[#272D2D]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F5F3EF]">Queue Length Trend</h4>
              <p className="text-xs text-[#8E9393]">Real-time customer volume throughout the day</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8E9393]">Avg Wait: </span>
            <span className="text-xs font-mono font-bold text-[#C8FF00]">
              {metrics.avgWaitingTimeFormatted || '0 min'}
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          {queueLengthData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={queueLengthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="queueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C8FF00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#656B6B" fontSize={11} tickLine={false} />
                <YAxis stroke="#656B6B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="waiting"
                  name="People Waiting"
                  stroke="#C8FF00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#queueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#8E9393]">
              No queue event data recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* 2. Status Distribution */}
      <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-[#0D0F0F] text-[#00C8FF] border border-[#272D2D]">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F5F3EF]">Token Distribution</h4>
              <p className="text-xs text-[#8E9393]">Waiting vs in-service vs completed</p>
            </div>
          </div>

          <div className="h-44 w-full">
            {statusData.length > 0 && statusData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#C8FF00'} stroke="#131616" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#8E9393]">
                No token records available.
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#222727] text-xs">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-[#0D0F0F]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#8E9393] text-[11px]">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-[#F5F3EF]">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
