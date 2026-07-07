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
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    is_exclusive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // ── Sale pricing ───────────────────────────────────────────────────────────
    // sale_type + sale_value describe *how* the sale is configured.
    // sale_price is the derived result (auto-computed in the beforeSave hook below).
    // All existing code that reads sale_price continues to work untouched.

    sale_type: {
        type: DataTypes.ENUM('none', 'percent', 'amount', 'fixed'),
        allowNull: false,
        defaultValue: 'none'
    },
    sale_value: {
        // Meaning depends on sale_type:
        //   percent  -> percentage off (e.g. 20 = 20% off)
        //   amount   -> fixed amount subtracted (e.g. 500 = ₱500 off)
        //   fixed    -> exact sale price (e.g. 2999 = ₱2,999)
        //   none     -> ignored
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    sale_price: {
        // Derived / stored. Kept so ALL existing reads (checkout effectivePrice,
        // storefront JS, admin table) require zero changes.
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    tableName: 'products',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeSave(product) {
            const price = parseFloat(product.price) || 0;
            const val   = parseFloat(product.sale_value) || 0;

            switch (product.sale_type) {
                case 'percent':
                    product.sale_price = val > 0 && val < 100
                        ? Math.max(0, Math.round((price * (1 - val / 100)) * 100) / 100)
                        : null;
                    break;
                case 'amount':
                    product.sale_price = val > 0
                        ? Math.max(0, Math.round((price - val) * 100) / 100)
                        : null;
                    break;
                case 'fixed':
                    product.sale_price = val > 0 && val < price
                        ? Math.round(val * 100) / 100
                        : null;
                    break;
                default: // 'none'
                    product.sale_price = null;
            }
        }
    }
});

module.exports = Product;