const express = require('express');
const router = express.Router();
const discountController = require('../../controllers/admin/discountController');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const auditLog = require('../../middlewares/auditLogger');

// All discount code routes require admin or staff privileges
const adminStaff = [protect, authorize('admin', 'staff')];

router.get('/', ...adminStaff, discountController.listCodes);
router.post('/', ...adminStaff, auditLog('admin', 'Created/Bulk generated discount codes'), discountController.createCodes);
router.put('/:id', ...adminStaff, auditLog('admin', 'Modified discount code properties'), discountController.updateCode);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Purged discount code record'), discountController.deleteCode);
router.get('/:id/redemptions', ...adminStaff, discountController.getRedemptions);

module.exports = router;