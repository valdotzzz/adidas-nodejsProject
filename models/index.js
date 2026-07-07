const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const User        = require('./User');
const Category    = require('./Category');
const Product     = require('./Product');
const ProductImage = require('./ProductImage');
const Colorway    = require('./Colorway');
const ShoeSize    = require('./ShoeSize');
const Variant     = require('./Variant');
const Order       = require('./Order');
const OrderItem   = require('./OrderItem');
const Address     = require('./Address');
const Review      = require('./Review');
const ReviewImage = require('./ReviewImage');
const AuditLog    = require('./AuditLog');
const Wishlist    = require('./Wishlist');
const Notification = require('./Notification');
const Announcement = require('./Announcement');
const DiscountCode        = require('./DiscountCode');
const DiscountRedemption  = require('./DiscountRedemption');

const db = {
    User, Category, Product, ProductImage,
    Colorway, ShoeSize,
    Variant, Order, OrderItem, Address,
    Review, ReviewImage, AuditLog,
    Wishlist, Notification, Announcement,
    DiscountCode, DiscountRedemption,
    sequelize, Sequelize
};

// ── Product hierarchy ──────────────────────────────────────────────────────
db.Category.hasMany(db.Product, { foreignKey: 'category_id', onDelete: 'RESTRICT' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.ProductImage.belongsTo(db.Product, { foreignKey: 'product_id' });

// ── Variant: normalized colorway + size FKs ───────────────────────────────
db.Product.hasMany(db.Variant, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Variant.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Colorway.hasMany(db.Variant, { foreignKey: 'colorway_id' });
db.Variant.belongsTo(db.Colorway, { foreignKey: 'colorway_id' });

db.ShoeSize.hasMany(db.Variant, { foreignKey: 'size_id' });
db.Variant.belongsTo(db.ShoeSize, { foreignKey: 'size_id' });

// Variant can pin one ProductImage as its hero shot (optional)
db.ProductImage.hasMany(db.Variant, { foreignKey: 'image_id', onDelete: 'SET NULL' });
db.Variant.belongsTo(db.ProductImage, { foreignKey: 'image_id', as: 'VariantImage' });

// ── Orders ─────────────────────────────────────────────────────────────────
db.User.hasMany(db.Order, { foreignKey: 'user_id', onDelete: 'RESTRICT' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });

db.Address.hasMany(db.Order, { foreignKey: 'address_id', onDelete: 'RESTRICT' });
db.Order.belongsTo(db.Address, { foreignKey: 'address_id' });

db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

// OrderItem holds variant_id + product_id FKs; price is the only snapshot field
db.Variant.hasMany(db.OrderItem, { foreignKey: 'variant_id', onDelete: 'RESTRICT' });
db.OrderItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

db.Product.hasMany(db.OrderItem, { foreignKey: 'product_id', onDelete: 'RESTRICT' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id' });

// ── Reviews ────────────────────────────────────────────────────────────────
db.Product.hasMany(db.Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id' });

db.Review.hasMany(db.ReviewImage, { foreignKey: 'review_id', onDelete: 'CASCADE' });
db.ReviewImage.belongsTo(db.Review, { foreignKey: 'review_id' });

// ── User sub-resources ─────────────────────────────────────────────────────
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

// NOTE: The cart lives in the browser (localStorage / cart-store.js) and is
// only resolved against live data via POST /api/cart/resolve. No CartItem table.

// ── Discount codes ─────────────────────────────────────────────────────────
db.DiscountCode.hasMany(db.DiscountRedemption, { foreignKey: 'code_id', onDelete: 'CASCADE' });
db.DiscountRedemption.belongsTo(db.DiscountCode, { foreignKey: 'code_id' });

db.User.hasMany(db.DiscountRedemption, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.DiscountRedemption.belongsTo(db.User, { foreignKey: 'user_id' });

db.Order.hasOne(db.DiscountRedemption, { foreignKey: 'order_id', onDelete: 'SET NULL' });
db.DiscountRedemption.belongsTo(db.Order, { foreignKey: 'order_id' });

module.exports = db;