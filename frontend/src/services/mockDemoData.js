import { getTodayString, adjustDate } from '../utils/dateHelpers';
import { SLOTS } from '../utils/glucoseHelpers';

const DEMO_STORAGE_KEY = 'sweety_demo_readings';

export function getInitialDemoReadings() {
  const saved = localStorage.getItem(DEMO_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }

  const today = getTodayString();
  const readings = [];
  let idCounter = 1;

  // 10 consecutive days with all 4 slots (40 readings)
  // Cleanly demonstrates 2 pages of 20 readings (5 days x 4 readings per page)
  for (let offset = 0; offset <= 9; offset++) {
    const date = adjustDate(today, -offset);
    const sampleVals = [
      { slot: SLOTS[0], value: 92 + (offset % 5) * 3 },   // Fasting ~92-104
      { slot: SLOTS[1], value: 128 + (offset % 4) * 6 },  // After breakfast ~128-146
      { slot: SLOTS[2], value: 135 + (offset % 3) * 8 },  // After lunch ~135-151
      { slot: SLOTS[3], value: 118 + (offset % 6) * 4 },  // After dinner ~118-138
    ];

    for (let i = 0; i < 4; i++) {
      readings.push({
        id: idCounter++,
        user_id: 1,
        date,
        slot: sampleVals[i].slot,
        value: sampleVals[i].value,
        created_at: new Date().toISOString(),
      });
    }
  }

  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(readings));
  return readings;
}

export const mockApi = {
  getReadings: (params = {}) => {
    let readings = getInitialDemoReadings();

    if (params.date) {
      readings = readings.filter((r) => r.date === params.date);
    }
    if (params.startDate) {
      readings = readings.filter((r) => r.date >= params.startDate);
    }
    if (params.endDate) {
      readings = readings.filter((r) => r.date <= params.endDate);
    }
    if (params.slot) {
      readings = readings.filter((r) => r.slot === params.slot);
    }

    const total = readings.length;
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || (params.page ? 20 : total);

    const isPaginated = params.page !== undefined || params.limit !== undefined;

    let paginatedReadings = readings;
    if (isPaginated) {
      const offset = (page - 1) * limit;
      paginatedReadings = readings.slice(offset, offset + limit);
    }

    return {
      success: true,
      count: paginatedReadings.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      readings: paginatedReadings,
    };
  },

  createReading: (data) => {
    const readings = getInitialDemoReadings();
    const newReading = {
      id: Date.now(),
      user_id: 1,
      date: data.date,
      slot: data.slot,
      value: Number(data.value),
      created_at: new Date().toISOString(),
    };
    readings.unshift(newReading);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(readings));
    return { success: true, reading: newReading };
  },

  updateReading: (id, data) => {
    let readings = getInitialDemoReadings();
    readings = readings.map((r) =>
      String(r.id) === String(id) ? { ...r, ...data, value: Number(data.value) } : r
    );
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(readings));
    return { success: true, reading: readings.find((r) => String(r.id) === String(id)) };
  },

  deleteReading: (id) => {
    let readings = getInitialDemoReadings();
    readings = readings.filter((r) => String(r.id) !== String(id));
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(readings));
    return { success: true, id };
  },

  getReportsOverview: (selectedDate = getTodayString()) => {
    const all = getInitialDemoReadings();
    const dailyReadings = all.filter((r) => r.date === selectedDate);
    const mtdReadings = all.filter((r) => r.date.slice(0, 7) === selectedDate.slice(0, 7) && r.date <= selectedDate);
    const prevMonthPrefix = adjustDate(selectedDate, -30).slice(0, 7);
    const monthlyReadings = all.filter((r) => r.date.slice(0, 7) === prevMonthPrefix);

    const calc = (list) => {
      if (list.length === 0) return { count: 0, average: 0, highest: 0, lowest: 0, hasData: false };
      const vals = list.map((r) => r.value);
      const sum = vals.reduce((a, b) => a + b, 0);
      return {
        count: vals.length,
        average: Math.round((sum / vals.length) * 10) / 10,
        highest: Math.max(...vals),
        lowest: Math.min(...vals),
        hasData: true,
      };
    };

    return {
      success: true,
      selectedDate,
      daily: {
        title: 'Daily Report',
        range: { startDate: selectedDate, endDate: selectedDate },
        stats: calc(dailyReadings),
        readings: dailyReadings,
      },
      monthToDate: {
        title: 'Month-to-Date Report',
        range: { startDate: `${selectedDate.slice(0, 7)}-01`, endDate: selectedDate },
        stats: calc(mtdReadings),
        count: mtdReadings.length,
        readings: mtdReadings,
      },
      monthly: {
        title: 'Monthly Report (Previous Month)',
        range: {
          startDate: `${prevMonthPrefix}-01`,
          endDate: `${prevMonthPrefix}-28`,
          previousMonthName: 'Previous Month',
        },
        stats: calc(monthlyReadings.length > 0 ? monthlyReadings : all.slice(15, 35)),
        count: (monthlyReadings.length > 0 ? monthlyReadings : all.slice(15, 35)).length,
        readings: monthlyReadings.length > 0 ? monthlyReadings : all.slice(15, 35),
      },
    };
  },
};
