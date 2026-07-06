const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Colorway = sequelize.define('Colorway', {
    id:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true }
}, {
    tableName: 'colorways',
    timestamps: true
});

module.exports = Colorway;