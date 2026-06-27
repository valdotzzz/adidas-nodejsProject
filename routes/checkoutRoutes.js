const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, checkoutController.getCheckoutData);
router.post('/', protect, checkoutController.placeOrder);
router.get('/orders', protect, checkoutController.getMyOrders);
router.get('/orders/:id', protect, checkoutController.getOrderById);

module.exports = router;