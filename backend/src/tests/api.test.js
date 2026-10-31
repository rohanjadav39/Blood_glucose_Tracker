const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

jest.mock('../config/db');

describe('API Endpoints & Security Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    test('returns 200 and healthy server status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.app).toContain('Sweety');
    });
  });

  describe('Authentication & Protected Route Enforcement', () => {
    test('GET /api/readings returns 401 Unauthorized without Bearer token', async () => {
      const res = await request(app).get('/api/readings');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    test('GET /api/reports/overview returns 401 Unauthorized without Bearer token', async () => {
      const res = await request(app).get('/api/reports/overview');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    test('POST /api/readings returns 401 Unauthorized without Bearer token', async () => {
      const res = await request(app)
        .post('/api/readings')
        .send({ date: '2026-10-15', slot: 'Morning (fasting)', value: 110 });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects malformed token', async () => {
      const res = await request(app)
        .get('/api/readings')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/auth/register input validation', () => {
    test('rejects registration with missing name', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('full name');
    });

    test('rejects registration with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('valid email');
    });

    test('rejects registration with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('at least 6 characters');
    });
  });
});
