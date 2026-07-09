const express = require('express');
const router = express.Router();
const discountController = require('../controllers/admin/discountController');
const { protect } = require('../middlewares/authMiddleware');

// Customer-facing: validate a promo code at checkout.
// Requires any valid login (customer, staff, admin) — just blocks unauthenticated scraping.
router.get('/validate/:code', protect, discountController.validateCode);

module.exports = router;