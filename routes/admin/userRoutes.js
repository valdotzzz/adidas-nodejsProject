const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/userController');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const auditLog = require('../../middlewares/auditLogger');

router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.get('/:id/addresses', protect, authorize('admin'), userController.getUserAddresses);
router.patch('/:id/role', protect, authorize('admin'), auditLog('admin', 'Updated user role'), userController.updateUserRole);
router.patch('/:id/status', protect, authorize('admin'), auditLog('admin', 'Toggled user status'), userController.toggleUserStatus);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Deleted user'), userController.deleteUser);

module.exports = router;