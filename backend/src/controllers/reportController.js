const db = require('../config/db');
const { getLocalDateString } = require('../utils/validation');
const { calculateStats, getReportDateRanges } = require('../utils/reportHelpers');

// Parse and validate date query parameter
function parseSelectedDate(req) {
  const queryDate = req.query.date;
  if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
    return queryDate;
  }
  return getLocalDateString();
}

/**
 * Daily Report
 * Selected date, lists each reading with its slot, highest, lowest, average, count.
 */
async function getDailyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = parseSelectedDate(req);
    const { dailyRange } = getReportDateRanges(selectedDate);

    const query = `
      SELECT 
        id, 
        TO_CHAR(date, 'YYYY-MM-DD') AS date, 
        slot, 
        value, 
        created_at
      FROM readings
      WHERE user_id = $1 AND date = $2
      ORDER BY 
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    const result = await db.query(query, [userId, selectedDate]);
    const readings = result.rows;
    const stats = calculateStats(readings);

    return res.status(200).json({
      success: true,
      reportType: 'Daily',
      date: selectedDate,
      range: dailyRange,
      stats,
      readings,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Month-to-date Report
 * 1st of the month to selected date.
 */
async function getMonthToDateReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = parseSelectedDate(req);
    const { mtdRange } = getReportDateRanges(selectedDate);

    const query = `
      SELECT 
        id, 
        TO_CHAR(date, 'YYYY-MM-DD') AS date, 
        slot, 
        value
      FROM readings
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC, 
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    const result = await db.query(query, [userId, mtdRange.startDate, mtdRange.endDate]);
    const readings = result.rows;
    const stats = calculateStats(readings);

    return res.status(200).json({
      success: true,
      reportType: 'Month-to-date',
      date: selectedDate,
      range: mtdRange,
      stats,
      readingsCount: readings.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Monthly Report
 * The whole previous month.
 */
async function getMonthlyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = parseSelectedDate(req);
    const { monthlyRange } = getReportDateRanges(selectedDate);

    const query = `
      SELECT 
        id, 
        TO_CHAR(date, 'YYYY-MM-DD') AS date, 
        slot, 
        value
      FROM readings
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC, 
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    const result = await db.query(query, [userId, monthlyRange.startDate, monthlyRange.endDate]);
    const readings = result.rows;
    const stats = calculateStats(readings);

    return res.status(200).json({
      success: true,
      reportType: 'Monthly (Previous Month)',
      date: selectedDate,
      range: monthlyRange,
      stats,
      readingsCount: readings.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Overview Report
 * Returns Daily, Month-to-date, and Monthly reports in a single unified payload.
 */
async function getOverviewReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = parseSelectedDate(req);
    const { dailyRange, mtdRange, monthlyRange } = getReportDateRanges(selectedDate);

    // Fetch daily readings
    const dailyRes = await db.query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, created_at
       FROM readings
       WHERE user_id = $1 AND date = $2
       ORDER BY 
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC`,
      [userId, selectedDate]
    );

    // Fetch MTD readings
    const mtdRes = await db.query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value
       FROM readings
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [userId, mtdRange.startDate, mtdRange.endDate]
    );

    // Fetch Monthly (previous month) readings
    const monthlyRes = await db.query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value
       FROM readings
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [userId, monthlyRange.startDate, monthlyRange.endDate]
    );

    const dailyStats = calculateStats(dailyRes.rows);
    const mtdStats = calculateStats(mtdRes.rows);
    const monthlyStats = calculateStats(monthlyRes.rows);

    return res.status(200).json({
      success: true,
      selectedDate,
      daily: {
        title: 'Daily Report',
        range: dailyRange,
        stats: dailyStats,
        readings: dailyRes.rows,
      },
      monthToDate: {
        title: 'Month-to-Date Report',
        range: mtdRange,
        stats: mtdStats,
        count: mtdRes.rows.length,
      },
      monthly: {
        title: `Monthly Report (${monthlyRange.previousMonthName})`,
        range: monthlyRange,
        stats: monthlyStats,
        count: monthlyRes.rows.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
  getOverviewReport,
};
