const db = require('../../models');
const { Order, OrderItem, User, Variant } = db;
const sendOrderStatusEmail = require('../../utils/sendOrderEmail');

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

        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(422).json({ message: 'Invalid status value.' });
        }

        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem }, { model: User }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // If cancelling, restock the variants (same safeguard as the Laravel version)
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (const item of order.OrderItems) {
                const variant = await Variant.findByPk(item.variant_id);
                if (variant) {
                    await variant.increment('stock_level', { by: item.quantity });
                }
            }
        }

        order.status = status;
        await order.save();

        // Send email notification with PDF receipt attached
        try {
            await sendOrderStatusEmail(order, order.User);
        } catch (emailError) {
            console.error('Failed to send order status email:', emailError.message);
            // Don't fail the whole request just because email failed
        }

        return res.status(200).json({ message: 'Order status updated successfully.', order });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating order status.', error: error.message });
    }
};