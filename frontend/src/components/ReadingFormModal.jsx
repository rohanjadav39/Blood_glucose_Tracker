import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Gauge, Info, AlertCircle } from 'lucide-react';
import { SLOTS, SLOT_CONFIG, getGlucoseCategory } from '../utils/glucoseHelpers';
import { getTodayString } from '../utils/dateHelpers';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Alert } from './ui/Alert';

function normalizeDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.substring(0, 10);
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).substring(0, 10);
}

export function ReadingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultDate = null,
  defaultSlot = null,
  existingDayReadings = [],
}) {
  const isEdit = !!initialData;
  const todayStr = getTodayString();

  const [date, setDate] = useState(defaultDate ? normalizeDate(defaultDate) : todayStr);
  const [slot, setSlot] = useState(defaultSlot || SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(normalizeDate(initialData.date));
        setSlot(initialData.slot);
        setValue(String(initialData.value));
      } else {
        const targetDate = defaultDate ? normalizeDate(defaultDate) : todayStr;
        setDate(targetDate);

        const dayReadings = (existingDayReadings || []).filter(
          (r) => normalizeDate(r.date) === targetDate
        );
        const takenSlots = dayReadings.map((r) => r.slot);

        if (defaultSlot && !takenSlots.includes(defaultSlot)) {
          setSlot(defaultSlot);
        } else {
          const firstAvailableSlot = SLOTS.find((s) => !takenSlots.includes(s));
          setSlot(firstAvailableSlot || defaultSlot || SLOTS[0]);
        }
        setValue('');
      }
      setError('');
    }
  }, [isOpen, initialData, defaultDate, defaultSlot]);

  // Existing readings for the currently selected date
  const dayReadingsForDate = (existingDayReadings || []).filter(
    (r) =>
      normalizeDate(r.date) === date &&
      (!isEdit || String(r.id) !== String(initialData?.id))
  );
  const takenSlotsForDate = dayReadingsForDate.map((r) => r.slot);
  const isDayFull = !isEdit && dayReadingsForDate.length >= 4;

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setError('');

    // If currently selected slot is taken on this new date, auto-switch to first available slot
    if (!isEdit) {
      const targetReadings = (existingDayReadings || []).filter(
        (r) => normalizeDate(r.date) === newDate
      );
      const targetTakenSlots = targetReadings.map((r) => r.slot);
      if (targetTakenSlots.includes(slot)) {
        const nextFree = SLOTS.find((s) => !targetTakenSlots.includes(s));
        if (nextFree) {
          setSlot(nextFree);
        }
      }
    }
  };

  const validateForm = () => {
    if (!date) {
      return 'Please choose a date.';
    }
    if (date > todayStr) {
      return 'Date cannot be in the future.';
    }

    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    // Filter existing readings strictly for this selected date
    const readingsForDay = (existingDayReadings || []).filter(
      (r) =>
        normalizeDate(r.date) === date &&
        (!isEdit || String(r.id) !== String(initialData?.id))
    );

    if (!isEdit && readingsForDay.length >= 4) {
      return 'You can add only 4 readings per day.';
    }

    const duplicateSlot = readingsForDay.find((r) => r.slot === slot);
    if (duplicateSlot) {
      return `You already have an ${slot} reading for this date.`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id,
        date,
        slot,
        value: parseInt(value, 10),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save glucose reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numVal = parseInt(value, 10);
  const previewCategory = !isNaN(numVal) && numVal >= 40 && numVal <= 600
    ? getGlucoseCategory(numVal)
    : null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Blood Glucose Reading' : 'Log Blood Glucose Reading'}
      description={
        isEdit
          ? 'Update the recorded glucose value or time slot.'
          : 'Record a new blood glucose measurement for your daily log.'
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="destructive">{error}</Alert>
        </div>
      )}

      {isDayFull && !error && (
        <div className="mb-4">
          <Alert variant="warning">
            All 4 clinical slots (Fasting, Breakfast, Lunch, Dinner) have already been logged for this date.
            To change a value, you can edit or delete an existing reading from that day.
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Field */}
        <div>
          <label htmlFor="reading-date" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Reading Date
          </label>
          <div className="relative">
            <Input
              id="reading-date"
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="pl-9"
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Cannot select future dates. Today is {todayStr}.
          </p>
        </div>

        {/* Slot Selector */}
        <div>
          <label htmlFor="reading-slot" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Time Slot (4 slots allowed per day)
          </label>
          <div className="relative">
            <Select
              id="reading-slot"
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value);
                setError('');
              }}
              className="pl-9"
            >
              {SLOTS.map((s) => {
                const isTaken = takenSlotsForDate.includes(s);
                return (
                  <option key={s} value={s} disabled={!isEdit && isTaken}>
                    {s} {isTaken ? '(Already logged)' : ''}
                  </option>
                );
              })}
            </Select>
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {SLOT_CONFIG[slot]?.description}
          </p>
        </div>

        {/* Glucose Value Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="reading-value" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Glucose Level (mg/dl)
            </label>
            {previewCategory && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${previewCategory.badgeClass}`}>
                {previewCategory.label} ({previewCategory.description})
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              id="reading-value"
              type="number"
              min="40"
              max="600"
              step="1"
              placeholder="e.g. 115"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              required
              className="pl-9 text-base font-semibold"
            />
            <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Whole number between 40 and 600 mg/dl.
          </p>
        </div>

        {/* Guidance Reference Card */}
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Standard Glucose Targets:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Normal Fasting: 70–99 mg/dl</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Normal Post-Meal: &lt;140 mg/dl</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Elevated: 140–199 mg/dl</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>High Alert: ≥200 mg/dl</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isDayFull}
            className="gap-2"
          >
            {isEdit ? 'Update Reading' : 'Save Reading'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
