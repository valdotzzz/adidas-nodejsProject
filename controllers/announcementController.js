const { Announcement } = require('../models');
const { Op } = require('sequelize');

// GET /api/announcements/active — public. Returns the single most recent
// announcement that is active AND currently inside its scheduling window,
// or null if there's nothing to show right now.
exports.getActiveAnnouncement = async (req, res) => {
    try {
        const now = new Date();

        const announcement = await Announcement.findOne({
            where: {
                is_active: true,
                [Op.and]: [
                    { [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: now } }] },
                    { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: now } }] }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(announcement || null);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching active announcement.', error: error.message });
    }
};

// GET /api/announcements — admin/staff. Every announcement, newest first.
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(announcements);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching announcements.', error: error.message });
    }
};

// GET /api/announcements/:id — admin/staff. Single announcement (for edit form prefill).
exports.getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }
        return res.status(200).json(announcement);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching announcement.', error: error.message });
    }
};

// POST /api/announcements — admin/staff.
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, link_url, link_text, is_active, start_date, end_date } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Announcement message is required.' });
        }

        const announcement = await Announcement.create({
            title: title ? title.trim() : null,
            message: message.trim(),
            link_url: link_url ? link_url.trim() : null,
            link_text: link_text && link_text.trim() ? link_text.trim() : 'Shop Now',
            is_active: is_active === undefined ? true : !!is_active,
            start_date: start_date || null,
            end_date: end_date || null
        });

        return res.status(201).json({ message: 'Announcement created successfully.', announcement });
    } catch (error) {
        return res.status(500).json({ message: 'Server error creating announcement.', error: error.message });
    }
};

// PUT /api/announcements/:id — admin/staff.
exports.updateAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }

        const { title, message, link_url, link_text, is_active, start_date, end_date } = req.body;

        if (message !== undefined && !message.trim()) {
            return res.status(400).json({ message: 'Announcement message cannot be empty.' });
        }

        await announcement.update({
            title: title !== undefined ? (title ? title.trim() : null) : announcement.title,
            message: message !== undefined ? message.trim() : announcement.message,
            link_url: link_url !== undefined ? (link_url ? link_url.trim() : null) : announcement.link_url,
            link_text: link_text !== undefined ? (link_text && link_text.trim() ? link_text.trim() : 'Shop Now') : announcement.link_text,
            is_active: is_active !== undefined ? !!is_active : announcement.is_active,
            start_date: start_date !== undefined ? (start_date || null) : announcement.start_date,
            end_date: end_date !== undefined ? (end_date || null) : announcement.end_date
        });

        return res.status(200).json({ message: 'Announcement updated successfully.', announcement });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating announcement.', error: error.message });
    }
};

// DELETE /api/announcements/:id — admin only.
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }

        await announcement.destroy();
        return res.status(200).json({ message: 'Announcement removed successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting announcement.', error: error.message });
    }
};