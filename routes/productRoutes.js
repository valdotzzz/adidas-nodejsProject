const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize, optionalProtect } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');
const upload = require('../middlewares/upload');

// Public (optionalProtect lets admin/staff see hidden products too)
router.get('/', optionalProtect, productController.getAllProducts);

// Admin/Staff — bulk campaign management
router.patch('/bulk-sale', protect, authorize('admin', 'staff'), auditLog('admin', 'Bulk discount management configuration applied'), productController.bulkSale);

// Admin/Staff — soft-delete management (must come after special matching endpoints so static paths aren't evaluated as IDs)
router.get('/trash/list', protect, authorize('admin', 'staff'), productController.getDeletedProducts);
router.patch('/:id/restore', protect, authorize('admin', 'staff'), auditLog('admin', 'Restored product'), productController.restoreProduct);

router.get('/:id', optionalProtect, productController.getProductById);
router.patch('/:id/visibility', protect, authorize('admin', 'staff'), auditLog('admin', 'Toggled product visibility'), productController.toggleVisibility);

// Admin/Staff
router.post('/', protect, authorize('admin', 'staff'), upload.array('images', 10), auditLog('admin', 'Created product'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), upload.array('images', 10), auditLog('admin', 'Updated product'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Deleted product'), productController.deleteProduct);

module.exports = router;