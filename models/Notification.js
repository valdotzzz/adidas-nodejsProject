const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        // Kept as an ENUM with only one member for now (wishlist price drops) so it's
        // simple to extend later — e.g. 'restock', 'order_status', 'promo'.
        type: DataTypes.ENUM('wishlist_sale'),
        allowNull: false,
        defaultValue: 'wishlist_sale'
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: true
});

module.exports = Notification;
