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

const db = {
    User,
    Category,
    Product,
    ProductImage,
    Variant,
    Order,       
    OrderItem,   
    sequelize,
    Sequelize
};

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
db.Product.hasMany(db.OrderItem, { foreignKey: 'product_id' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id' });

//Product <-> category
db.Category.hasMany(db.Product, { foreignKey: 'category_id' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

module.exports = db;