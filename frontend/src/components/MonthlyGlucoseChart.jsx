import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from 'recharts';
import { Activity, TrendingUp, Calendar, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateHelpers';
import { getGlucoseCategory } from '../utils/glucoseHelpers';

export function MonthlyGlucoseChart({
  readings = [],
  title = 'Monthly Blood Glucose Journey',
  subtitle = 'Clinical line chart showing glucose variations across the month',
  periodLabel = 'Current Month',
}) {
  const [viewMode, setViewMode] = useState('all'); // 'all' (all slot readings) or 'dailyAvg' (daily mean)
  const [slotFilter, setSlotFilter] = useState('all'); // 'all' or specific slot

  // Filtered readings
  const filteredReadings = useMemo(() => {
    if (slotFilter === 'all') return readings;
    return readings.filter((r) => r.slot === slotFilter);
  }, [readings, slotFilter]);

  // Transform data for line chart
  const chartData = useMemo(() => {
    if (!filteredReadings || filteredReadings.length === 0) return [];

    if (viewMode === 'dailyAvg') {
      // Group by date and calculate average
      const dayMap = {};
      filteredReadings.forEach((r) => {
        if (!dayMap[r.date]) {
          dayMap[r.date] = { date: r.date, sum: 0, count: 0, slots: [] };
        }
        dayMap[r.date].sum += Number(r.value);
        dayMap[r.date].count += 1;
        dayMap[r.date].slots.push({ slot: r.slot, value: r.value });
      });

      return Object.values(dayMap)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => {
          const avg = Math.round((d.sum / d.count) * 10) / 10;
          return {
            dateKey: d.date,
            dateLabel: d.date.slice(5), // MM-DD
            fullDate: d.date,
            value: avg,
            count: d.count,
            category: getGlucoseCategory(avg),
            isAverage: true,
          };
        });
    }

    // All readings chronologically
    return [...filteredReadings]
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        const slotOrder = {
          'Morning (fasting)': 1,
          'After breakfast': 2,
          'After lunch': 3,
          'After dinner': 4,
        };
        return (slotOrder[a.slot] || 5) - (slotOrder[b.slot] || 5);
      })
      .map((r, idx) => {
        const shortSlot = r.slot ? r.slot.replace('After ', 'Post-').split(' ')[0] : '';
        return {
          id: r.id || idx,
          dateKey: `${r.date} ${shortSlot}`,
          dateLabel: `${r.date.slice(5)} ${shortSlot}`,
          fullDate: r.date,
          slot: r.slot,
          value: Number(r.value),
          category: getGlucoseCategory(r.value),
          isAverage: false,
        };
      });
  }, [filteredReadings, viewMode]);

  // Aggregate stats for header
  const stats = useMemo(() => {
    if (!filteredReadings || filteredReadings.length === 0) {
      return { avg: 0, highest: 0, lowest: 0, count: 0, inTargetPercent: 0 };
    }
    const values = filteredReadings.map((r) => Number(r.value));
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const inTargetCount = values.filter((v) => v >= 70 && v <= 140).length;
    const inTargetPercent = Math.round((inTargetCount / values.length) * 100);

    return { avg, highest, lowest, count: values.length, inTargetPercent };
  }, [filteredReadings]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-xs dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 min-w-[190px]">
          <div className="flex items-center justify-between text-slate-400 font-semibold mb-1">
            <span>{formatDisplayDate(item.fullDate)}</span>
            {item.isAverage && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold dark:bg-slate-800 dark:text-slate-300">
                Daily Mean
              </span>
            )}
          </div>

          {!item.isAverage && item.slot && (
            <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
              {item.slot}
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {item.value}
            </span>
            <span className="text-xs text-slate-400 font-medium">mg/dl</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                item.value < 70
                  ? 'bg-sky-500'
                  : item.value <= 140
                  ? 'bg-emerald-500'
                  : item.value < 200
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {item.category?.label || 'Normal'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!readings || readings.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          No Monthly Readings Available
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Record blood glucose readings to generate the monthly trend line chart.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition-all">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
              {title}
            </h3>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-0.5 text-[11px] font-bold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              {periodLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        {/* View Mode & Slot Filter Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              All Readings ({readings.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dailyAvg')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'dailyAvg'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Daily Average Curve
            </button>
          </div>

          {/* Slot Filter */}
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">All Meal Slots</option>
            <option value="Morning (fasting)">Fasting Only</option>
            <option value="After breakfast">Breakfast Only</option>
            <option value="After lunch">Lunch Only</option>
            <option value="After dinner">Dinner Only</option>
          </select>
        </div>
      </div>

      {/* Monthly Analytics Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Monthly Average
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats.avg}{' '}
            <span className="text-xs font-normal text-slate-400">mg/dl</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Target: &lt;140 mg/dl
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Time in Target
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.inTargetPercent}%
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            70–140 mg/dl range
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Monthly Peak
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.highest}{' '}
            <span className="text-xs font-normal text-slate-400">mg/dl</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Highest logged value
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Monthly Lowest
          </div>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {stats.lowest}{' '}
            <span className="text-xs font-normal text-slate-400">mg/dl</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Lowest logged value
          </div>
        </div>
      </div>

      {/* Target Range Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <strong className="text-slate-700 dark:text-slate-300">Target Range:</strong> 70 – 140 mg/dl
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Elevated: 141 – 199</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>High Alert: ≥ 200</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {chartData.length} data points
        </div>
      </div>

      {/* Recharts Responsive Monthly Line Chart */}
      <div className="h-72 sm:h-80 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#94a3b822"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#94a3b844' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[50, 'auto']}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#94a3b844' }}
              unit=" mg/dl"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Target Shaded Area (70 to 140 mg/dl) */}
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#10b981"
              fillOpacity={0.06}
            />

            {/* Reference Boundary Lines */}
            <ReferenceLine
              y={70}
              stroke="#38bdf8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '70 (Low Threshold)',
                fill: '#0284c7',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={140}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '140 (Target Upper)',
                fill: '#059669',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={200}
              stroke="#f43f5e"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: '200 (High Alert)',
                fill: '#e11d48',
                fontSize: 10,
                position: 'right',
              }}
            />

            {/* Main Glucose Trend Curve */}
            <Line
              type="monotone"
              dataKey="value"
              name="Blood Glucose"
              stroke="#059669"
              strokeWidth={2.75}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return null;
                const val = payload.value;
                const fill =
                  val < 70
                    ? '#0284c7'
                    : val <= 140
                    ? '#059669'
                    : val < 200
                    ? '#d97706'
                    : '#e11d48';

                return (
                  <circle
                    key={`${payload.dateKey}-${cx}`}
                    cx={cx}
                    cy={cy}
                    r={viewMode === 'dailyAvg' ? 5 : 4}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 7,
                fill: '#047857',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
