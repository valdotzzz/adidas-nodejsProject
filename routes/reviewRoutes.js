const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.get('/product/:productId', reviewController.getProductReviews); // public
router.get('/can-review/:productId', protect, reviewController.canReview);
router.post('/product/:productId', protect, upload.array('images', 5), reviewController.createReview);
router.delete('/:id', protect, reviewController.deleteReview);
router.put('/:id', protect, upload.array('images', 5), reviewController.updateReview);

module.exports = router;