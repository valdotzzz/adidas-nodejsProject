const express = require('express');
const router = express.Router();
const c = require('../controllers/variantController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');

const adminStaff = [protect, authorize('admin', 'staff')];

// Mounted at /api/variants
router.put('/:id',    ...adminStaff, auditLog('admin', 'Updated product variant'), c.updateVariant);
router.delete('/:id', ...adminStaff, auditLog('admin', 'Deleted product variant'), c.deleteVariant);

module.exports = router;