const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboardController');
const { protect, authorize } = require('../../middlewares/authMiddleware');

const adminStaff = [protect, authorize('admin', 'staff')];

router.get('/dashboard', ...adminStaff, dashboardController.getDashboard);
router.get('/dashboard/sales-chart', ...adminStaff, dashboardController.getSalesChart);
router.get('/dashboard/category-chart', ...adminStaff, dashboardController.getCategoryChart);
router.get('/dashboard/audit-logs', ...adminStaff, dashboardController.getAuditLogs);

module.exports = router;