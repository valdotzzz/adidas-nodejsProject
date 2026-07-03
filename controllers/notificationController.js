const db = require('../models');
const { Notification, Product } = db;

// GET /api/notifications — the logged-in user's notifications, newest first
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            include: [{ model: Product, attributes: ['id', 'name', 'price', 'sale_price'] }],
            order: [['createdAt', 'DESC']],
            limit: 30
        });

        return res.status(200).json(notifications);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching notifications.', error: error.message });
    }
};

// PATCH /api/notifications/:id/read — mark a single notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        notification.is_read = true;
        await notification.save();

        return res.status(200).json({ message: 'Marked as read.', notification });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating notification.', error: error.message });
    }
};

// PATCH /api/notifications/read-all — mark every notification for this user as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { is_read: true },
            { where: { user_id: req.user.id, is_read: false } }
        );

        return res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating notifications.', error: error.message });
    }
};