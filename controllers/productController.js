const db = require('../models');
const { Product, Variant, ProductImage, Category, Wishlist, Notification } = db;

// Fires whenever a product update lowers/adds a sale_price such that the product just
// became "on sale" (it wasn't before, or the discount just deepened for the first time
// coming off a non-sale price). Notifies everyone who has it wishlisted.
async function notifyWishlistersIfNewlyOnSale(product, previousSalePrice) {
    const wasOnSale = previousSalePrice != null && parseFloat(previousSalePrice) < parseFloat(product.price);
    const isOnSaleNow = product.sale_price != null && parseFloat(product.sale_price) < parseFloat(product.price);

    if (!isOnSaleNow || wasOnSale) return; // only notify on the transition into "on sale"

    const wishlisters = await Wishlist.findAll({ where: { product_id: product.id } });
    if (wishlisters.length === 0) return;

    const message = `${product.name} is now on sale for ₱${parseFloat(product.sale_price).toFixed(2)} (was ₱${parseFloat(product.price).toFixed(2)}).`;

    await Notification.bulkCreate(
        wishlisters.map(w => ({
            user_id: w.user_id,
            product_id: product.id,
            type: 'wishlist_sale',
            message
        }))
    );
}

// Accepts a comma- or newline-separated string of image URLs and returns a
// clean array, dropping blanks and anything that isn't a plausible http(s) URL.
function parseImageUrls(raw) {
    if (!raw) return [];
    return String(raw)
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => /^https?:\/\//i.test(s));
}

// Create Product with Variants (Fulfills partial MP1/MP2)
exports.createProduct = async (req, res) => {
    try {
        // Ensure category_id is pulled from the payload request body
        const { name, style_code, description, price, gender, category_id, is_exclusive, sale_price, is_hidden, variants } = req.body;

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
            sale_price: sale_price ? sale_price : null,
            category_id,
            is_hidden: is_hidden === true || is_hidden === 'true' || is_hidden === '1'
        });
        
        // Save uploaded image files, if any
        if (req.files && req.files.length > 0) {
            const imageData = req.files.map(file => ({
                product_id: newProduct.id,
                image_path: `/uploads/${file.filename}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
            await ProductImage.bulkCreate(imageData);
        }

        // Save any pasted image URLs, if provided (comma or newline separated)
        const urlImages = parseImageUrls(req.body.image_urls);
        if (urlImages.length > 0) {
            const imageData = urlImages.map(url => ({
                product_id: newProduct.id,
                image_path: url,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
            await ProductImage.bulkCreate(imageData);
        }

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
// Admin/staff see all products (including hidden); everyone else sees only visible ones.
exports.getAllProducts = async (req, res) => {
    try {
        const isAdminOrStaff = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
        const where = isAdminOrStaff ? {} : { is_hidden: false };
        const products = await Product.findAll({
            where,
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

        // Only the actual product fields go through .update() — image-related
        // keys are handled separately below so they don't get written onto
        // the Product row itself.
        const { image_urls, remove_image_ids, ...productFields } = req.body;

        // FormData sends an empty string when the admin clears the Sale Price field —
        // normalize that to null so the DECIMAL column (and "on sale" checks) behave.
        if (productFields.sale_price === '') {
            productFields.sale_price = null;
        }

        // Normalize is_hidden from FormData strings to a real boolean.
        if ('is_hidden' in productFields) {
            productFields.is_hidden = productFields.is_hidden === true || productFields.is_hidden === 'true' || productFields.is_hidden === '1';
        }

        // Snapshot the previous sale_price so we can tell, after saving, whether this
        // update just *put the product on sale* (as opposed to it already being on sale).
        const previousSalePrice = product.sale_price;
        await product.update(productFields);
        notifyWishlistersIfNewlyOnSale(product, previousSalePrice).catch(err =>
            console.error('Wishlist sale notification failed:', err.message)
        );

        // Save newly uploaded image files, if any
        if (req.files && req.files.length > 0) {
            const imageData = req.files.map(file => ({
                product_id: product.id,
                image_path: `/uploads/${file.filename}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
            await ProductImage.bulkCreate(imageData);
        }

        // Save any newly pasted image URLs, if provided
        const urlImages = parseImageUrls(image_urls);
        if (urlImages.length > 0) {
            const imageData = urlImages.map(url => ({
                product_id: product.id,
                image_path: url,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
            await ProductImage.bulkCreate(imageData);
        }

        // Remove any images the admin explicitly unchecked/deleted
        if (remove_image_ids) {
            let ids = remove_image_ids;
            if (typeof ids === 'string') {
                try { ids = JSON.parse(ids); } catch { ids = ids.split(',').map(s => s.trim()); }
            }
            ids = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
            if (ids.length > 0) {
                await ProductImage.destroy({ where: { id: ids, product_id: product.id } });
            }
        }

        const updatedProduct = await Product.findByPk(id, { include: [Category, Variant, ProductImage] });
        return res.status(200).json({ message: 'Product updated successfully.', product: updatedProduct });
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

// GET /api/products/trash — list soft-deleted products (admin/staff)
exports.getDeletedProducts = async (req, res) => {
    try {
        const products = await db.Product.findAll({
            where: { deletedAt: { [require('sequelize').Op.ne]: null } },
            paranoid: false,
            include: [db.Category, db.Variant, db.ProductImage]
        });
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching deleted products.', error: error.message });
    }
};

// PATCH /api/products/:id/restore — undo a soft delete (admin/staff)
exports.restoreProduct = async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id, { paranoid: false });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        if (!product.deletedAt) {
            return res.status(400).json({ message: 'This product is not deleted.' });
        }

        await product.restore();
        return res.status(200).json({ message: 'Product restored successfully.', product });
    } catch (error) {
        return res.status(500).json({ message: 'Server error restoring product.', error: error.message });
    }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id, {
            include: [
                { model: db.Category },
                { model: db.ProductImage },
                { 
                    model: db.Variant,
                    include: [
                        { model: db.Colorway },
                        { model: db.ShoeSize },
                        { model: db.ProductImage, as: 'VariantImage' }
                    ]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Hidden products are invisible on the storefront; only admin/staff can fetch them directly.
        const isAdminOrStaff = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
        if (product.is_hidden && !isAdminOrStaff) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Internal server error during relationship evaluation.', error: error.message });
    }
};
// PATCH /api/products/:id/visibility — flip is_hidden (admin/staff)
exports.toggleVisibility = async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found.' });
        await product.update({ is_hidden: !product.is_hidden });
        return res.status(200).json({
            message: product.is_hidden ? 'Product hidden from storefront.' : 'Product visible on storefront.',
            product
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error toggling visibility.', error: error.message });
    }
};