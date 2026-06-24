const express = require('express');
const db = require('./models'); // Loads all models and associations simultaneously
require('dotenv').config();

const authRoutes = require('./routes/authRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routing Middleware
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
    res.send('<h1>Adidas E-Commerce API Backend is running!</h1>');
});

const PORT = process.env.PORT || 3000;

// Sync database schema using the centralized model definitions
db.sequelize.sync({ force: false }) 
    .then(() => {
        console.log('Database connected and relational models synced successfully.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection synchronization failure:', err);
    });