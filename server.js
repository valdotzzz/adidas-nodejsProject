const express = require('express');
const db = require('./models'); // Loads all models and associations simultaneously
require('dotenv').config();

const authRoutes = require('./routes/authRoutes'); 
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');
const adminOrderRoutes = require('./routes/admin/orderRoutes');
const adminUserRoutes = require('./routes/admin/userRoutes');
const adminStockRoutes = require('./routes/admin/stockRoutes');
const discountRoutes = require('./routes/admin/discountRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const profileRoutes = require('./routes/profileRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const variantRoutes = require('./routes/variantRoutes');
const variantItemRoutes = require('./routes/variantItemRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const adminSeeder = require('./seeders/admin-seeder');
const colorSeeder = require('./seeders/20260622050000-colorways');
const sizeSeeder = require('/seeders/20260622000000-shoe-sizes.js');

// REQUIRE MISSING LOOKUP ROUTES
const colorwayRoutes = require('./routes/colorwayRoutes');
const shoeSizeRoutes = require('./routes/shoeSizeRoutes');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routing Middleware
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/stock', adminStockRoutes);
app.use('/api/admin/discounts', discountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/products/:productId/variants', variantRoutes);
app.use('/api/variants', variantItemRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/uploads', express.static('public/uploads'));

// MOUNT MISSING ROUTE INTERFACES
app.use('/api/colorways', colorwayRoutes);
app.use('/api/shoe-sizes', shoeSizeRoutes);

app.get('/', (req, res) => {
    res.send('<h1>Adidas E-Commerce API Backend is running!</h1>');
});

const PORT = process.env.PORT || 3000;

db.sequelize.sync({ alter: true })
    .then(async () => {
        await adminSeeder.up(); 
        const qi = db.sequelize.getQueryInterface();
        await sizeSeeder.up(qi);
        await colorSeeder.up(qi);

        console.log('Database sync complete.');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Database connection synchronization failure:', err);
    });