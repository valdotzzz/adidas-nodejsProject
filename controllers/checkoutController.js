const db = require('../models');
const { Variant, Product, ProductImage, Order, OrderItem, Address, User, Colorway, ShoeSize, DiscountCode, DiscountRedemption } = db;
const { sendOrderConfirmationEmail } = require('../utils/sendOrderEmail');

const DISCOUNT_RATE = 0.20; // RA 9994 / RA 10754 -- PWD & Senior Citizen
const FREE_SHIPPING_THRESHOLD = 3000;
const SHIPPING_FEE = 150;

function effectivePrice(product) {
    const price = parseFloat(product.price);
    const sale = product.sale_price !== null && product.sale_price !== undefined
        ? parseFloat(product.sale_price)
        : null;
    return (sale !== null && sale < price) ? sale : price;
}

// Re-derives total_amount straight from the persisted order_items rows
// (never from whatever was computed pre-insert). This is the enforcement
// point: total_amount can never drift from what's actually in order_items.
async function recalculateOrderTotal(order, transaction) {
    const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction });
    const itemsTotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    
    // Updated to subtract both manual ID discounts and applied coupon code value
    const total = itemsTotal - parseFloat(order.discount_amount) - parseFloat(order.discount_code_amount) + parseFloat(order.shipping_fee);

    order.total_amount = Math.max(total, 0).toFixed(2);
    await order.save({ transaction });
    return order.total_amount;
}


