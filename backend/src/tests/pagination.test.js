const readingController = require('../controllers/readingController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Reading Controller - Pagination on GET /readings (?page=1&limit=20)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns paginated response with total, totalPages, page, and limit when query params are provided', async () => {
    const mockUser = { id: 1 };
    const mockReadings = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      user_id: 1,
      date: `2026-10-${String(20 - Math.floor(i / 4)).padStart(2, '0')}`,
      slot: ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'][i % 4],
      value: 100 + i,
      created_at: new Date().toISOString(),
    }));

    // Mock count query then rows query
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '38' }] }) // count query
      .mockResolvedValueOnce({ rows: mockReadings }); // select query

    const req = {
      user: mockUser,
      query: { page: '1', limit: '20' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await readingController.getReadings(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 20,
      total: 38,
      page: 1,
      limit: 20,
      totalPages: 2,
      readings: mockReadings,
    });

    // Check count query was executed
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM readings WHERE user_id = $1'),
      [1]
    );

    // Check pagination LIMIT and OFFSET were included in select query
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/LIMIT \$2\s+OFFSET \$3/),
      [1, 20, 0]
    );
  });

  test('calculates correct OFFSET for page 2', async () => {
    const mockUser = { id: 1 };
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '45' }] })
      .mockResolvedValueOnce({ rows: [] });

    const req = {
      user: mockUser,
      query: { page: '2', limit: '20' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await readingController.getReadings(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      })
    );

    // OFFSET for page 2, limit 20 should be (2-1)*20 = 20
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      [1, 20, 20]
    );
  });

  test('maintains backward compatibility when no pagination params are provided', async () => {
    const mockUser = { id: 1 };
    const mockReadings = [{ id: 1, date: '2026-10-15', slot: 'Morning (fasting)', value: 95 }];

    db.query.mockResolvedValueOnce({ rows: mockReadings });

    const req = {
      user: mockUser,
      query: { date: '2026-10-15' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await readingController.getReadings(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      readings: mockReadings,
    });
    // Should NOT have run count query
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
