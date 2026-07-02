const db = require('../../models');
const { Order, OrderItem, User, Variant, Product } = db;
const { sendOrderStatusEmail } = require('../../utils/sendOrderEmail');

// GET /api/admin/orders — list all orders (admin/staff only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: OrderItem }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching orders.', error: error.message });
    }
};

// GET /api/admin/orders/:id — single order detail
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: OrderItem }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching order.', error: error.message });
    }
};

// PUT /api/admin/orders/:id — update order status (admin/staff only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const VALID_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'];

        if (!VALID_STATUSES.includes(status)) {
            return res.status(422).json({ message: 'Invalid status value.' });
        }

        // ✅ Re-fetch with ALL associations the email needs
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User },
                {
                    model: OrderItem,
                    include: [{
                        model: Variant,
                        include: [{ model: db.Product }]
                    }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // If cancelling or refunding, restock the variants — but only once, and
        // only if the order wasn't already in a restocked state.
        const RESTOCKING_STATUSES = ['cancelled', 'refunded'];
        const wasAlreadyRestocked = RESTOCKING_STATUSES.includes(order.status);
        if (RESTOCKING_STATUSES.includes(status) && !wasAlreadyRestocked) {
            for (const item of order.OrderItems) {
                const variant = await Variant.findByPk(item.variant_id);
                if (variant) {
                    await variant.increment('stock_level', { by: item.quantity });
                }
            }
        }

        order.status = status;
        await order.save();

        // ✅ Correct call — one argument, no second user param
        try {
            await sendOrderStatusEmail(order);
        } catch (emailError) {
            console.error('Failed to send order status email:', emailError.message);
        }

        return res.status(200).json({ message: 'Order status updated successfully.', order });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating order status.', error: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        await order.destroy();
        return res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting order.', error: error.message });
    }
};