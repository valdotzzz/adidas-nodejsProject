'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // ── helpers ──────────────────────────────────────────────────────────────

    // Returns a Date that is `daysAgo` days before now, with a random hour
    function daysBack(daysAgo) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(Math.floor(Math.random() * 12) + 8); // 08:00 – 19:59
      d.setMinutes(Math.floor(Math.random() * 60));
      return d;
    }

    // Resolve real PKs by email / style_code so the seeder is environment-safe
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE deletedAt IS NULL;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const variants = await queryInterface.sequelize.query(
      `SELECT v.id, v.colorway, v.size_type, v.size_value, v.product_id,
              p.name AS product_name, p.price, p.style_code
       FROM variants v JOIN products p ON v.product_id = p.id
       WHERE v.stock_level > 0;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users.length || !variants.length) {
      throw new Error('Orders seeder: users or variants not found — run prior seeders first.');
    }

    const uid  = (email) => users.find(u => u.email === email)?.id;
    const pick = (arr)   => arr[Math.floor(Math.random() * arr.length)];

    // Status distribution weighted toward realistic spread
    const statuses = [
      'completed','completed','completed','completed','completed',
      'completed','pending','pending','cancelled'
    ];

    // Shipping snapshots (not FK'd — intentional receipt freeze pattern)
    const addresses = [
      { full_name: 'Gean Valdez',  phone: '09171234567', address_line: '123 Rizal St', city: 'Manila',    province: 'Metro Manila', postal_code: '1000' },
      { full_name: 'Jane Doe',     phone: '09281234567', address_line: '45 Magsaysay Ave', city: 'Cebu City', province: 'Cebu',        postal_code: '6000' },
      { full_name: 'Mark Reyes',   phone: '09391234567', address_line: '78 Burgos St',  city: 'Davao City', province: 'Davao del Sur',postal_code: '8000' },
    ];

    const paymentMethods = ['cod', 'gcash', 'paypal', 'credit_card'];

    // ── build order + orderItem rows ─────────────────────────────────────────

    // 60 orders spread across the past 90 days
    // Distribution: ~25 in last 7d, ~20 in 8-30d, ~15 beyond 30d
    const orderDays = [
      // last 7 days — lots of activity
      1,1,2,2,3,3,4,4,5,5,6,6,7,7,
      // 8–30 days
      9,10,12,14,16,18,20,22,24,26,28,30,
      // 31–90 days — older history
      35,40,45,50,55,60,65,70,75,80,85,90,
      // extra recent orders to spike the bar chart
      1,2,3,4,5,6,7,1,2,3
    ];

    const customerIds = [
      uid('gean@customer.com'),
      uid('jane@customer.com'),
      uid('mark@customer.com'),
    ].filter(Boolean);

    if (!customerIds.length) throw new Error('Customer users not found — seed users first.');

    const orderRows    = [];
    const orderItemBatches = []; // [{orderIndex, items:[]}]

    orderDays.forEach((daysAgo, i) => {
      const orderDate  = daysBack(daysAgo);
      const addr       = pick(addresses);
      const status     = pick(statuses);
      const userId     = pick(customerIds);
      const numItems   = Math.floor(Math.random() * 3) + 1; // 1–3 items per order
      const items      = [];
      let   total      = 0;

      for (let j = 0; j < numItems; j++) {
        const v   = pick(variants);
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = parseFloat(v.price);
        total += price * qty;
        items.push({ v, qty, price });
      }

      orderRows.push({
        user_id:        userId,
        status,
        total_amount:   parseFloat(total.toFixed(2)),
        full_name:      addr.full_name,
        phone:          addr.phone,
        address_line:   addr.address_line,
        city:           addr.city,
        province:       addr.province,
        postal_code:    addr.postal_code,
        payment_method: pick(paymentMethods),
        createdAt:      orderDate,
        updatedAt:      orderDate
      });

      orderItemBatches.push(items);
    });

    await queryInterface.bulkInsert('Orders', orderRows, {});

    // Re-fetch the inserted orders to get their real IDs (in insertion order)
    const insertedOrders = await queryInterface.sequelize.query(
      `SELECT id, createdAt FROM \`Orders\` ORDER BY id ASC LIMIT ${orderRows.length};`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const orderItemRows = [];
    insertedOrders.forEach((order, i) => {
      const items = orderItemBatches[i];
      items.forEach(({ v, qty, price }) => {
        orderItemRows.push({
          order_id:     order.id,
          variant_id:   v.id,
          product_name: v.product_name,
          colorway:     v.colorway,
          size_type:    v.size_type,
          size_value:   v.size_value,
          price,
          quantity:     qty,
          createdAt:    order.createdAt,
          updatedAt:    order.createdAt
        });
      });
    });

    await queryInterface.bulkInsert('order_items', orderItemRows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('order_items', null, {});
    await queryInterface.bulkDelete('Orders', null, {});
  }
};