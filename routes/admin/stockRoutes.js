const express = require('express');
const router  = express.Router();
const stock   = require('../../controllers/admin/stockController');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const auditLog = require('../../middlewares/auditLogger');

const adminStaff = [protect, authorize('admin', 'staff')];

router.get('/',  ...adminStaff, stock.getAllVariantsForStock);
router.patch('/', ...adminStaff,
    auditLog('admin', 'Batch stock adjustment'),
    stock.batchAdjustStock
);

module.exports = router;