// Validates + resolves the client-submitted cart against live DB data.
// Throws { status, message } on any problem so callers can just await it.
async function resolveAndValidateCart(items, transaction) {
    if (!Array.isArray(items) || items.length === 0) {
        throw { status: 400, message: 'Your cart is empty.' };
    }

    // Merge duplicate variant_id lines (e.g. leftover duplicate localStorage
    // rows) by summing quantity instead of creating separate order lines
    // for the exact same variant.
    const mergedQty = new Map(); // variant_id -> summed quantity
    for (const item of items) {
        const vid = parseInt(item.variant_id, 10);
        if (!Number.isInteger(vid)) continue;
        const qty = parseInt(item.quantity, 10) || 1;
        mergedQty.set(vid, (mergedQty.get(vid) || 0) + qty);
    }

    const variantIds = [...mergedQty.keys()];
    const variants = await Variant.findAll({
        where: { id: variantIds },
        include: [Product, Colorway, ShoeSize],
        transaction
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    const resolved = [];
    for (const [variantId, quantity] of mergedQty.entries()) {
        const variant = variantMap.get(variantId);

        if (!variant || !variant.Product || variant.Product.is_hidden) {
            throw { status: 400, message: 'One of the items in your cart is no longer available.' };
        }
        if (variant.stock_level < quantity) {
            const colorwayName = variant.Colorway ? variant.Colorway.name : '';
            const sizeLabel = variant.ShoeSize ? variant.ShoeSize.label : '';
            throw {
                status: 400,
                message: `${variant.Product.name} (${colorwayName}, ${sizeLabel}) no longer has enough stock.`
            };
        }

        resolved.push({ variant, quantity, price: effectivePrice(variant.Product) });
    }
    return resolved;
}

// Resolves which Address row this order should point to.
// - address_id given -> must belong to this user.
// - otherwise -> create a new Address row from the submitted fields.
//   is_saved mirrors the "save this address" checkbox: unchecked means it
//   still needs a row (Order.address_id is NOT NULL) but won't show up in
//   the user's address book.
async function resolveOrderAddress(req, transaction) {
    const { address_id, full_name, phone, address_line, city, province, postal_code, save_address } = req.body;

    if (address_id) {
        const address = await Address.findOne({
            where: { id: address_id, user_id: req.user.id },
            transaction
        });
        if (!address) {
            throw { status: 422, message: 'Selected address not found.' };
        }
        return address;
    }

    if (!full_name || !phone || !address_line || !city) {
        throw { status: 422, message: 'Please complete all required shipping fields.' };
    }

    const existingCount = await Address.count({ where: { user_id: req.user.id, is_saved: true }, transaction });

    return Address.create({
        user_id: req.user.id,
        label: 'Home',
        address_type: 'shipping',
        full_name, phone, address_line, city, province, postal_code,
        is_default: existingCount === 0 && !!save_address,
        is_saved: !!save_address
    }, { transaction });
}

// POST /api/checkout -- place the order
// Body: { items: [{variant_id, quantity}], address_id? | (full_name, phone, address_line, city, province, postal_code, save_address),
//         discount_type?, discount_id_number?, discount_code?, payment_method? }
exports.placeOrder = async (req, res) => {
    const t = await db.sequelize.transaction();

    try {
        const cartLines = await resolveAndValidateCart(req.body.items, t);
        const address = await resolveOrderAddress(req, t);

        const discountType = ['pwd', 'senior'].includes(req.body.discount_type) ? req.body.discount_type : 'none';
        if (discountType !== 'none' && !req.body.discount_id_number) {
            throw { status: 422, message: 'Please provide a PWD / Senior Citizen ID number.' };
        }

        // Mutual exclusivity rule evaluation
        if (discountType !== 'none' && req.body.discount_code) {
            throw { status: 422, message: 'Promo codes cannot be combined with PWD or Senior Citizen discounts.' };
        }

        const subtotal = cartLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
        let discountAmount = discountType !== 'none' ? Math.round(subtotal * DISCOUNT_RATE * 100) / 100 : 0;
        
        // Server-side discount code matching & evaluation
        let discountCodeId = null;
        let discountCodeAmount = 0;
        let discountCodeInstance = null;

        if (req.body.discount_code && req.body.discount_code.trim()) {
            const cleanCode = req.body.discount_code.trim();
            discountCodeInstance = await DiscountCode.findOne({
                where: { code: cleanCode },
                transaction: t
            });

            if (!discountCodeInstance) {
                throw { status: 422, message: 'Invalid discount code.' };
            }
            if (!discountCodeInstance.active) {
                throw { status: 422, message: 'This discount code is no longer active.' };
            }
            if (discountCodeInstance.expires_at && new Date(discountCodeInstance.expires_at) < new Date()) {
                throw { status: 422, message: 'This discount code has expired.' };
            }
            if (discountCodeInstance.max_uses !== null && discountCodeInstance.times_used >= discountCodeInstance.max_uses) {
                throw { status: 422, message: 'This discount code has reached its maximum usage limit.' };
            }

            // Enforce one redemption per user constraint
            const alreadyRedeemed = await DiscountRedemption.findOne({
                where: { code_id: discountCodeInstance.id, user_id: req.user.id },
                transaction: t
            });
            if (alreadyRedeemed) {
                throw { status: 422, message: 'You have already redeemed this discount code.' };
            }

            discountCodeId = discountCodeInstance.id;
            const pctOff = parseFloat(discountCodeInstance.percent_off) || 0;
            discountCodeAmount = Math.round(subtotal * (pctOff / 100) * 100) / 100;
        }

        const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        const provisionalTotal = Math.max(subtotal - discountAmount - discountCodeAmount, 0) + shippingFee;

        const order = await Order.create({
            user_id: req.user.id,
            address_id: address.id,
            status: 'pending',
            payment_method: req.body.payment_method || 'cod',
            discount_type: discountType,
            discount_id_number: discountType !== 'none' ? req.body.discount_id_number : null,
            discount_amount: discountAmount,
            discount_code_id: discountCodeId,
            discount_code_amount: discountCodeAmount,
            shipping_fee: shippingFee,
            total_amount: provisionalTotal // placeholder; re-derived below
        }, { transaction: t });

        for (const line of cartLines) {
            await OrderItem.create({
                order_id: order.id,
                product_id: line.variant.Product.id,
                variant_id: line.variant.id,
                product_name: line.variant.Product.name,
                colorway: line.variant.Colorway ? line.variant.Colorway.name : null,
                size_type: line.variant.ShoeSize ? 'US' : null,
                size_value: line.variant.ShoeSize ? line.variant.ShoeSize.us_size : null,
                price: line.price,
                quantity: line.quantity
            }, { transaction: t });

            await line.variant.decrement('stock_level', { by: line.quantity, transaction: t });
        }

        // Commit redemption milestones if a code was passed
        if (discountCodeInstance) {
            await discountCodeInstance.increment('times_used', { by: 1, transaction: t });
            await DiscountRedemption.create({
                code_id: discountCodeInstance.id,
                user_id: req.user.id,
                order_id: order.id
            }, { transaction: t });
        }

        // Single source of truth calibration
        await recalculateOrderTotal(order, t);

        await t.commit();

        try {
            const fullOrder = await Order.findByPk(order.id, {
                include: [
                    { model: User },
                    { model: Address },
                    { model: OrderItem, include: [{ model: Variant, include: [Product] }] }
                ]
            });
            await sendOrderConfirmationEmail(fullOrder);
        } catch (emailErr) {
            console.error('Order confirmation email failed:', emailErr.message);
        }

        return res.status(201).json({ message: 'Order placed successfully!', order });
    } catch (error) {
        await t.rollback();
        const status = error.status || 500;
        return res.status(status).json({ message: error.message || 'Server error placing order.' });
    }
};

// GET /api/checkout/orders/:id -- order confirmation / detail
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [
                { model: Address },
                { model: OrderItem, include: [
                    { model: Variant },
                    { model: Product, paranoid: false, include: [ProductImage] }
                ] }
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

// GET /api/checkout/orders -- list ALL of the logged-in user's past orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [
                { model: Address },
                { model: OrderItem, include: [
                    { model: Variant },
                    { model: Product, paranoid: false, include: [ProductImage] }
                ] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching orders.', error: error.message });
    }
};