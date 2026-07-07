const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Variant = sequelize.define('Variant', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    stock_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
}, {
    tableName: 'variants',
    timestamps: true
});

module.exports = Variant;