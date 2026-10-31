import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDisplayDate, adjustDate, isToday, getTodayString } from '../utils/dateHelpers';
import { SLOTS } from '../utils/glucoseHelpers';
import { ReadingCard } from './ReadingCard';
import { Button } from './ui/Button';
import { EmptyState } from './EmptyState';

export function ReadingsList({
  selectedDate,
  onDateChange,
  readings = [],
  onAddNew,
  onEdit,
  onDelete,
}) {
  const todayStr = getTodayString();
  const isSelectedToday = isToday(selectedDate);
  const slotsLoggedCount = readings.length;

  const handlePrevDay = () => {
    onDateChange(adjustDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    if (!isSelectedToday) {
      onDateChange(adjustDate(selectedDate, 1));
    }
  };

  const handleGoToday = () => {
    onDateChange(todayStr);
  };

  // Find remaining unlogged slots
  const loggedSlots = readings.map((r) => r.slot);
  const remainingSlots = SLOTS.filter((s) => !loggedSlots.includes(s));

  return (
    <div className="space-y-6">
      {/* Date Navigation & Status Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
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
              <CalendarIcon className="h-4 w-4 text-emerald-600" />
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="font-bold text-slate-800 text-base sm:text-lg bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
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
                className="text-xs text-emerald-600 font-semibold hover:bg-emerald-50 ml-1"
              >
                Jump to Today
              </Button>
            )}
          </div>

          {/* Slots Progress Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Daily Slots:
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  slotsLoggedCount === 4
                    ? 'bg-emerald-100 text-emerald-800'
                    : slotsLoggedCount > 0
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {slotsLoggedCount === 4 ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : null}
                {slotsLoggedCount} / 4 Recorded
              </span>
            </div>

            {slotsLoggedCount < 4 && (
              <Button
                onClick={() => onAddNew(selectedDate)}
                size="sm"
                className="gap-1.5 shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Log Slot</span>
              </Button>
            )}
          </div>
        </div>

        {/* Missing Slot Suggestions Pill Row */}
        {slotsLoggedCount < 4 && remainingSlots.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              Remaining today:
            </span>
            {remainingSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onAddNew(selectedDate, slot)}
                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-800 transition-all"
              >
                <PlusCircle className="h-3 w-3 text-slate-400" />
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Readings Grid or Empty State */}
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
  );
}
