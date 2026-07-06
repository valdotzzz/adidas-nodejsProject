'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // -- helpers --------------------------------------------------------------

    function daysBack(daysAgo) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(Math.floor(Math.random() * 12) + 8); // 08:00 - 19:59
      d.setMinutes(Math.floor(Math.random() * 60));
      return d;
    }

    // Resolve real PKs by email / style_code so the seeder is environment-safe
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE deletedAt IS NULL;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const addresses = await queryInterface.sequelize.query(
      `SELECT id, user_id FROM addresses WHERE deletedAt IS NULL;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const variants = await queryInterface.sequelize.query(
      `SELECT v.id, v.colorway, v.size_type, v.size_value, v.product_id,
              p.name AS product_name, p.price, p.sale_price, p.style_code
       FROM variants v JOIN products p ON v.product_id = p.id
       WHERE v.stock_level > 0;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users.length || !variants.length) {
      throw new Error('Orders seeder: users or variants not found -- run prior seeders first.');
    }
    if (!addresses.length) {
      throw new Error('Orders seeder: addresses not found -- run the demo-addresses seeder first.');
    }

    const uid  = (email) => users.find(u => u.email === email)?.id;
    const pick = (arr)   => arr[Math.floor(Math.random() * arr.length)];
    const addressForUser = (userId) => addresses.find(a => a.user_id === userId)?.id;
    const effectivePrice = (v) => {
      const price = parseFloat(v.price);
      const sale = v.sale_price !== null && v.sale_price !== undefined ? parseFloat(v.sale_price) : null;
      return (sale !== null && sale < price) ? sale : price;
    };

    const statuses = [
      'completed','completed','completed','completed','completed',
      'completed','pending','pending','cancelled'
    ];
    const paymentMethods = ['cod', 'gcash', 'paypal', 'credit_card'];
    const discountTypes = ['none', 'none', 'none', 'none', 'pwd', 'senior']; // ~1/3 have a discount

    const customerIds = [
      uid('gean@customer.com'),
      uid('jane@customer.com'),
      uid('mark@customer.com'),
    ].filter(Boolean);

    if (!customerIds.length) throw new Error('Customer users not found -- seed users first.');

    // 60 orders spread across the past 90 days
    const orderDays = [
      1,1,2,2,3,3,4,4,5,5,6,6,7,7,
      9,10,12,14,16,18,20,22,24,26,28,30,
      35,40,45,50,55,60,65,70,75,80,85,90,
      1,2,3,4,5,6,7,1,2,3
    ];

    const orderRows = [];
    const orderItemBatches = []; // parallel array of { items, discountType }

    orderDays.forEach((daysAgo) => {
      const orderDate  = daysBack(daysAgo);
      const status     = pick(statuses);
      const userId     = pick(customerIds);
      const addressId  = addressForUser(userId);
      const discountType = pick(discountTypes);
      const numItems   = Math.floor(Math.random() * 3) + 1; // 1-3 items per order

      const items = [];
      let subtotal = 0;
      for (let j = 0; j < numItems; j++) {
        const v     = pick(variants);
        const qty   = Math.floor(Math.random() * 2) + 1;
        const price = effectivePrice(v);
        subtotal += price * qty;
        items.push({ v, qty, price });
      }

      const discountAmount = discountType !== 'none' ? Math.round(subtotal * 0.20 * 100) / 100 : 0;
      const shippingFee    = subtotal >= 3000 ? 0 : 150;
      const total           = Math.max(subtotal - discountAmount, 0) + shippingFee;

      orderRows.push({
        user_id:             userId,
        address_id:          addressId,
        status,
        payment_method:      pick(paymentMethods),
        discount_type:       discountType,
        discount_id_number:  discountType !== 'none' ? 'DISC-' + Math.floor(100000 + Math.random() * 900000) : null,
        discount_amount:     discountAmount,
        shipping_fee:        shippingFee,
        total_amount:        parseFloat(total.toFixed(2)),
        createdAt:           orderDate,
        updatedAt:           orderDate
      });

      orderItemBatches.push(items);
    });

    await queryInterface.bulkInsert('Orders', orderRows, {});

    const insertedOrders = await queryInterface.sequelize.query(
      `SELECT id, createdAt FROM \`Orders\` ORDER BY id ASC LIMIT ${orderRows.length};`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const orderItemRows = [];
    insertedOrders.forEach((order, i) => {
      const items = orderItemBatches[i];
      items.forEach(({ v, qty, price }) => {
        orderItemRows.push({
          order_id:   order.id,
          product_id: v.product_id,
          variant_id: v.id,
          price,
          quantity:   qty,
          createdAt:  order.createdAt,
          updatedAt:  order.createdAt
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