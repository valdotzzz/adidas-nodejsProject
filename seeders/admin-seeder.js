const { User } = require('../models');
const bcrypt = require('bcryptjs');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const adminEmail = 'admin@adidas.com';
        
        // Check if user exists
        const adminExists = await User.findOne({ where: { email: adminEmail } });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            console.log('Hardcoded admin user created.');
        } else {
            console.log('Admin user already exists.');
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove the specific hardcoded admin user
        await User.destroy({
            where: { email: 'admin@adidas.com' }
        });
        console.log('Hardcoded admin user removed.');
    }
};