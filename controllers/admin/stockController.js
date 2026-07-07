const { Variant, Product, Colorway, ShoeSize, AuditLog } = require('../../models');

exports.getAllVariantsForStock = async (req, res) => {
    try {
        const variants = await Variant.findAll({
            include: [
                {
                    model: Product,
                    attributes: ['id', 'name', 'style_code'],
                    where: { price: { [require('sequelize').Op.gt]: 0 } }
                },
                { model: Colorway,  attributes: ['id', 'name'] },
                { model: ShoeSize,  attributes: ['id', 'label', 'us_size'] }
            ],
            order: [
                [Product,  'name',    'ASC'],
                [Colorway, 'name',    'ASC'],
                [ShoeSize, 'us_size', 'ASC']
            ]
        });
        return res.status(200).json(variants);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching stock data.', error: error.message });
    }
};

// PATCH /api/admin/stock
// Body: { adjustments: [{ variant_id, delta }] }
exports.batchAdjustStock = async (req, res) => {
    const { adjustments } = req.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
        return res.status(400).json({ message: 'adjustments must be a non-empty array.' });
    }

    const t = await require('../../config/database').transaction();
    try {
        const results = [];

        for (const { variant_id, delta } of adjustments) {
            if (typeof delta !== 'number' || !Number.isInteger(delta)) {
                throw { status: 422, message: `delta must be an integer (got ${delta} for variant ${variant_id}).` };
            }

            const variant = await Variant.findByPk(variant_id, {
                include: [
                    { model: Product,  attributes: ['id', 'name', 'style_code'] },
                    { model: Colorway, attributes: ['id', 'name'] },
                    { model: ShoeSize, attributes: ['id', 'label'] }
                ],
                transaction: t
            });

            if (!variant) throw { status: 404, message: `Variant ${variant_id} not found.` };

            const before = variant.stock_level;
            const after  = Math.max(0, before + delta);
            await variant.update({ stock_level: after }, { transaction: t });

            results.push({
                variant_id,
                product:  variant.Product?.name,
                style:    variant.Product?.style_code,
                colorway: variant.Colorway?.name,
                size:     variant.ShoeSize?.label,
                before,
                delta,
                after
            });
        }

        await AuditLog.create({
            user_id:     req.user.id,
            category:    req.user.role,
            action:      'BATCH_STOCK_ADJUSTMENT',
            description: `Adjusted stock for ${results.length} variant(s).`,
            meta: {
                adjusted_by: req.user.id,
                adjustments: results
            }
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({ message: `${results.length} variant(s) updated.`, results });
    } catch (err) {
        await t.rollback();
        return res.status(err.status || 500).json({ message: err.message || 'Error adjusting stock.' });
    }
};