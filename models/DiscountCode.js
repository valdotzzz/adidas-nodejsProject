const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiscountCode = sequelize.define('DiscountCode', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true
    },
    percent_off: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Percentage discount (0–100)'
    },
    max_uses: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'null = unlimited'
    },
    times_used: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'discount_codes',
    timestamps: true
});

module.exports = DiscountCode;