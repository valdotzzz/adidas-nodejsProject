const { Address } = require('../models');

// GET /api/addresses — list the logged-in user's addresses
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.findAll({
            where: { user_id: req.user.id, is_saved: true },
            order: [['is_default', 'DESC'], ['createdAt', 'DESC']]
        });
        return res.status(200).json(addresses);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching addresses.', error: error.message });
    }
};

// POST /api/addresses — add a new address
exports.createAddress = async (req, res) => {
    try {
        const { label, address_type, full_name, phone, address_line, city, province, postal_code, country, landmark } = req.body;

        if (!full_name || !phone || !address_line || !city) {
            return res.status(400).json({ message: 'Recipient name, phone, street address, and city are required.' });
        }

        // The very first address a customer saves automatically becomes their default
        const existingCount = await Address.count({ where: { user_id: req.user.id } });

        const address = await Address.create({
            label: label || 'Home',
            address_type: address_type || 'shipping',
            full_name,
            phone,
            address_line,
            city,
            province,
            postal_code,
            country: country || 'Philippines',
            landmark,
            user_id: req.user.id,
            is_default: existingCount === 0
        });

        return res.status(201).json({ message: 'Address saved successfully.', address });
    } catch (error) {
        return res.status(500).json({ message: 'Server error saving address.', error: error.message });
    }
};

// PATCH /api/addresses/:id — update an address
exports.updateAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!address) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        const { label, address_type, full_name, phone, address_line, city, province, postal_code, country, landmark } = req.body;
        await address.update({ label, address_type, full_name, phone, address_line, city, province, postal_code, country, landmark });

        return res.status(200).json({ message: 'Address updated successfully.', address });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating address.', error: error.message });
    }
};

// DELETE /api/addresses/:id — remove an address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!address) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        const wasDefault = address.is_default;
        await address.destroy();

        // Hand the default badge to another saved address, if one exists
        if (wasDefault) {
            const next = await Address.findOne({ where: { user_id: req.user.id } });
            if (next) {
                next.is_default = true;
                await next.save();
            }
        }

        return res.status(200).json({ message: 'Address removed successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting address.', error: error.message });
    }
};

// PATCH /api/addresses/:id/default — mark an address as the default
exports.setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!address) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
        address.is_default = true;
        await address.save();

        return res.status(200).json({ message: 'Default address updated.', address });
    } catch (error) {
        return res.status(500).json({ message: 'Server error setting default address.', error: error.message });
    }
};