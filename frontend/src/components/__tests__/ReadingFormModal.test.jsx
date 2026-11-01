import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReadingFormModal } from '../ReadingFormModal';
import { getTodayString } from '../../utils/dateHelpers';

describe('ReadingFormModal (React Testing Library)', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const today = getTodayString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getForm = () => {
    const submitBtn = screen.getByRole('button', { name: /(Save|Update) Reading/i });
    return submitBtn.closest('form');
  };

  it('renders modal with all form controls when open', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
        existingDayReadings={[]}
      />
    );

    expect(screen.getByText('Log Blood Glucose Reading')).toBeInTheDocument();
    expect(screen.getByLabelText(/Reading Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Glucose Level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Reading/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('does not render content when isOpen is false', () => {
    render(
      <ReadingFormModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Log Blood Glucose Reading')).not.toBeInTheDocument();
  });

  it('validates required glucose value and displays error message', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
      />
    );

    const form = getForm();
    fireEvent.submit(form);

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates glucose range boundaries (< 40 and > 600)', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
      />
    );

    const glucoseInput = screen.getByLabelText(/Glucose Level/i);
    const form = getForm();

    // Test below 40
    fireEvent.change(glucoseInput, { target: { value: '35' } });
    fireEvent.submit(form);
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Test above 600
    fireEvent.change(glucoseInput, { target: { value: '650' } });
    fireEvent.submit(form);
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates against future dates', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
      />
    );

    const dateInput = screen.getByLabelText(/Reading Date/i);
    const glucoseInput = screen.getByLabelText(/Glucose Level/i);
    const form = getForm();

    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
    fireEvent.change(glucoseInput, { target: { value: '110' } });
    fireEvent.submit(form);

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('prevents duplicate slot entry for the same day', () => {
    const existingReadings = [
      { id: 1, date: today, slot: 'Morning (fasting)', value: 95 },
    ];

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
        existingDayReadings={existingReadings}
      />
    );

    const slotSelect = screen.getByLabelText(/Time Slot/i);
    const glucoseInput = screen.getByLabelText(/Glucose Level/i);
    const form = getForm();

    fireEvent.change(slotSelect, { target: { value: 'Morning (fasting)' } });
    fireEvent.change(glucoseInput, { target: { value: '105' } });
    fireEvent.submit(form);

    expect(
      screen.getByText('You already have an Morning (fasting) reading for this date.')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('enforces maximum 4 readings per day limit', () => {
    const existingReadings = [
      { id: 1, date: today, slot: 'Morning (fasting)', value: 90 },
      { id: 2, date: today, slot: 'After breakfast', value: 130 },
      { id: 3, date: today, slot: 'After lunch', value: 140 },
      { id: 4, date: today, slot: 'After dinner', value: 120 },
    ];

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
        existingDayReadings={existingReadings}
      />
    );

    const glucoseInput = screen.getByLabelText(/Glucose Level/i);
    const form = getForm();

    fireEvent.change(glucoseInput, { target: { value: '115' } });
    fireEvent.submit(form);

    expect(screen.getByText('You can add only 4 readings per day.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data successfully and closes modal', async () => {
    mockOnSubmit.mockResolvedValueOnce({ success: true });

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
        existingDayReadings={[]}
      />
    );

    const slotSelect = screen.getByLabelText(/Time Slot/i);
    const glucoseInput = screen.getByLabelText(/Glucose Level/i);
    const form = getForm();

    fireEvent.change(slotSelect, { target: { value: 'After lunch' } });
    fireEvent.change(glucoseInput, { target: { value: '128' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: undefined,
        date: today,
        slot: 'After lunch',
        value: 128,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('pre-populates fields properly in edit mode and allows updating', async () => {
    mockOnSubmit.mockResolvedValueOnce({ success: true });

    const initialReading = {
      id: 42,
      date: today,
      slot: 'After breakfast',
      value: 145,
    };

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={initialReading}
      />
    );

    expect(screen.getByText('Edit Blood Glucose Reading')).toBeInTheDocument();
    expect(screen.getByDisplayValue('145')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Reading/i })).toBeInTheDocument();

    const glucoseInput = screen.getByLabelText(/Glucose Level/i);
    fireEvent.change(glucoseInput, { target: { value: '138' } });

    const form = getForm();
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: 42,
        date: today,
        slot: 'After breakfast',
        value: 138,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate={today}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('only marks slots as (Already logged) for the selected date and respects defaultSlot', () => {
    const multiDayReadings = [
      { id: 1, date: '2026-10-30', slot: 'Morning (fasting)', value: 92 },
      { id: 2, date: '2026-10-30', slot: 'After breakfast', value: 130 },
      { id: 3, date: '2026-10-31', slot: 'Morning (fasting)', value: 95 },
    ];

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultDate="2026-10-31"
        defaultSlot="After lunch"
        existingDayReadings={multiDayReadings}
      />
    );

    // Date is 2026-10-31 where ONLY "Morning (fasting)" is taken
    const slotSelect = screen.getByLabelText(/Time Slot/i);
    expect(slotSelect.value).toBe('After lunch');

    const options = Array.from(slotSelect.querySelectorAll('option'));
    const morningOpt = options.find((o) => o.value === 'Morning (fasting)');
    const breakfastOpt = options.find((o) => o.value === 'After breakfast');
    const lunchOpt = options.find((o) => o.value === 'After lunch');

    expect(morningOpt.textContent).toContain('(Already logged)');
    expect(morningOpt.disabled).toBe(true);

    // After breakfast is NOT taken on 2026-10-31 (only on 2026-10-30)
    expect(breakfastOpt.textContent).not.toContain('(Already logged)');
    expect(breakfastOpt.disabled).toBe(false);

    expect(lunchOpt.textContent).not.toContain('(Already logged)');
    expect(lunchOpt.disabled).toBe(false);
  });
});
