const db = require('../models');
const { CartItem, Variant, Product, Order, OrderItem, Address } = db;

// GET /api/checkout — cart summary + user's saved addresses (for the checkout page to render)
exports.getCheckoutData = async (req, res) => {
    try {
        const cartItems = await CartItem.findAll({
            where: { user_id: req.user.id },
            include: [{ model: Variant, include: [Product] }]
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty.' });
        }

        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += parseFloat(item.Variant.Product.price) * item.quantity;
        });

        const shippingFee = subtotal >= 3000 ? 0 : 150;
        const total = subtotal + shippingFee;

        const addresses = await Address.findAll({ where: { user_id: req.user.id } });

        return res.status(200).json({
            cartItems,
            subtotal: subtotal.toFixed(2),
            shipping_fee: shippingFee.toFixed(2),
            total: total.toFixed(2),
            addresses
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error loading checkout.', error: error.message });
    }
};

// POST /api/checkout — place the order
exports.placeOrder = async (req, res) => {
    const sequelize = db.sequelize;
    const t = await sequelize.transaction();

    try {
        const { full_name, phone, address_line, city, province, postal_code, payment_method } = req.body;

        if (!full_name || !phone || !address_line || !city) {
            await t.rollback();
            return res.status(422).json({ message: 'Please complete all required shipping fields.' });
        }

        const cartItems = await CartItem.findAll({
            where: { user_id: req.user.id },
            include: [{ model: Variant, include: [Product] }],
            transaction: t
        });

        if (cartItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Your cart is empty.' });
        }

        // Validate stock for every item BEFORE creating anything (same safeguard as Laravel version)
        for (const item of cartItems) {
            if (item.Variant.stock_level < item.quantity) {
                await t.rollback();
                return res.status(400).json({
                    message: `${item.Variant.Product.name} (${item.Variant.colorway}, ${item.Variant.size_type} ${item.Variant.size_value}) no longer has enough stock.`
                });
            }
        }

        // Calculate totals server-side — never trust client-submitted prices
        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += parseFloat(item.Variant.Product.price) * item.quantity;
        });
        const shippingFee = subtotal >= 3000 ? 0 : 150;
        const total = subtotal + shippingFee;

        // Create the Order
        const order = await Order.create({
            user_id: req.user.id,
            total_amount: total,
            status: 'pending',
            full_name, phone, address_line, city, province, postal_code,
            payment_method: payment_method || 'cod'
        }, { transaction: t });

        // Create OrderItems + decrement stock for each cart item
        for (const item of cartItems) {
            await OrderItem.create({
                order_id: order.id,
                product_id: item.Variant.Product.id,
                variant_id: item.Variant.id,
                product_name: item.Variant.Product.name,
                colorway: item.Variant.colorway,
                size_type: item.Variant.size_type,
                size_value: item.Variant.size_value,
                price: item.Variant.Product.price,
                quantity: item.quantity
            }, { transaction: t });

            await item.Variant.decrement('stock_level', { by: item.quantity, transaction: t });
        }

        // Save shipping address snapshot on the order if you add those columns (see note below)
        // For now, optionally also save it to the Address book if requested
        if (req.body.save_address) {
            await Address.create({
                user_id: req.user.id,
                full_name, phone, address_line, city, province, postal_code
            }, { transaction: t });
        }

        // Clear the cart
        await CartItem.destroy({ where: { user_id: req.user.id }, transaction: t });

        await t.commit();

        return res.status(201).json({ message: 'Order placed successfully!', order });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ message: 'Server error placing order.', error: error.message });
    }
};

// GET /api/checkout/orders/:id — order confirmation / detail
// GET /api/checkout/orders/:id — order confirmation / detail
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: OrderItem }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching order.', error: error.message });
    }
};

// GET /api/checkout/orders — list ALL of the logged-in user's past orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [{ model: OrderItem }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching orders.', error: error.message });
    }
};