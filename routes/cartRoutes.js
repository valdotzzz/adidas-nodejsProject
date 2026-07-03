const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

// Cart state lives client-side (localStorage) now. This is the only route
// left, and it's read-only: it hydrates whatever variant_ids the browser
// is holding with live price/stock data. Nothing is persisted server-side.
router.post('/resolve', protect, cartController.resolveCart);

module.exports = router;
