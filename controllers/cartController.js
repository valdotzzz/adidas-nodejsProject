const { Variant, Product, Category, ProductImage, Colorway, ShoeSize } = require('../models');

function effectivePrice(product) {
    const price = parseFloat(product.price);
    const sale = product.sale_price !== null && product.sale_price !== undefined
        ? parseFloat(product.sale_price)
        : null;
    return (sale !== null && sale < price) ? sale : price;
}

// POST /api/cart/resolve
// Body: { items: [{ variant_id, quantity }, ...] }
exports.resolveCart = async (req, res) => {
    try {
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        if (items.length === 0) {
            return res.status(200).json([]);
        }

        // Merge duplicate variant_id entries (e.g. leftover/duplicated localStorage
        // rows) into a single line by summing quantity, instead of creating
        // separate lines for the same exact variant.
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
            include: [
                { model: Product, include: [Category, ProductImage] },
                Colorway,
                ShoeSize,
                { model: ProductImage, as: 'VariantImage' }
            ]
        });
        const variantMap = new Map(variants.map(v => [v.id, v]));

        const resolved = [];
        const staleVariantIds = []; // couldn't be found -- product/variant deleted or from before the size/colorway migration
        for (const [variantId, requestedQty] of mergedQty.entries()) {
            const variant = variantMap.get(variantId);
            if (!variant || !variant.Product) {
                staleVariantIds.push(variantId);
                continue;
            }

            const quantity = Math.max(1, Math.min(requestedQty, variant.stock_level || 1));
            resolved.push({
                variant_id: variant.id,
                quantity,
                unit_price: effectivePrice(variant.Product),
                Variant: variant
            });
        }

        return res.status(200).json({ items: resolved, stale_variant_ids: staleVariantIds });
    } catch (error) {
        return res.status(500).json({ message: 'Server error resolving cart.', error: error.message });
    }
};