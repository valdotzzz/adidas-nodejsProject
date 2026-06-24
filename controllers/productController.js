const { Product, Variant, ProductImage, Category } = require('../models');

// Create Product with Variants (Fulfills partial MP1/MP2)
exports.createProduct = async (req, res) => {
    try {
        // Ensure category_id is pulled from the payload request body
        const { name, style_code, description, price, gender, category_id, is_exclusive, variants } = req.body;

        // Verify category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return res.status(400).json({ message: 'Invalid category assignment.' });
        }

        // Create the primary product record
        const newProduct = await Product.create({
            name,
            style_code,
            description,
            price,
            gender,
            is_exclusive: is_exclusive || false,
            category_id
        });

        // Bulk insert associated structural variants if provided
        if (variants && variants.length > 0) {
            const variantData = variants.map(v => ({ ...v, product_id: newProduct.id }));
            await Variant.bulkCreate(variantData);
        }

        return res.status(201).json({ message: 'Product created successfully.', product: newProduct });
    } catch (error) {
        return res.status(500).json({ message: 'Server error creating product.', error: error.message });
    }
};

// Retrieve All Products with Associations
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [Category, Variant, ProductImage]
        });
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching products.', error: error.message });
    }
};

// Update Product Record
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await product.update(req.body);
        return res.status(200).json({ message: 'Product updated successfully.', product });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating product.', error: error.message });
    }
};

// Delete Product Record
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await product.destroy();
        return res.status(200).json({ message: 'Product removed successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting product.', error: error.message });
    }
};

const db = require('../models');

// GET /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id, {
            include: [
                { model: db.Category },
                { model: db.ProductImage },
                { model: db.Variant }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Internal server error during relationship evaluation.' });
    }
};