const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');
const upload = require('../middlewares/upload');

// Public
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin/Staff
router.post('/', protect, authorize('admin', 'staff'), upload.array('images', 10), auditLog('admin', 'Created product'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), upload.array('images', 10), auditLog('admin', 'Updated product'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Deleted product'), productController.deleteProduct);

module.exports = router;