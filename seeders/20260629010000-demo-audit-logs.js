'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    function daysBack(daysAgo, hourOffset = 0) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(9 + hourOffset);
      d.setMinutes(Math.floor(Math.random() * 60));
      return d;
    }

    const users = await queryInterface.sequelize.query(
      `SELECT id, email, role FROM users WHERE deletedAt IS NULL;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const uid = (email) => users.find(u => u.email === email)?.id || null;

    const adminId    = uid('admin@adidas.com');
    const staffId    = uid('staff@adidas.com');
    const customerId = uid('gean@customer.com');

    const logs = [
      // ── ADMIN actions ──────────────────────────────────────────────────────
      { user_id: adminId, category: 'admin', action: 'Created product',      description: 'Added new product: Ultraboost Light (HQ6339)',           createdAt: daysBack(88, 0) },
      { user_id: adminId, category: 'admin', action: 'Created product',      description: 'Added new product: Samba OG Black (B75807)',             createdAt: daysBack(75, 1) },
      { user_id: adminId, category: 'admin', action: 'Created category',     description: 'Created category: Running',                              createdAt: daysBack(90, 0) },
      { user_id: adminId, category: 'admin', action: 'Created category',     description: 'Created category: Lifestyle',                            createdAt: daysBack(90, 1) },
      { user_id: adminId, category: 'admin', action: 'Created category',     description: 'Created category: Basketball',                           createdAt: daysBack(90, 2) },
      { user_id: adminId, category: 'admin', action: 'Updated product',      description: 'Edited product price: Ultraboost Light → ₱10,000',      createdAt: daysBack(60, 2) },
      { user_id: adminId, category: 'admin', action: 'Updated user role',    description: 'Changed role of staff@adidas.com from customer → staff', createdAt: daysBack(55, 3) },
      { user_id: adminId, category: 'admin', action: 'Toggled user status',  description: 'Deactivated account: jane@customer.com',                 createdAt: daysBack(40, 0) },
      { user_id: adminId, category: 'admin', action: 'Toggled user status',  description: 'Reactivated account: jane@customer.com',                 createdAt: daysBack(38, 1) },
      { user_id: adminId, category: 'admin', action: 'Deleted product',      description: 'Soft-deleted product ID #7 (Response Runner)',           createdAt: daysBack(30, 4) },
      { user_id: adminId, category: 'admin', action: 'Deleted order',        description: 'Soft-deleted order #000003 (test/duplicate)',            createdAt: daysBack(20, 2) },
      { user_id: adminId, category: 'admin', action: 'Updated product',      description: 'Updated stock description on Forum Low (FY7756)',        createdAt: daysBack(10, 1) },
      { user_id: adminId, category: 'admin', action: 'Created product',      description: 'Added new product: Cross Em Up 5 Wide (GW7235)',         createdAt: daysBack(5,  0) },
      { user_id: adminId, category: 'admin', action: 'Deleted user',         description: 'Soft-deleted user account ID #9',                       createdAt: daysBack(2,  3) },
      { user_id: adminId, category: 'admin', action: 'Updated user role',    description: 'Promoted mark@customer.com to staff',                    createdAt: daysBack(1,  0) },

      // ── STAFF actions ──────────────────────────────────────────────────────
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000005 marked as completed',                      createdAt: daysBack(85, 1) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000008 marked as completed',                      createdAt: daysBack(70, 2) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000012 marked as cancelled — customer request',   createdAt: daysBack(65, 3) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000015 marked as completed',                      createdAt: daysBack(50, 1) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000018 marked as completed',                      createdAt: daysBack(45, 0) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000020 marked as cancelled — out of stock',       createdAt: daysBack(35, 2) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000023 marked as completed',                      createdAt: daysBack(25, 1) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000027 marked as completed',                      createdAt: daysBack(15, 3) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000031 marked as completed',                      createdAt: daysBack(7,  1) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000035 marked as pending — payment pending',      createdAt: daysBack(5,  2) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000038 marked as completed',                      createdAt: daysBack(3,  0) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000041 marked as cancelled — fraud flag',         createdAt: daysBack(2,  1) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000044 marked as completed',                      createdAt: daysBack(1,  2) },
      { user_id: staffId, category: 'staff', action: 'Updated order status', description: 'Order #000047 marked as completed',                      createdAt: daysBack(0,  0) },

      // ── CUSTOMER actions ───────────────────────────────────────────────────
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000001 — ₱10,000.00',           createdAt: daysBack(87, 2) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000004 — ₱7,500.00',            createdAt: daysBack(72, 1) },
      { user_id: customerId, category: 'customer', action: 'Submitted review',    description: 'Reviewed product: Ultraboost Light — 5 stars',          createdAt: daysBack(60, 3) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000009 — ₱5,500.00',            createdAt: daysBack(55, 0) },
      { user_id: customerId, category: 'customer', action: 'Updated profile',     description: 'Customer updated shipping address',                     createdAt: daysBack(50, 1) },
      { user_id: customerId, category: 'customer', action: 'Cancelled order',     description: 'Customer self-cancelled order #000012 (before ship)',   createdAt: daysBack(48, 2) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000016 — ₱13,000.00',           createdAt: daysBack(40, 0) },
      { user_id: customerId, category: 'customer', action: 'Submitted review',    description: 'Reviewed product: Samba OG Black — 4 stars',            createdAt: daysBack(35, 1) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000022 — ₱8,500.00',            createdAt: daysBack(22, 2) },
      { user_id: customerId, category: 'customer', action: 'Updated password',    description: 'Customer changed account password',                     createdAt: daysBack(20, 0) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000029 — ₱6,000.00',            createdAt: daysBack(14, 1) },
      { user_id: customerId, category: 'customer', action: 'Submitted review',    description: 'Reviewed product: Stan Smith Lux — 5 stars',            createdAt: daysBack(10, 3) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000034 — ₱5,300.00',            createdAt: daysBack(6,  0) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000040 — ₱8,000.00',            createdAt: daysBack(3,  1) },
      { user_id: customerId, category: 'customer', action: 'Submitted review',    description: 'Reviewed product: Harden Volume 7 — 4 stars',           createdAt: daysBack(2,  2) },
      { user_id: customerId, category: 'customer', action: 'Placed order',        description: 'Customer placed order #000047 — ₱7,000.00',            createdAt: daysBack(1,  0) },
    ];

    // CHANGED: Passed "logs" instead of "rows"
    await queryInterface.bulkInsert('audit_logs', logs, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('audit_logs', null, {});
  }
};