const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const discountController = require('../controllers/admin/discountController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, checkoutController.placeOrder);
router.get('/orders', protect, checkoutController.getMyOrders);
router.get('/orders/:id', protect, checkoutController.getOrderById);
router.get('/validate/:code', protect, discountController.validateCode);

module.exports = router;