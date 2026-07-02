const { Variant, Product } = require('../models');

// GET /api/products/:productId/variants — list all variants for a product
exports.getVariantsForProduct = async (req, res) => {
    try {
        const variants = await Variant.findAll({
            where: { product_id: req.params.productId },
            order: [['colorway', 'ASC'], ['size_value', 'ASC']]
        });
        return res.status(200).json(variants);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching variants.', error: error.message });
    }
};

// POST /api/products/:productId/variants — add a variant to a product
exports.createVariant = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const { colorway, size_type, size_value, stock_level } = req.body;
        if (!colorway || !size_value) {
            return res.status(422).json({ message: 'Colorway and size are required.' });
        }

        const variant = await Variant.create({
            product_id: product.id,
            colorway,
            size_type: size_type || 'US',
            size_value,
            stock_level: stock_level || 0
        });

        return res.status(201).json({ message: 'Variant added successfully.', variant });
    } catch (error) {
        return res.status(500).json({ message: 'Server error creating variant.', error: error.message });
    }
};

// PUT /api/variants/:id — update a variant (colorway/size/stock)
exports.updateVariant = async (req, res) => {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found.' });
        }

        const { colorway, size_type, size_value, stock_level } = req.body;
        await variant.update({
            colorway: colorway ?? variant.colorway,
            size_type: size_type ?? variant.size_type,
            size_value: size_value ?? variant.size_value,
            stock_level: stock_level ?? variant.stock_level
        });

        return res.status(200).json({ message: 'Variant updated successfully.', variant });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating variant.', error: error.message });
    }
};

// DELETE /api/variants/:id — remove a variant
exports.deleteVariant = async (req, res) => {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found.' });
        }

        await variant.destroy();
        return res.status(200).json({ message: 'Variant removed successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting variant.', error: error.message });
    }
};
