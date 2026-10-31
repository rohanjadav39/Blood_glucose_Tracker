import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Gauge, AlertCircle, Info } from 'lucide-react';
import { SLOTS, SLOT_CONFIG, getGlucoseCategory } from '../utils/glucoseHelpers';
import { getTodayString } from '../utils/dateHelpers';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Alert } from './ui/Alert';

export function ReadingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null, // if provided, modal operates in Edit mode
  defaultDate = null,
  existingDayReadings = [], // readings for current day to assist user
}) {
  const isEdit = !!initialData;
  const todayStr = getTodayString();

  const [date, setDate] = useState(defaultDate || todayStr);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setSlot(initialData.slot);
      setValue(String(initialData.value));
    } else {
      setDate(defaultDate || todayStr);
      // Pick first slot not yet taken on this date if available
      const takenSlots = existingDayReadings.map((r) => r.slot);
      const firstAvailableSlot = SLOTS.find((s) => !takenSlots.includes(s));
      setSlot(firstAvailableSlot || SLOTS[0]);
      setValue('');
    }
    setError('');
  }, [initialData, defaultDate, isOpen, existingDayReadings]);

  // Client-side validation matching assignment requirements
  const validateForm = () => {
    // Rule: Date cannot be in the future
    if (!date) {
      return 'Please choose a date.';
    }
    if (date > todayStr) {
      return 'Date cannot be in the future.';
    }

    // Rule: Value is required
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

    // Rule: Value must be a whole number between 40 and 600
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    // Rule: Only one reading per slot per day & Max 4 readings per day
    // (If not editing the current reading)
    const otherReadings = existingDayReadings.filter(
      (r) => !isEdit || String(r.id) !== String(initialData?.id)
    );

    if (otherReadings.length >= 4) {
      return 'You can add only 4 readings per day.';
    }

    const duplicateSlot = otherReadings.find((r) => r.slot === slot);
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

  // Preview category badge based on current typed value
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Field */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Reading Date
          </label>
          <div className="relative">
            <Input
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
              }}
              required
              className="pl-9"
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Cannot select future dates. Today is {todayStr}.
          </p>
        </div>

        {/* Slot Selector */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Time Slot (4 slots allowed per day)
          </label>
          <div className="relative">
            <Select
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value);
                setError('');
              }}
              className="pl-9"
            >
              {SLOTS.map((s) => {
                const isTaken = existingDayReadings.some(
                  (r) => r.slot === s && (!isEdit || String(r.id) !== String(initialData?.id))
                );
                return (
                  <option key={s} value={s}>
                    {s} {isTaken ? '(Already logged)' : ''}
                  </option>
                );
              })}
            </Select>
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {SLOT_CONFIG[slot]?.description}
          </p>
        </div>

        {/* Glucose Value Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
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
            <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Whole number between 40 and 600 mg/dl.
          </p>
        </div>

        {/* Guidance Reference Card */}
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600">
          <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-emerald-600" />
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
            <div className="flex items-center gap-1.5">
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
          <Button type="submit" isLoading={isSubmitting} className="gap-2">
            {isEdit ? 'Update Reading' : 'Save Reading'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
