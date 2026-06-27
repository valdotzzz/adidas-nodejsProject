const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');
const { protect, authorize } = require('../../middlewares/authMiddleware');

router.get('/', protect, authorize('admin', 'staff'), orderController.getAllOrders);
router.get('/:id', protect, authorize('admin', 'staff'), orderController.getOrderById);
router.put('/:id', protect, authorize('admin', 'staff'), orderController.updateOrderStatus);

module.exports = router;