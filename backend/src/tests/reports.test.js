const { calculateStats, getReportDateRanges } = require('../utils/reportHelpers');

describe('Report Metrics & Date Range Logic', () => {
  describe('calculateStats', () => {
    test('correctly calculates highest, lowest, average rounded to 1 decimal, and count', () => {
      // 95, 128, 135, 118 -> sum = 476, count = 4, avg = 119.0
      const readings = [
        { value: 95 },
        { value: 128 },
        { value: 135 },
        { value: 118 },
      ];

      const stats = calculateStats(readings);
      expect(stats.highest).toBe(135);
      expect(stats.lowest).toBe(95);
      expect(stats.average).toBe(119.0);
      expect(stats.count).toBe(4);
      expect(stats.hasData).toBe(true);
    });

    test('rounds average to exactly 1 decimal place', () => {
      // 100, 110, 125 -> sum = 335, count = 3, avg = 111.6666... -> 111.7
      const readings = [{ value: 100 }, { value: 110 }, { value: 125 }];

      const stats = calculateStats(readings);
      expect(stats.average).toBe(111.7);
      expect(stats.highest).toBe(125);
      expect(stats.lowest).toBe(100);
      expect(stats.count).toBe(3);
    });

    test('handles single reading correctly', () => {
      const stats = calculateStats([{ value: 104 }]);
      expect(stats.highest).toBe(104);
      expect(stats.lowest).toBe(104);
      expect(stats.average).toBe(104.0);
      expect(stats.count).toBe(1);
    });

    test('handles empty readings with friendly empty state values', () => {
      const stats = calculateStats([]);
      expect(stats.highest).toBeNull();
      expect(stats.lowest).toBeNull();
      expect(stats.average).toBeNull();
      expect(stats.count).toBe(0);
      expect(stats.hasData).toBe(false);
    });
  });

  describe('getReportDateRanges', () => {
    test('calculates correct ranges for assignment example (selected date: 15 Oct 2026)', () => {
      const { dailyRange, mtdRange, monthlyRange } = getReportDateRanges('2026-10-15');

      // Daily: 15 Oct 2026
      expect(dailyRange.startDate).toBe('2026-10-15');
      expect(dailyRange.endDate).toBe('2026-10-15');

      // Month-to-date: 1st of month to 15 Oct 2026
      expect(mtdRange.startDate).toBe('2026-10-01');
      expect(mtdRange.endDate).toBe('2026-10-15');

      // Monthly: Whole previous month -> 1 Sep 2026 to 30 Sep 2026
      expect(monthlyRange.startDate).toBe('2026-09-01');
      expect(monthlyRange.endDate).toBe('2026-09-30');
    });

    test('handles year rollover for January dates (e.g., 2026-01-10 -> prev month Dec 2025)', () => {
      const { monthlyRange } = getReportDateRanges('2026-01-10');

      expect(monthlyRange.startDate).toBe('2025-12-01');
      expect(monthlyRange.endDate).toBe('2025-12-31');
    });
  });
});
