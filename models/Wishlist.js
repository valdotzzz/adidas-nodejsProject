const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }
}, {
    tableName: 'wishlists',
    timestamps: true,
    indexes: [
        // A user can only wishlist a given product once
        { unique: true, fields: ['user_id', 'product_id'] }
    ]
});

module.exports = Wishlist;
