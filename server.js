const express = require('express');
const db = require('./models'); // Loads all models and associations simultaneously
require('dotenv').config();

const authRoutes = require('./routes/authRoutes'); 
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');
const adminOrderRoutes = require('./routes/admin/orderRoutes');
const adminUserRoutes = require('./routes/admin/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const profileRoutes = require('./routes/profileRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const variantRoutes = require('./routes/variantRoutes');
const variantItemRoutes = require('./routes/variantItemRoutes');


const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routing Middleware
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/products/:productId/variants', variantRoutes);
app.use('/api/variants', variantItemRoutes);
app.use('/uploads', express.static('public/uploads'));


// ...
app.get('/', (req, res) => {
    res.send('<h1>Adidas E-Commerce API Backend is running!</h1>');
});

const PORT = process.env.PORT || 3000;

// Sync database schema using the centralized model definitions
db.sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database connected and relational models synced successfully.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection synchronization failure:', err);
    });