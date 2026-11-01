import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  CalendarDays,
  Clock,
  Sparkles,
  BarChart2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import {
  formatDisplayDate,
  adjustDate,
  isToday,
  getTodayString,
} from '../utils/dateHelpers';
import { SLOTS, getGlucoseCategory } from '../utils/glucoseHelpers';
import { ReadingCard } from './ReadingCard';
import { Button } from './ui/Button';
import { EmptyState } from './EmptyState';

export function ReadingsList({
  selectedDate,
  onDateChange,
  readings = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  onPageChange,
  viewMode = 'paginated', // 'paginated' (5 days x 4 readings = 20) | 'singleDay'
  onToggleViewMode,
  onAddNew,
  onEdit,
  onDelete,
}) {
  const todayStr = getTodayString();
  const isSelectedToday = isToday(selectedDate);

  // Group readings by date in descending order
  const groupedByDay = useMemo(() => {
    const map = {};
    readings.forEach((r) => {
      const dateKey = r.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(r);
    });

    // Sort each day's readings by slot order
    const slotOrder = {
      'Morning (fasting)': 1,
      'After breakfast': 2,
      'After lunch': 3,
      'After dinner': 4,
    };

    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => (slotOrder[a.slot] || 5) - (slotOrder[b.slot] || 5));
    });

    // Return array of days sorted by date descending
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => ({
        date: dateKey,
        readings: map[dateKey],
      }));
  }, [readings]);

  // Weekly / Period Analytics calculation for the loaded 20-reading batch
  const weeklyAnalytics = useMemo(() => {
    if (!readings || readings.length === 0) {
      return {
        avg: 0,
        highest: 0,
        lowest: 0,
        count: 0,
        daysCount: 0,
        inTargetPercent: 0,
        statusText: 'No data',
      };
    }

    const values = readings.map((r) => Number(r.value));
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const inTargetCount = values.filter((v) => v >= 70 && v <= 140).length;
    const inTargetPercent = Math.round((inTargetCount / values.length) * 100);
    const daysCount = groupedByDay.length;

    let statusText = 'Optimal Control';
    let statusClass = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';

    if (avg >= 140 && avg < 180) {
      statusText = 'Mildly Elevated';
      statusClass = 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    } else if (avg >= 180) {
      statusText = 'Action Recommended';
      statusClass = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    } else if (avg < 70) {
      statusText = 'Hypoglycemia Alert';
      statusClass = 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
    }

    return {
      avg,
      highest,
      lowest,
      count: values.length,
      daysCount,
      inTargetPercent,
      statusText,
      statusClass,
    };
  }, [readings, groupedByDay]);

  const handlePrevDay = () => onDateChange(adjustDate(selectedDate, -1));
  const handleNextDay = () => {
    if (!isSelectedToday) onDateChange(adjustDate(selectedDate, 1));
  };
  const handleGoToday = () => onDateChange(todayStr);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar: View Mode Switcher + Quick Log */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onToggleViewMode && onToggleViewMode('paginated')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'paginated'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>5-Day Log (20 / Page)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleViewMode && onToggleViewMode('singleDay')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'singleDay'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Single Day Focus</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => onAddNew(selectedDate)}
            size="sm"
            className="gap-1.5 shadow-sm font-semibold"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Log Glucose Reading</span>
          </Button>
        </div>
      </div>

      {/* ================= VIEW MODE 1: PAGINATED 5-DAY VIEW (20 READINGS / PAGE) ================= */}
      {viewMode === 'paginated' && (
        <div className="space-y-6">
          {/* Weekly / Period Analytics Summary Card */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white p-5 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Weekly Glycemic Overview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clinical metrics computed for current 5-day cycle ({weeklyAnalytics.count} readings)
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${weeklyAnalytics.statusClass}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {weeklyAnalytics.statusText}
              </span>
            </div>

            {/* 4 Key Period Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="rounded-xl bg-white/80 p-3 border border-emerald-100/70 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Weekly Average
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {weeklyAnalytics.avg}{' '}
                  <span className="text-xs font-normal text-slate-400">mg/dl</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  1-Decimal Precision
                </div>
              </div>

              <div className="rounded-xl bg-white/80 p-3 border border-emerald-100/70 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Time in Range
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {weeklyAnalytics.inTargetPercent}%
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  ADA Target: 70–140 mg/dl
                </div>
              </div>

              <div className="rounded-xl bg-white/80 p-3 border border-emerald-100/70 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Weekly Peak & Low
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {weeklyAnalytics.highest}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {weeklyAnalytics.lowest}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Spread: {weeklyAnalytics.highest - weeklyAnalytics.lowest} mg/dl
                </div>
              </div>

              <div className="rounded-xl bg-white/80 p-3 border border-emerald-100/70 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Period Volume
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {weeklyAnalytics.count}{' '}
                  <span className="text-xs font-normal text-slate-400">readings</span>
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                  Across {weeklyAnalytics.daysCount} active days
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Readings by Readable Day */}
          {groupedByDay.length === 0 ? (
            <EmptyState
              title="No blood glucose readings found"
              description="Start recording your 4 daily readings (fasting, breakfast, lunch, dinner) to track your glucose levels."
              actionLabel="Add Glucose Reading"
              onAction={() => onAddNew(todayStr)}
            />
          ) : (
            <div className="space-y-6">
              {groupedByDay.map(({ date, readings: dayReadings }) => {
                const dayValues = dayReadings.map((r) => Number(r.value));
                const daySum = dayValues.reduce((acc, v) => acc + v, 0);
                const dayAvg = Math.round((daySum / dayValues.length) * 10) / 10;
                const isDayToday = isToday(date);
                const loggedSlots = dayReadings.map((r) => r.slot);
                const missingSlots = SLOTS.filter((s) => !loggedSlots.includes(s));

                return (
                  <div
                    key={date}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Standard Readable Day Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                              {formatDisplayDate(date)}
                            </h4>
                            {isDayToday && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {date} • Standard Clinical Day Log
                          </div>
                        </div>
                      </div>

                      {/* Day Stats Badge Row */}
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Day Avg: {dayAvg} mg/dl
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Spread: {Math.max(...dayValues)} – {Math.min(...dayValues)} mg/dl
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            dayReadings.length === 4
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                          }`}
                        >
                          {dayReadings.length === 4 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : null}
                          {dayReadings.length} / 4 Slots Recorded
                        </span>
                      </div>
                    </div>

                    {/* Readings Grid Under This Day (4 Slots) */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
                      {dayReadings.map((reading) => (
                        <ReadingCard
                          key={reading.id}
                          reading={reading}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>

                    {/* Inline Quick Action if slots are missing for this day */}
                    {dayReadings.length < 4 && missingSlots.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          Unlogged for this day:
                        </span>
                        {missingSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => onAddNew(date, slot)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-500 transition-all"
                          >
                            <PlusCircle className="h-3 w-3 text-slate-400" />
                            + Log {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Standard Pagination Navigation Bar */}
          {pagination.total > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing{' '}
                <strong className="text-slate-800 dark:text-slate-100 font-bold">
                  {(pagination.page - 1) * pagination.limit + 1} –{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{' '}
                of <strong className="text-slate-800 dark:text-slate-100">{pagination.total}</strong> readings
                <span className="text-slate-400 ml-1.5 hidden md:inline">
                  (5 days with 4 readings / page)
                </span>
              </div>

              {/* Prev / Next & Page Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onPageChange(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        p === pagination.page
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="gap-1 text-xs font-semibold"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW MODE 2: SINGLE DAY FOCUS ================= */}
      {viewMode === 'singleDay' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Date Selector with Steppers */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2.5 px-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <input
                    type="date"
                    max={todayStr}
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">
                    ({formatDisplayDate(selectedDate)})
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDay}
                  disabled={isSelectedToday}
                  title={isSelectedToday ? 'Cannot navigate to future dates' : 'Next Day'}
                  className="h-9 w-9 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {!isSelectedToday && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoToday}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 ml-1"
                  >
                    Jump to Today
                  </Button>
                )}
              </div>

              {/* Slots Progress Counter */}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    readings.length === 4
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : readings.length > 0
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {readings.length === 4 ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                  {readings.length} / 4 Recorded
                </span>
              </div>
            </div>
          </div>

          {/* Single Day Readings List */}
          {readings.length === 0 ? (
            <EmptyState
              title={`No readings recorded for ${formatDisplayDate(selectedDate)}`}
              description="Consistent monitoring helps manage diabetes effectively. Record a reading for morning, breakfast, lunch, or dinner."
              actionLabel="Add Glucose Reading"
              onAction={() => onAddNew(selectedDate)}
            />
          ) : (
            <div className="grid gap-3.5">
              {readings.map((reading) => (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
