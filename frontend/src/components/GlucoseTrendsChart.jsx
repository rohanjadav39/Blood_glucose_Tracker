import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatDisplayDate } from '../utils/dateHelpers';

export function GlucoseTrendsChart({ readings = [], title = 'Glucose Trend' }) {
  if (!readings || readings.length === 0) return null;

  // Format data for chart
  const data = readings.map((r, index) => ({
    name: r.slot ? `${r.date?.slice(5)} (${r.slot.split(' ')[0]})` : r.date,
    date: r.date,
    slot: r.slot,
    value: r.value,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs">
          <div className="font-bold text-slate-800">{item.slot || 'Reading'}</div>
          <div className="text-slate-500 mt-0.5">{formatDisplayDate(item.date)}</div>
          <div className="mt-2 text-sm font-extrabold text-emerald-600">
            {item.value} <span className="text-xs font-normal text-slate-400">mg/dl</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
          <p className="text-xs text-slate-500">
            Green dashed lines represent healthy baseline range (70–140 mg/dl)
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              domain={[40, 'auto']}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Healthy target zone lines */}
            <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: '70 (Low)', fill: '#3b82f6', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="3 3" label={{ value: '140 (Target)', fill: '#10b981', fontSize: 10, position: 'right' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
