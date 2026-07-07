const { Variant, Product, Colorway, ShoeSize } = require('../models');

const withLookups = { include: [Colorway, ShoeSize, { model: require('../models').ProductImage, as: 'VariantImage' }] };

// GET /api/products/:productId/variants
exports.getVariantsForProduct = async (req, res) => {
    try {
        const variants = await Variant.findAll({
            where: { product_id: req.params.productId },
            include: [Colorway, ShoeSize, { model: require('../models').ProductImage, as: 'VariantImage' }],
            order: [
                [Colorway, 'name', 'ASC'],
                [ShoeSize, 'us_size', 'ASC']
            ]
        });
        return res.status(200).json(variants);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching variants.', error: error.message });
    }
};

// POST /api/products/:productId/variants
exports.createVariant = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.productId);
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        const { colorway_id, size_id, image_id } = req.body;
        if (!colorway_id || !size_id) {
            return res.status(422).json({ message: 'colorway_id and size_id are required.' });
        }

        // Validate unique image assignment per product
        if (image_id) {
            const existingVariant = await Variant.findOne({ 
                where: { product_id: product.id, image_id } 
            });
            if (existingVariant) {
                return res.status(409).json({ message: 'Warning: This picture is already assigned to another variant. Please choose a different one or leave it blank.' });
            }
        }

        const variant = await Variant.create({
            product_id: product.id,
            colorway_id,
            size_id,
            stock_level: 0, // Default to 0, managed in Stock tab
            image_id: image_id || null
        });

        const full = await Variant.findByPk(variant.id, withLookups);
        return res.status(201).json({ message: 'Variant added successfully.', variant: full });
    } catch (error) {
        return res.status(500).json({ message: 'Server error creating variant.', error: error.message });
    }
};

// PUT /api/variants/:id
exports.updateVariant = async (req, res) => {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) return res.status(404).json({ message: 'Variant not found.' });

        const { colorway_id, size_id, image_id } = req.body;
        
        if (image_id && image_id !== variant.image_id) {
            const existingVariant = await Variant.findOne({ 
                where: { product_id: variant.product_id, image_id } 
            });
            if (existingVariant) {
                return res.status(409).json({ message: 'Warning: This picture is already assigned to another variant.' });
            }
        }

        await variant.update({
            colorway_id: colorway_id ?? variant.colorway_id,
            size_id:     size_id     ?? variant.size_id,
            image_id:    image_id !== undefined ? (image_id || null) : variant.image_id
        });

        const full = await Variant.findByPk(variant.id, withLookups);
        return res.status(200).json({ message: 'Variant updated successfully.', variant: full });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating variant.', error: error.message });
    }
};

// DELETE /api/variants/:id
exports.deleteVariant = async (req, res) => {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) return res.status(404).json({ message: 'Variant not found.' });
        await variant.destroy();
        return res.status(200).json({ message: 'Variant removed successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting variant.', error: error.message });
    }
};

// GET /api/colorways — list all colorways for dropdowns
exports.getAllColorways = async (req, res) => {
    try {
        const colorways = await Colorway.findAll({ order: [['name', 'ASC']] });
        return res.status(200).json(colorways);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching colorways.', error: error.message });
    }
};

// POST /api/colorways — create a new colorway
exports.createColorway = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'Colorway name is required.' });
        const [colorway, created] = await Colorway.findOrCreate({
            where: { name: name.trim() },
            defaults: { name: name.trim() }
        });
        return res.status(created ? 201 : 200).json({ message: created ? 'Colorway created.' : 'Already exists.', colorway });
    } catch (error) {
        return res.status(500).json({ message: 'Server error creating colorway.', error: error.message });
    }
};

// GET /api/shoe-sizes — list all sizes for dropdowns
exports.getAllSizes = async (req, res) => {
    try {
        const sizes = await ShoeSize.findAll({ order: [['sort_order', 'ASC'], ['us_size', 'ASC']] });
        return res.status(200).json(sizes);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching sizes.', error: error.message });
    }
};