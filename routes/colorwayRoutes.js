const express = require('express');
const router = express.Router();
const c = require('../controllers/variantController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Mounted at /api/colorways
router.get('/',   c.getAllColorways);
router.post('/', protect, authorize('admin', 'staff'), c.createColorway);

module.exports = router;