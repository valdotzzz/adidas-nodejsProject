const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    // Derived from order_items after they're saved — never trusted from the client.
    // See checkoutController.recalculateOrderTotal().
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    shipping_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    discount_type: { type: DataTypes.ENUM('none', 'pwd', 'senior'), allowNull: false, defaultValue: 'none' },
    discount_id_number: { type: DataTypes.STRING, allowNull: true },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    // Discount code applied at checkout (mutually exclusive with pwd/senior)
    discount_code_id: { type: DataTypes.INTEGER, allowNull: true },
    discount_code_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    status: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'), defaultValue: 'pending' },
    payment_method: { type: DataTypes.STRING, defaultValue: 'cod' }

    // NOTE: no full_name/phone/address_line/city/province/postal_code here.
    // Shipping/customer info is read through the address_id -> Address -> User
    // chain (see models/index.js) instead of being copied onto every order.
}, {
    paranoid: true
});

module.exports = Order;