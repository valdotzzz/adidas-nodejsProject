const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboardController');
const { protect, authorize } = require('../../middlewares/authMiddleware');

router.get('/dashboard', protect, authorize('admin'), dashboardController.getDashboard);
router.get('/dashboard', protect, authorize('admin', 'staff'), dashboardController.getDashboard);
router.get('/dashboard/sales-chart', protect, authorize('admin', 'staff'), dashboardController.getSalesChart);
router.get('/dashboard/category-chart', protect, authorize('admin', 'staff'), dashboardController.getCategoryChart);
router.get('/dashboard/audit-logs', protect, authorize('admin', 'staff'), dashboardController.getAuditLogs);

module.exports = router;