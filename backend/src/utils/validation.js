const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

/**
 * Returns today's date string formatted as YYYY-MM-DD based on local time
 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates reading input fields according to application rules
 * @param {Object} input - { date, slot, value }
 * @returns {{ isValid: boolean, error?: string, parsedValue?: number }}
 */
function validateReadingFields({ date, slot, value }) {
  // 1. Date validation
  if (!date || typeof date !== 'string') {
    return { isValid: false, error: 'A valid date is required.' };
  }

  // Regex check for YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format.' };
  }

  const [y, m, d] = date.split('-').map(Number);
  const parsedDate = new Date(y, m - 1, d);
  if (
    parsedDate.getFullYear() !== y ||
    parsedDate.getMonth() !== m - 1 ||
    parsedDate.getDate() !== d
  ) {
    return { isValid: false, error: 'Invalid calendar date provided.' };
  }

  // Rule: Date cannot be in the future
  const todayStr = getLocalDateString();
  if (date > todayStr) {
    return { isValid: false, error: 'Date cannot be in the future.' };
  }

  // 2. Slot validation
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return {
      isValid: false,
      error: `Slot must be one of: ${ALLOWED_SLOTS.join(', ')}.`,
    };
  }

  // 3. Value validation
  // Rule: Value is required
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: 'Please enter a glucose value.' };
  }

  const numVal = Number(value);

  // Rule: Value must be a whole number between 40 and 600
  // Check if it is a whole number (no decimals like 120.5) and within 40..600
  if (
    isNaN(numVal) ||
    !Number.isInteger(numVal) ||
    numVal < 40 ||
    numVal > 600
  ) {
    return { isValid: false, error: 'Value must be between 40 and 600 mg/dl.' };
  }

  return { isValid: true, parsedValue: numVal };
}

module.exports = {
  ALLOWED_SLOTS,
  getLocalDateString,
  validateReadingFields,
};
