const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiscountRedemption = sequelize.define('DiscountRedemption', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code_id:  { type: DataTypes.INTEGER, allowNull: false },
    user_id:  { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
    tableName: 'discount_redemptions',
    timestamps: true,
    updatedAt: false,
    indexes: [
        // One redemption per user per code
        { unique: true, fields: ['code_id', 'user_id'] }
    ]
});

module.exports = DiscountRedemption;