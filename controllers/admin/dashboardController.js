const { Order, OrderItem, Product, Variant, User } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');
const db = require('../../models');

// GET /api/admin/dashboard — summary metrics for the stats cards
exports.getDashboard = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [totalRevenue, newOrders, totalOrders, lowStockVariants, totalUsers] = await Promise.all([
            Order.sum('total_amount', { where: { status: 'completed' } }),
            Order.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
            Order.count(),
            Variant.count({ where: { stock_level: { [Op.gt]: 0, [Op.lte]: 5 } } }),
            User.count()
        ]);

        return res.status(200).json({
            total_revenue: totalRevenue || 0,
            new_orders_30d: newOrders,
            total_orders: totalOrders,
            low_stock_variants: lowStockVariants,
            total_users: totalUsers
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching dashboard metrics.', error: error.message });
    }
};

// GET /api/admin/dashboard/sales-chart — daily revenue for the line/bar charts
// ?days=30 (default 30)
exports.getSalesChart = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const rows = await Order.findAll({
            where: { status: 'completed', createdAt: { [Op.gte]: since } },
            attributes: [
                [fn('DATE', col('createdAt')), 'date'],
                [fn('SUM', col('total_amount')), 'revenue'],
                [fn('COUNT', col('id')), 'orders']
            ],
            group: [fn('DATE', col('createdAt'))],
            order: [[fn('DATE', col('createdAt')), 'ASC']],
            raw: true
        });

        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching sales chart data.', error: error.message });
    }
};

// GET /api/admin/dashboard/category-chart — revenue by category for pie chart
exports.getCategoryChart = async (req, res) => {
    try {
        const rows = await db.sequelize.query(`
            SELECT c.name AS category, SUM(oi.price * oi.quantity) AS revenue
            FROM order_items oi
            JOIN variants v ON oi.variant_id = v.id
            JOIN products p ON v.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            JOIN \`Orders\` o ON oi.order_id = o.id
            WHERE o.status = 'completed' AND o.deletedAt IS NULL
            GROUP BY c.name
            ORDER BY revenue DESC
        `, { type: db.sequelize.QueryTypes.SELECT });

        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching category chart data.', error: error.message });
    }
};

// GET /api/admin/dashboard/audit-logs — action log from DB
exports.getAuditLogs = async (req, res) => {
    try {
        const { category, limit } = req.query;
        const where = {};
        if (category) where.category = category;

        const logs = await db.AuditLog.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit) || 100,
            include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }]
        });

        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching audit logs.', error: error.message });
    }
};