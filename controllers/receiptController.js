const jwt = require('jsonwebtoken');
const db = require('../models');
const { Order, OrderItem, Variant, Product, User } = db;
const { generateReceiptPdf } = require('../utils/generateReceiptPdf');

// GET /api/receipts/:orderId/pdf?token=...
//
// Intentionally NOT behind the `protect` login middleware. Emails are opened
// on devices/browsers where the customer usually isn't logged in, so instead
// this route trusts a short-lived, order-scoped JWT (created only by our own
// server when the email was sent — see utils/receiptLink.js). The token
// proves "the server that emailed this order also generated this link" —
// it cannot be reused for any other order or any other part of the account.
exports.downloadReceipt = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(401).send('Missing receipt token.');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).send('This receipt link is invalid or has expired.');
        }

        if (decoded.purpose !== 'receipt' || String(decoded.orderId) !== String(req.params.orderId)) {
            return res.status(403).send('This receipt link does not match the requested order.');
        }

        const order = await Order.findByPk(req.params.orderId, {
            include: [
                { model: User },
                { model: OrderItem, include: [{ model: Variant, include: [Product] }] }
            ]
        });

        if (!order) {
            return res.status(404).send('Order not found.');
        }

        const pdfBuffer = await generateReceiptPdf(order);
        const filename = `Adidas-AWA-Receipt-${String(order.id).padStart(6, '0')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Receipt download failed:', error.message);
        return res.status(500).send('Server error generating receipt.');
    }
};