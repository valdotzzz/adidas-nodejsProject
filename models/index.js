const sequelize = require('../config/database');
const Sequelize = require('sequelize');

// Import model definitions directly
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

const db = {
    User,
    Category,
    Product,
    ProductImage,
    Variant,
    Order,       
    OrderItem,   
    Address,
    CartItem,
    Review,
    sequelize,
    Sequelize
};

// Product <-> Review (One-to-Many)
db.Product.hasMany(db.Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });

// User <-> Review (One-to-Many)
db.User.hasMany(db.Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id' });

// Define explicit model relationships
db.Category.hasMany(db.Product, { foreignKey: 'category_id', onDelete: 'RESTRICT' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.ProductImage.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.Variant, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Variant.belongsTo(db.Product, { foreignKey: 'product_id' });

// User <-> Order (One-to-Many)
db.User.hasMany(db.Order, { foreignKey: 'user_id' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });

// Order <-> OrderItem (One-to-Many)
db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

// Product <-> OrderItem (One-to-Many)
db.Variant.hasMany(db.OrderItem, { foreignKey: 'variant_id' });
db.OrderItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

//Product <-> category
db.Category.hasMany(db.Product, { foreignKey: 'category_id' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

// User <-> Address (One-to-Many)
db.User.hasMany(db.Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });

// User <-> CartItem (One-to-Many)
db.User.hasMany(db.CartItem, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.CartItem.belongsTo(db.User, { foreignKey: 'user_id' });

// Variant <-> CartItem (One-to-Many)
db.Variant.hasMany(db.CartItem, { foreignKey: 'variant_id', onDelete: 'CASCADE' });
db.CartItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

// Variant <-> OrderItem (One-to-Many) — needed since order items now reference the variant ordered
db.Variant.hasMany(db.OrderItem, { foreignKey: 'variant_id' });
db.OrderItem.belongsTo(db.Variant, { foreignKey: 'variant_id' });

module.exports = db;