const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');
const upload = require('../middlewares/upload');

router.post('/', protect, authorize('admin', 'staff'), auditLog('admin', 'Created product'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), auditLog('admin', 'Updated product'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Deleted product'), productController.deleteProduct);
router.post('/', protect, authorize('admin', 'staff'), upload.array('images', 10), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), upload.array('images', 10), productController.updateProduct);

// Public catalog routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin/Staff Protected CRUD endpoints (Fulfills Quiz 6)
router.post('/', protect, authorize('admin', 'staff'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin', 'staff'), productController.deleteProduct);

module.exports = router;