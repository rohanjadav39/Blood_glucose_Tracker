const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// All report routes are protected
router.use(authMiddleware);

// GET /api/reports/overview (All 3 reports in one call)
router.get('/overview', reportController.getOverviewReport);

// GET /api/reports/daily
router.get('/daily', reportController.getDailyReport);

// GET /api/reports/month-to-date
router.get('/month-to-date', reportController.getMonthToDateReport);

// GET /api/reports/monthly
router.get('/monthly', reportController.getMonthlyReport);

module.exports = router;
