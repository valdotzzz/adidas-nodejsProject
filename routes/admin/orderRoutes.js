const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const auditLog = require('../../middlewares/auditLogger');

router.get('/', protect, authorize('admin', 'staff'), orderController.getAllOrders);
router.get('/:id', protect, authorize('admin', 'staff'), orderController.getOrderById);
router.put('/:id', protect, authorize('admin', 'staff'), auditLog('staff', 'Updated order status'), orderController.updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Deleted order'), orderController.deleteOrder);

module.exports = router;