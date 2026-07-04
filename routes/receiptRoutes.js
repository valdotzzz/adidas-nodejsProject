const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// No `protect` middleware on purpose — see controllers/receiptController.js
// for why: access is gated by the signed, order-scoped token instead of a
// login session, so the link works when opened straight from an email.
router.get('/:orderId/pdf', receiptController.downloadReceipt);

module.exports = router;