const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    label: {
        type: DataTypes.STRING,
        defaultValue: 'Home'
    },
    address_type: {
        type: DataTypes.ENUM('shipping', 'billing', 'other'),
        defaultValue: 'shipping',
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address_line: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    province: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        defaultValue: 'Philippines'
    },
    landmark: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // True for addresses that show up in the user's saved address book.
    // False for one-off addresses entered at checkout without "save this
    // address" checked — they still need a row to satisfy Order.address_id,
    // they just don't clutter the address book.
    is_saved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'addresses',
    timestamps: true,
    paranoid: true // an address referenced by past orders must never be hard-deleted
});

module.exports = Address;