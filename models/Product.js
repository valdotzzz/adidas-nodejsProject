const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    style_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('men', 'women', 'unisex', 'kids'),
        allowNull: false
    },
    category_id: { // <-- ADD THIS FOREIGN KEY PROPERTY
        type: DataTypes.INTEGER,
        allowNull: true, 
        references: {
            model: 'categories', // Matches your category table name
            key: 'id'
        }
    },
    is_exclusive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Simple sale flag for now: when set (and lower than `price`), the product is "on sale".
    // This is deliberately minimal — a fuller SaleEvent/collection system can plug into this
    // same field later without breaking anything that reads it.
    sale_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    tableName: 'products',
    timestamps: true,
    paranoid: true
});

module.exports = Product;