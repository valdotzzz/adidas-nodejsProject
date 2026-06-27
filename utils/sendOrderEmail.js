const transporter = require('../config/mailer');
const generateReceiptPdf = require('./generateReceiptPdf');

async function sendOrderStatusEmail(order, user) {
    const pdfBuffer = await generateReceiptPdf(order);

    const statusMessages = {
        pending: 'Your order has been received and is being processed.',
        completed: 'Great news! Your order has been completed.',
        cancelled: 'Your order has been cancelled.'
    };

    const mailOptions = {
        from: '"Adidas AWA" <no-reply@adidas-awa.com>',
        to: user.email,
        subject: `Order #${String(order.id).padStart(6, '0')} Update — ${order.status.toUpperCase()}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="margin-bottom: 4px;">ADIDAS</h2>
                <p style="color: #888; margin-top: 0;">Order Update</p>
                <p>Hi ${user.name},</p>
                <p>${statusMessages[order.status] || 'Your order status has been updated.'}</p>
                <p><strong>Order #${String(order.id).padStart(6, '0')}</strong></p>
                <p>Status: <strong>${order.status.toUpperCase()}</strong></p>
                <p>Total: <strong>₱${parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
                <p style="margin-top: 24px; color: #888; font-size: 13px;">Your receipt is attached as a PDF.</p>
            </div>
        `,
        attachments: [
            {
                filename: `receipt-order-${order.id}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    return transporter.sendMail(mailOptions);
}

module.exports = sendOrderStatusEmail;