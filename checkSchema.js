const db = require('./models');

db.sequelize.query('DESCRIBE Orders;')
    .then(([rows]) => {
        console.log('Orders columns:');
        rows.forEach(r => console.log(' -', r.Field));
        process.exit(0);
    })
    .catch(err => {
        console.error('Query failed:', err.message);
        process.exit(1);
    });