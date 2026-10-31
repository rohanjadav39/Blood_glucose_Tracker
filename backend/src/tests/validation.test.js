const {
  validateReadingFields,
  ALLOWED_SLOTS,
  getLocalDateString,
} = require('../utils/validation');

describe('Reading Validation Rules (Assignment Requirements)', () => {
  const validSlot = 'Morning (fasting)';
  const todayStr = getLocalDateString();

  // Past valid date
  const validPastDate = '2026-10-01';

  describe('Rule: Value is required', () => {
    test('rejects undefined value with exact message "Please enter a glucose value."', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: undefined });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Please enter a glucose value.');
    });

    test('rejects null value with exact message "Please enter a glucose value."', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: null });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Please enter a glucose value.');
    });

    test('rejects empty string value with exact message "Please enter a glucose value."', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: '   ' });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Please enter a glucose value.');
    });
  });

  describe('Rule: Value must be a whole number between 40 and 600', () => {
    test('rejects values below 40', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 39 });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects values above 600', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 601 });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects decimal / non-whole numbers', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 110.5 });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects non-numeric string values', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 'abc' });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('accepts boundary value 40', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 40 });
      expect(res.isValid).toBe(true);
      expect(res.parsedValue).toBe(40);
    });

    test('accepts boundary value 600', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 600 });
      expect(res.isValid).toBe(true);
      expect(res.parsedValue).toBe(600);
    });

    test('accepts valid normal value 110', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: '110' });
      expect(res.isValid).toBe(true);
      expect(res.parsedValue).toBe(110);
    });
  });

  describe('Rule: Date cannot be in the future', () => {
    test('rejects future date with exact message "Date cannot be in the future."', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalDateString(tomorrow);

      const res = validateReadingFields({ date: tomorrowStr, slot: validSlot, value: 120 });
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Date cannot be in the future.');
    });

    test('accepts today date', () => {
      const res = validateReadingFields({ date: todayStr, slot: validSlot, value: 120 });
      expect(res.isValid).toBe(true);
    });

    test('accepts past date', () => {
      const res = validateReadingFields({ date: validPastDate, slot: validSlot, value: 120 });
      expect(res.isValid).toBe(true);
    });
  });

  describe('Time Slots Validation', () => {
    test.each(ALLOWED_SLOTS)('accepts allowed slot: "%s"', (slot) => {
      const res = validateReadingFields({ date: todayStr, slot, value: 120 });
      expect(res.isValid).toBe(true);
    });

    test('rejects invalid slot', () => {
      const res = validateReadingFields({
        date: todayStr,
        slot: 'Midnight snack',
        value: 120,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Slot must be one of');
    });
  });
});
