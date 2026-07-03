const db = require('../models');
const { Wishlist, Product, Category, ProductImage } = db;

// GET /api/wishlist — the logged-in user's wishlisted products, with live on-sale info
exports.getWishlist = async (req, res) => {
    try {
        const items = await Wishlist.findAll({
            where: { user_id: req.user.id },
            include: [{ model: Product, include: [Category, ProductImage] }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching wishlist.', error: error.message });
    }
};

// GET /api/wishlist/ids — just the product IDs the user has wishlisted (cheap lookup for
// hydrating heart icons on shop/product-detail pages without pulling full product data)
exports.getWishlistIds = async (req, res) => {
    try {
        const items = await Wishlist.findAll({
            where: { user_id: req.user.id },
            attributes: ['product_id']
        });

        return res.status(200).json(items.map(i => i.product_id));
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching wishlist.', error: error.message });
    }
};

// POST /api/wishlist — add a product to the logged-in user's wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(422).json({ message: 'product_id is required.' });
        }

        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const [item, created] = await Wishlist.findOrCreate({
            where: { user_id: req.user.id, product_id },
            defaults: { user_id: req.user.id, product_id }
        });

        return res.status(created ? 201 : 200).json({
            message: created ? 'Added to wishlist.' : 'Already in your wishlist.',
            wishlistItem: item
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error adding to wishlist.', error: error.message });
    }
};

// DELETE /api/wishlist/:productId — remove a product from the logged-in user's wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const deleted = await Wishlist.destroy({
            where: { user_id: req.user.id, product_id: productId }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'That product is not in your wishlist.' });
        }

        return res.status(200).json({ message: 'Removed from wishlist.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error removing from wishlist.', error: error.message });
    }
};