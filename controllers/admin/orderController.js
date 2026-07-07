const db = require('../../models');
const { Order, OrderItem, User, Variant, Product, AuditLog } = db;
const { sendOrderStatusEmail } = require('../../utils/sendOrderEmail');

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

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: OrderItem, include: [{ model: Variant, include: [Product] }] }
            ]
        });
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching order.', error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const VALID_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(422).json({ message: 'Invalid status value.' });
        }

        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User },
                { model: OrderItem, include: [{ model: Variant, include: [{ model: db.Product }] }] }
            ]
        });
        if (!order) return res.status(404).json({ message: 'Order not found.' });

        const previousStatus = order.status;
        const RESTOCKING_STATUSES = ['cancelled', 'refunded'];
        const wasAlreadyRestocked = RESTOCKING_STATUSES.includes(previousStatus);
        let restockedItems = [];

        if (RESTOCKING_STATUSES.includes(status) && !wasAlreadyRestocked) {
            for (const item of order.OrderItems) {
                const variant = await Variant.findByPk(item.variant_id);
                if (variant) {
                    await variant.increment('stock_level', { by: item.quantity });
                    restockedItems.push({ variant_id: item.variant_id, qty_returned: item.quantity });
                }
            }
        }

        order.status = status;
        await order.save();

        await AuditLog.create({
            category:    req.user.role,
            action:      'ORDER_STATUS_UPDATE',
            description: `Order #${order.id} status changed: ${previousStatus} → ${status}.`,
            meta: {
                order_id:       order.id,
                customer:       { id: order.User?.id, name: order.User?.name, email: order.User?.email },
                previous_status: previousStatus,
                new_status:     status,
                total_price:    order.total_price,
                restocked_items: restockedItems,
                items: order.OrderItems.map(i => ({
                    variant_id: i.variant_id,
                    product:    i.Variant?.Product?.name,
                    quantity:   i.quantity,
                    price:      i.price
                }))
            }
        });

        try { await sendOrderStatusEmail(order); }
        catch (emailError) { console.error('Failed to send order status email:', emailError.message); }

        return res.status(200).json({ message: 'Order status updated successfully.', order });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating order status.', error: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: OrderItem }
            ]
        });
        if (!order) return res.status(404).json({ message: 'Order not found.' });

        const snapshot = {
            order_id:   order.id,
            customer:   { id: order.User?.id, name: order.User?.name, email: order.User?.email },
            status:     order.status,
            total:      order.total_price,
            item_count: order.OrderItems?.length ?? 0
        };

        await order.destroy();

        await AuditLog.create({
            category:    req.user.role,
            action:      'ORDER_DELETE',
            description: `Deleted Order #${snapshot.order_id} (${snapshot.customer.name}, ₱${snapshot.total}).`,
            meta:        snapshot
        });

        return res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting order.', error: error.message });
    }
};