const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const authMiddleware = require('../middleware/authMiddleware');

// All reading routes are protected
router.use(authMiddleware);

// GET /api/readings
router.get('/', readingController.getReadings);

// POST /api/readings
router.post('/', readingController.addReading);

// GET /api/readings/:id
router.get('/:id', readingController.getReadingById);

// PUT /api/readings/:id
router.put('/:id', readingController.updateReading);

// DELETE /api/readings/:id
router.delete('/:id', readingController.deleteReading);

module.exports = router;
