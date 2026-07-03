const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');

// All wishlist routes require a logged-in user
router.get('/', protect, wishlistController.getWishlist);
router.get('/ids', protect, wishlistController.getWishlistIds);
router.post('/', protect, wishlistController.addToWishlist);
router.delete('/:productId', protect, wishlistController.removeFromWishlist);

module.exports = router;