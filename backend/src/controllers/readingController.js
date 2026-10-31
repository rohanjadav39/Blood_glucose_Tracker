const db = require('../config/db');
const { validateReadingFields } = require('../utils/validation');

// Helper to format date object to YYYY-MM-DD
function toDateString(d) {
  if (typeof d === 'string') return d.substring(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Add a new reading
async function addReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { date, slot, value } = req.body;

    // Field & format validations
    const validation = validateReadingFields({ date, slot, value });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const cleanDate = date.trim();
    const cleanSlot = slot.trim();
    const cleanValue = validation.parsedValue;

    // Fetch existing readings for this user on the selected date
    const existingForDay = await db.query(
      `SELECT id, slot FROM readings WHERE user_id = $1 AND date = $2`,
      [userId, cleanDate]
    );

    // Rule: Maximum 4 readings per day
    if (existingForDay.rows.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'You can add only 4 readings per day.',
      });
    }

    // Rule: Only one reading per slot per day
    const duplicateSlot = existingForDay.rows.find((r) => r.slot === cleanSlot);
    if (duplicateSlot) {
      return res.status(400).json({
        success: false,
        message: `You already have an ${cleanSlot} reading for this date.`,
      });
    }

    // Insert reading
    const insertRes = await db.query(
      `INSERT INTO readings (user_id, date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, created_at, updated_at`,
      [userId, cleanDate, cleanSlot, cleanValue]
    );

    return res.status(201).json({
      success: true,
      message: 'Reading added successfully.',
      reading: insertRes.rows[0],
    });
  } catch (err) {
    // Catch database unique constraint error as extra safeguard
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: `You already have an ${req.body.slot} reading for this date.`,
      });
    }
    next(err);
  }
}

// Get readings with optional date/range filters
async function getReadings(req, res, next) {
  try {
    const userId = req.user.id;
    const { date, startDate, endDate, slot } = req.query;

    let queryText = `
      SELECT 
        id, 
        user_id, 
        TO_CHAR(date, 'YYYY-MM-DD') AS date, 
        slot, 
        value, 
        created_at, 
        updated_at
      FROM readings
      WHERE user_id = $1
    `;
    const params = [userId];

    if (date) {
      params.push(date);
      queryText += ` AND date = $${params.length}`;
    } else {
      if (startDate) {
        params.push(startDate);
        queryText += ` AND date >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        queryText += ` AND date <= $${params.length}`;
      }
    }

    if (slot) {
      params.push(slot);
      queryText += ` AND slot = $${params.length}`;
    }

    queryText += `
      ORDER BY date DESC,
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    const result = await db.query(queryText, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      readings: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// Get single reading by ID
async function getReadingById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        id, 
        user_id, 
        TO_CHAR(date, 'YYYY-MM-DD') AS date, 
        slot, 
        value, 
        created_at, 
        updated_at
      FROM readings
      WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found.',
      });
    }

    return res.status(200).json({
      success: true,
      reading: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// Update existing reading
async function updateReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, slot, value } = req.body;

    // Check reading exists and belongs to user
    const existingCheck = await db.query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value 
       FROM readings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found.',
      });
    }

    const currentReading = existingCheck.rows[0];
    const targetDate = date !== undefined ? date.trim() : currentReading.date;
    const targetSlot = slot !== undefined ? slot.trim() : currentReading.slot;
    const targetValue = value !== undefined ? value : currentReading.value;

    // Validate fields
    const validation = validateReadingFields({
      date: targetDate,
      slot: targetSlot,
      value: targetValue,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const cleanValue = validation.parsedValue;

    // Check for conflict on targetDate (excluding this reading ID)
    const otherReadingsForDay = await db.query(
      `SELECT id, slot FROM readings WHERE user_id = $1 AND date = $2 AND id <> $3`,
      [userId, targetDate, id]
    );

    // Rule: Maximum 4 readings per day
    if (otherReadingsForDay.rows.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'You can add only 4 readings per day.',
      });
    }

    // Rule: Only one reading per slot per day
    const duplicateSlot = otherReadingsForDay.rows.find((r) => r.slot === targetSlot);
    if (duplicateSlot) {
      return res.status(400).json({
        success: false,
        message: `You already have an ${targetSlot} reading for this date.`,
      });
    }

    // Perform update
    const updateRes = await db.query(
      `UPDATE readings
       SET date = $1, slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, created_at, updated_at`,
      [targetDate, targetSlot, cleanValue, id, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Reading updated successfully.',
      reading: updateRes.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: `You already have an ${req.body.slot} reading for this date.`,
      });
    }
    next(err);
  }
}

// Delete reading
async function deleteReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reading deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
