const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');

// Mounted at /api/variants
router.put('/:id', protect, authorize('admin', 'staff'), auditLog('admin', 'Updated product variant'), variantController.updateVariant);
router.delete('/:id', protect, authorize('admin', 'staff'), auditLog('admin', 'Deleted product variant'), variantController.deleteVariant);

module.exports = router;
