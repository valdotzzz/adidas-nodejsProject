const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Snapshot fields — justified denormalization:
    // if the product/price/name changes later, past receipts must stay frozen in time.
    product_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    colorway: {
        type: DataTypes.STRING,
        allowNull: true
    },
    size_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    size_value: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'order_items',
    timestamps: true
});

module.exports = OrderItem;