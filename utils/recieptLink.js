/**
 * receiptLink.js
 * Builds a signed link that lets a customer open their PDF receipt
 * straight from an email button — without needing to be logged in
 * on that device/browser first.
 *
 * The token is scoped ONLY to this order (not a full login session),
 * so it can't be reused to access anything else on the account.
 */
const jwt = require('jsonwebtoken');

function buildReceiptLink(order, baseUrl) {
    const token = jwt.sign(
        { orderId: order.id, purpose: 'receipt' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // link stays valid for 30 days after the email is sent
    );
    return `${baseUrl}/api/receipts/${order.id}/pdf?token=${token}`;
}

module.exports = { buildReceiptLink };