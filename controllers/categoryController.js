const { Category, Product } = require('../models');

// Retrieve all categories (used by the storefront filters and the admin dropdown)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching categories.', error: error.message });
    }
};

// Retrieve a single category
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        return res.status(200).json(category);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching category.', error: error.message });
    }
};

// Create a category
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const existing = await Category.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({ message: 'A category with this name already exists.' });
        }

        const category = await Category.create({ name: name.trim() });
        return res.status(201).json({ message: 'Category created successfully.', category });
    } catch (error) {
        return res.status(500).json({ message: 'Server error creating category.', error: error.message });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        await category.update({ name: req.body.name });
        return res.status(200).json({ message: 'Category updated successfully.', category });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating category.', error: error.message });
    }
};

// Delete a category — blocked if products still reference it (matches the
// onDelete: 'RESTRICT' foreign key on Product.category_id)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        const productsUsingCategory = await Product.count({ where: { category_id: category.id } });
        if (productsUsingCategory > 0) {
            return res.status(400).json({
                message: `Cannot delete this category — ${productsUsingCategory} product(s) are still assigned to it.`
            });
        }

        await category.destroy();
        return res.status(200).json({ message: 'Category removed successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting category.', error: error.message });
    }
};