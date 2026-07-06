const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Admin-managed promotional / informational popups shown on the storefront.
// Only one is surfaced to shoppers at a time — the most recently created
// announcement that is currently active and inside its date window (see
// announcementController.getActiveAnnouncement).
const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    link_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Shop Now'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    // Optional scheduling window. Null start_date = active immediately,
    // null end_date = runs indefinitely (until toggled off).
    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'announcements',
    timestamps: true
});

module.exports = Announcement;