import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Hash } from 'lucide-react';
import { getGlucoseCategory } from '../utils/glucoseHelpers';
import { Card } from './ui/Card';

export function ReportStatsCards({ stats, title = 'Summary Metrics' }) {
  const { highest, lowest, average, count, hasData } = stats || {};

  if (!hasData || count === 0) {
    return null;
  }

  const avgCategory = getGlucoseCategory(average);
  const highCategory = getGlucoseCategory(highest);
  const lowCategory = getGlucoseCategory(lowest);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Average Reading Card */}
      <Card className="p-4 sm:p-5 border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Average Reading
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {average}
          </span>
          <span className="text-xs font-semibold text-slate-400">mg/dl</span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${avgCategory.badgeClass}`}>
            {avgCategory.label} Average
          </span>
        </div>
      </Card>

      {/* Highest Reading Card */}
      <Card className="p-4 sm:p-5 border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Highest Reading
          </span>
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {highest}
          </span>
          <span className="text-xs font-semibold text-slate-400">mg/dl</span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${highCategory.badgeClass}`}>
            Peak Value
          </span>
        </div>
      </Card>

      {/* Lowest Reading Card */}
      <Card className="p-4 sm:p-5 border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Lowest Reading
          </span>
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <ArrowDownRight className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lowest}
          </span>
          <span className="text-xs font-semibold text-slate-400">mg/dl</span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${lowCategory.badgeClass}`}>
            Trough Value
          </span>
        </div>
      </Card>

      {/* Total Readings Count Card */}
      <Card className="p-4 sm:p-5 border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Total Readings
          </span>
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
            <Hash className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {count}
          </span>
          <span className="text-xs font-semibold text-slate-400">recorded</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            Active Data Points
          </span>
        </div>
      </Card>
    </div>
  );
}
