'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    function daysBack(daysAgo) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(10 + Math.floor(Math.random() * 8));
      d.setMinutes(Math.floor(Math.random() * 60));
      return d;
    }

    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE deletedAt IS NULL;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = await queryInterface.sequelize.query(
      `SELECT id, name, style_code FROM products WHERE deletedAt IS NULL LIMIT 10;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users.length || !products.length) throw new Error('Reviews seeder: users or products not found.');

    const uid = (email) => users.find(u => u.email === email)?.id;
    const pid = (style)  => products.find(p => p.style_code === style)?.id;

    const geanId = uid('gean@customer.com');
    const janeId = uid('jane@customer.com');
    const markId = uid('mark@customer.com');

    const rows = [
      { user_id: geanId, product_id: pid('HQ6339'), rating: 5, comment: 'Best running shoe I have ever owned. The BOOST cushioning is unreal.', createdAt: daysBack(60) },
      { user_id: geanId, product_id: pid('B75807'), rating: 4, comment: 'Iconic silhouette, quality leather. Runs a half size small.', createdAt: daysBack(35) },
      { user_id: geanId, product_id: pid('HP2201'), rating: 5, comment: 'Premium quality, very clean look. Worth every peso.', createdAt: daysBack(10) },
      { user_id: janeId, product_id: pid('HQ6893'), rating: 5, comment: 'Absolutely love the platform sole on these. Very comfortable for all-day wear.', createdAt: daysBack(50) },
      { user_id: janeId, product_id: pid('EG4958'), rating: 4, comment: 'Classic shell toe design, but the laces came untied constantly.', createdAt: daysBack(28) },
      { user_id: janeId, product_id: pid('IG8320'), rating: 3, comment: 'Decent daily trainer but cushioning is a bit soft for speed work.', createdAt: daysBack(12) },
      { user_id: markId, product_id: pid('HQ1419'), rating: 5, comment: 'James Harden signature shoes deliver on court. Excellent traction.', createdAt: daysBack(45) },
      { user_id: markId, product_id: pid('ID5660'), rating: 4, comment: 'Dame 8s are responsive and lightweight. Good value.', createdAt: daysBack(20) },
      { user_id: markId, product_id: pid('HP4316'), rating: 4, comment: 'NMD_R1 V3 is very comfortable for casual wear. Great colorway options.', createdAt: daysBack(5) },
    ].filter(r => r.user_id && r.product_id) // skip any that failed to resolve
     .map(r => ({ ...r, updatedAt: r.createdAt }));

    if (rows.length) await queryInterface.bulkInsert('reviews', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('reviews', null, {});
  }
};