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
const CartItem = require('./CartItem');
const Review = require('./Review');
const AuditLog = require('./AuditLog');

const db = {
    User, Category, Product, ProductImage,
    Variant, Order, OrderItem, Address, CartItem, Review, AuditLog,
    sequelize, Sequelize
};

db.Category.hasMany(db.Product, { foreignKey: 'category_id', onDelete: 'RESTRICT' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.ProductImage.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.Variant, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Variant.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Order, { foreignKey: 'user_id' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });

db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

db.Variant.hasMany(db.OrderItem, { foreignKey: 'variant_id' });
db.OrderItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

db.Product.hasMany(db.Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.CartItem, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.CartItem.belongsTo(db.User, { foreignKey: 'user_id' });

db.Variant.hasMany(db.CartItem, { foreignKey: 'variant_id', onDelete: 'CASCADE' });
db.CartItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

db.User.hasMany(db.AuditLog, { foreignKey: 'user_id' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;