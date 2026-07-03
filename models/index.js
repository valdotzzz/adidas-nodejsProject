const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Variant = require('./Variant');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Address = require('./Address');
const Review = require('./Review');
const AuditLog = require('./AuditLog');
const Wishlist = require('./Wishlist');
const Notification = require('./Notification');

const db = {
    User, Category, Product, ProductImage,
    Variant, Order, OrderItem, Address, Review, AuditLog,
    Wishlist, Notification,
    sequelize, Sequelize
};

db.Category.hasMany(db.Product, { foreignKey: 'category_id', onDelete: 'RESTRICT' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.ProductImage.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.Variant, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Variant.belongsTo(db.Product, { foreignKey: 'product_id' });

// -- Orders: customer/shipping info reached ONLY through FKs, never copied --
db.User.hasMany(db.Order, { foreignKey: 'user_id', onDelete: 'RESTRICT' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });

db.Address.hasMany(db.Order, { foreignKey: 'address_id', onDelete: 'RESTRICT' });
db.Order.belongsTo(db.Address, { foreignKey: 'address_id' });

db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

// -- Order items: FK to both the exact variant purchased and its product --
db.Variant.hasMany(db.OrderItem, { foreignKey: 'variant_id', onDelete: 'RESTRICT' });
db.OrderItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

db.Product.hasMany(db.OrderItem, { foreignKey: 'product_id', onDelete: 'RESTRICT' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.AuditLog, { foreignKey: 'user_id' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Wishlist, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Wishlist.belongsTo(db.User, { foreignKey: 'user_id' });

db.Product.hasMany(db.Wishlist, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Wishlist.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });

db.Product.hasMany(db.Notification, { foreignKey: 'product_id', onDelete: 'SET NULL' });
db.Notification.belongsTo(db.Product, { foreignKey: 'product_id' });

// NOTE: CartItem/cart_items is intentionally gone. The cart now lives in the
// browser (localStorage, see public/js/cart-store.js) and is only resolved
// against live product/variant data via POST /api/cart/resolve -- it never
// hits the database until checkout actually creates real Order/OrderItem rows.

module.exports = db;