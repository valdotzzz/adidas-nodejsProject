'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE deletedAt IS NULL;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const uid = (email) => users.find(u => u.email === email)?.id;

    // Same three customer addresses the old orders seeder used to embed
    // as raw text on every single order row -- now they're one row each,
    // and Orders.address_id just points here.
    const demoAddresses = [
      { email: 'gean@customer.com', full_name: 'Gean Valdez', phone: '09171234567', address_line: '123 Rizal St',      city: 'Manila',     province: 'Metro Manila',  postal_code: '1000' },
      { email: 'jane@customer.com', full_name: 'Jane Doe',    phone: '09281234567', address_line: '45 Magsaysay Ave',  city: 'Cebu City',  province: 'Cebu',          postal_code: '6000' },
      { email: 'mark@customer.com', full_name: 'Mark Reyes',  phone: '09391234567', address_line: '78 Burgos St',      city: 'Davao City', province: 'Davao del Sur', postal_code: '8000' },
    ];

    const now = new Date();
    const rows = demoAddresses
      .filter(a => uid(a.email))
      .map(a => ({
        user_id:      uid(a.email),
        label:        'Home',
        address_type: 'shipping',
        full_name:    a.full_name,
        phone:        a.phone,
        address_line: a.address_line,
        city:         a.city,
        province:     a.province,
        postal_code:  a.postal_code,
        country:      'Philippines',
        is_default:   true,
        is_saved:     true,
        createdAt:    now,
        updatedAt:    now
      }));

    if (!rows.length) {
      throw new Error('Addresses seeder: customer users not found -- run the users seeder first.');
    }

    await queryInterface.bulkInsert('addresses', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('addresses', null, {});
  }
};
