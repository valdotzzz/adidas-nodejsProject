const express = require('express');
const router = express.Router({ mergeParams: true });
const variantController = require('../controllers/variantController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');

// Mounted at /api/products/:productId/variants
router.get('/', protect, authorize('admin', 'staff'), variantController.getVariantsForProduct);
router.post('/', protect, authorize('admin', 'staff'), auditLog('admin', 'Added product variant'), variantController.createVariant);

module.exports = router;
