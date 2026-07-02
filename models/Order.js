const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'), defaultValue: 'pending' },

    // Shipping snapshot — same justified denormalization as Laravel's orders table
    full_name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    address_line: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    province: { type: DataTypes.STRING, allowNull: true },
    postal_code: { type: DataTypes.STRING, allowNull: true },
    payment_method: { type: DataTypes.STRING, defaultValue: 'cod' }
}, {
    paranoid: true
});



module.exports = Order;