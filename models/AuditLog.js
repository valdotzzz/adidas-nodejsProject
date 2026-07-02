const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // 'admin' | 'staff' | 'customer'
    category: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    // JSON snapshot of before/after or relevant entity (optional)
    meta: { type: DataTypes.JSON, allowNull: true }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false
});

module.exports = AuditLog;