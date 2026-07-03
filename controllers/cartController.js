const { Variant, Product, Category, ProductImage } = require('../models');

function effectivePrice(product) {
    const price = parseFloat(product.price);
    const sale = product.sale_price !== null && product.sale_price !== undefined
        ? parseFloat(product.sale_price)
        : null;
    return (sale !== null && sale < price) ? sale : price;
}

// POST /api/cart/resolve
// Body: { items: [{ variant_id, quantity }, ...] }
//
// The cart itself lives in the browser (localStorage) now -- there is no
// cart_items table anymore. This endpoint just hydrates whatever the
// browser is holding with live price/stock/product data so the DB is
// never written to on every add/remove/quantity change. Nothing here
// gets persisted.
exports.resolveCart = async (req, res) => {
    try {
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        if (items.length === 0) {
            return res.status(200).json([]);
        }

        const variantIds = [...new Set(
            items.map(i => parseInt(i.variant_id, 10)).filter(id => Number.isInteger(id))
        )];

        const variants = await Variant.findAll({
            where: { id: variantIds },
            include: [{ model: Product, include: [Category, ProductImage] }]
        });
        const variantMap = new Map(variants.map(v => [v.id, v]));

        const resolved = items
            .map(item => {
                const variant = variantMap.get(parseInt(item.variant_id, 10));
                if (!variant || !variant.Product) return null; // stale/deleted -- dropped silently

                const requestedQty = parseInt(item.quantity, 10) || 1;
                const quantity = Math.max(1, Math.min(requestedQty, variant.stock_level || 1));

                return {
                    variant_id: variant.id,
                    quantity,
                    unit_price: effectivePrice(variant.Product),
                    Variant: variant
                };
            })
            .filter(Boolean);

        return res.status(200).json(resolved);
    } catch (error) {
        return res.status(500).json({ message: 'Server error resolving cart.', error: error.message });
    }
};
