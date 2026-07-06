const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShoeSize = sequelize.define('ShoeSize', {
    id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    us_size:    { type: DataTypes.DECIMAL(4, 1), allowNull: false },
    label:      { type: DataTypes.STRING(20),    allowNull: false },
    sort_order: { type: DataTypes.INTEGER,       allowNull: false, defaultValue: 0 }
}, {
    tableName: 'shoe_sizes',
    timestamps: false
});

module.exports = ShoeSize;