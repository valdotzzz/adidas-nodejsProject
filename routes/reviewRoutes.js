const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/product/:productId', reviewController.getProductReviews); // public
router.get('/can-review/:productId', protect, reviewController.canReview);
router.post('/product/:productId', protect, reviewController.createReview);
router.delete('/:id', protect, reviewController.deleteReview);
router.put('/:id', protect, reviewController.updateReview);

module.exports = router;