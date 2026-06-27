const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboardController');
const { protect, authorize } = require('../../middlewares/authMiddleware');

router.get('/dashboard', protect, authorize('admin'), dashboardController.getDashboard);

module.exports = router;