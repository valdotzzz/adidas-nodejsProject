const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');

// Public — needed for the storefront filters and the admin product form dropdown
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin/Staff protected CRUD endpoints (Quiz 6)
router.post('/', protect, authorize('admin', 'staff'), auditLog('admin', 'Created category'), categoryController.createCategory);
router.put('/:id', protect, authorize('admin', 'staff'), auditLog('admin', 'Updated category'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin', 'staff'), auditLog('admin', 'Deleted category'), categoryController.deleteCategory);

module.exports = router;