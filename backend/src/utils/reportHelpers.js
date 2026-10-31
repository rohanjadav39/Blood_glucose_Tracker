/**
 * Calculates statistics (highest, lowest, average rounded to 1 decimal, count)
 * from an array of reading values or reading rows.
 */
function calculateStats(readings) {
  if (!readings || readings.length === 0) {
    return {
      highest: null,
      lowest: null,
      average: null,
      count: 0,
      hasData: false,
    };
  }

  const values = readings.map((r) => (typeof r === 'number' ? r : r.value));
  const count = values.length;
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = Number((sum / count).toFixed(1));

  return {
    highest,
    lowest,
    average,
    count,
    hasData: true,
  };
}

/**
 * Computes date ranges for Daily, Month-to-date, and Monthly (previous month)
 * @param {string} dateString - "YYYY-MM-DD"
 */
function getReportDateRanges(dateString) {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  // 1. Daily: selected date
  const dailyRange = {
    startDate: dateString,
    endDate: dateString,
    label: dateString,
  };

  // 2. Month-to-date: 1st of month to selected date
  const mtdStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const mtdRange = {
    startDate: mtdStart,
    endDate: dateString,
    label: `${mtdStart} to ${dateString}`,
  };

  // 3. Monthly: Whole previous month
  // E.g., for October 2026 -> 1 Sep 2026 to 30 Sep 2026
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  // Date(year, monthIndex, 0) gives the last day of the previous month
  const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(
    lastDayOfPrevMonth
  ).padStart(2, '0')}`;

  const monthlyRange = {
    startDate: prevMonthStart,
    endDate: prevMonthEnd,
    label: `${prevMonthStart} to ${prevMonthEnd}`,
    previousMonthName: new Date(prevYear, prevMonth - 1, 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    }),
  };

  return {
    dailyRange,
    mtdRange,
    monthlyRange,
  };
}

module.exports = {
  calculateStats,
  getReportDateRanges,
};
