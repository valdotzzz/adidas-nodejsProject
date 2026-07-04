const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReviewImage = sequelize.define('ReviewImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    image_path: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'review_images',
    timestamps: true
});

module.exports = ReviewImage;