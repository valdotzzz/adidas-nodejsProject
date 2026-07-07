const { DiscountCode, DiscountRedemption, User, Order } = require('../../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// ── helpers ────────────────────────────────────────────────────────────────

function generateCode(prefix = '') {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return prefix ? `${prefix.toUpperCase()}-${rand}` : rand;
}

// ── GET /api/admin/discounts ───────────────────────────────────────────────
exports.listCodes = async (req, res) => {
    try {
        const codes = await DiscountCode.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.json(codes);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching discount codes.', error: err.message });
    }
};

// ── POST /api/admin/discounts ──────────────────────────────────────────────
// Body: { code?, percent_off, max_uses?, expires_at?, active?, generate_count? }
// If generate_count > 1, creates that many codes with shared settings.
exports.createCodes = async (req, res) => {
    try {
        const { percent_off, max_uses, expires_at, active, generate_count, code, prefix } = req.body;
        const pct = parseFloat(percent_off);
        if (isNaN(pct) || pct <= 0 || pct > 100) {
            return res.status(422).json({ message: 'percent_off must be between 0 and 100.' });
        }

        const count = parseInt(generate_count, 10) || 1;
        const baseSettings = {
            percent_off: pct,
            max_uses: max_uses ? parseInt(max_uses, 10) : null,
            expires_at: expires_at || null,
            active: active !== false && active !== 'false'
        };

        if (count === 1 && code) {
            // Single manually-named code
            const existing = await DiscountCode.findOne({ where: { code: code.toUpperCase() } });
            if (existing) return res.status(409).json({ message: 'That code already exists.' });
            const created = await DiscountCode.create({ ...baseSettings, code: code.toUpperCase() });
            return res.status(201).json({ created: [created] });
        }

        // Bulk generate
        const created = [];
        let attempts = 0;
        while (created.length < count && attempts < count * 5) {
            attempts++;
            const newCode = generateCode(prefix);
            const exists = await DiscountCode.findOne({ where: { code: newCode } });
            if (exists) continue;
            const row = await DiscountCode.create({ ...baseSettings, code: newCode });
            created.push(row);
        }
        return res.status(201).json({ created });
    } catch (err) {
        return res.status(500).json({ message: 'Error creating codes.', error: err.message });
    }
};

// ── PATCH /api/admin/discounts/:id ────────────────────────────────────────
exports.updateCode = async (req, res) => {
    try {
        const dc = await DiscountCode.findByPk(req.params.id);
        if (!dc) return res.status(404).json({ message: 'Discount code not found.' });
        const { percent_off, max_uses, expires_at, active } = req.body;
        await dc.update({
            percent_off: percent_off !== undefined ? parseFloat(percent_off) : dc.percent_off,
            max_uses: max_uses !== undefined ? (max_uses === '' || max_uses === null ? null : parseInt(max_uses, 10)) : dc.max_uses,
            expires_at: expires_at !== undefined ? (expires_at || null) : dc.expires_at,
            active: active !== undefined ? (active === true || active === 'true') : dc.active
        });
        return res.json(dc);
    } catch (err) {
        return res.status(500).json({ message: 'Error updating code.', error: err.message });
    }
};

// ── DELETE /api/admin/discounts/:id ───────────────────────────────────────
exports.deleteCode = async (req, res) => {
    try {
        const dc = await DiscountCode.findByPk(req.params.id);
        if (!dc) return res.status(404).json({ message: 'Discount code not found.' });
        await dc.destroy();
        return res.json({ message: 'Code deleted.' });
    } catch (err) {
        return res.status(500).json({ message: 'Error deleting code.', error: err.message });
    }
};

// ── GET /api/admin/discounts/:id/redemptions ──────────────────────────────
exports.getRedemptions = async (req, res) => {
    try {
        const rows = await DiscountRedemption.findAll({
            where: { code_id: req.params.id },
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: Order, attributes: ['id', 'total_amount', 'createdAt'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching redemptions.', error: err.message });
    }
};