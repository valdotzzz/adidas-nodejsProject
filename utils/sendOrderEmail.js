/**
 * sendOrderEmail.js
 * Drop-in replacement for sendOrderStatusEmail.js
 *
 * Two exported functions mirror the two Laravel Mailables:
 *   sendOrderConfirmationEmail(order)  ← called when order is first placed
 *   sendOrderStatusEmail(order)        ← called when admin updates order status
 *
 * Both expect `order` to be a fully-loaded Sequelize instance with:
 *   order.User
 *   order.Address
 *   order.OrderItems[].Variant.Product
 *
 * PDF generation uses html-pdf-node (install: npm install html-pdf-node)
 * You can swap it for puppeteer if you prefer.
 */

const transporter               = require('../config/mailer');
// Change these three lines in sendOrderEmail.js:
const orderConfirmationTemplate = require('./orderConfirmation');
const orderStatusTemplate       = require('./orderStatus');
const receiptTemplate           = require('./reciept');   // matches your filename

/* ── PDF helper ─────────────────────────────────────────── */
async function generatePdfBuffer(order) {
    const PDFDocument = require('pdfkit');
    const { Readable } = require('stream');

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const orderId = String(order.id).padStart(6, '0');
        const user = order.User || {};
        const items = order.OrderItems || [];

        doc.fontSize(20).font('Helvetica-Bold').text('ADIDAS', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Order Receipt', { align: 'center' });
        doc.moveDown();
        doc.text(`Order #${orderId}`, { align: 'left' });
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Customer: ${user.name} (${user.email})`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('Items:', { underline: true });
        doc.font('Helvetica');
        items.forEach(item => {
            doc.text(`  ${item.product_name} — ${item.colorway} ${item.size_type} ${item.size_value} x${item.quantity} @ ₱${parseFloat(item.price).toFixed(2)}`);
        });

        doc.moveDown();
        doc.font('Helvetica-Bold').text(`Total: ₱${parseFloat(order.total_amount).toFixed(2)}`);
        doc.text(`Payment: ${order.payment_method?.toUpperCase() || 'COD'}`);
        doc.moveDown();
        doc.font('Helvetica').fontSize(10).text('Thank you for your order!', { align: 'center' });

        doc.end();
    });
}

/* ── Shared mailer ──────────────────────────────────────── */
async function buildAndSend({ order, subject, htmlBody, attachPdf = false }) {
    const user     = order.User || {};
    const orderId  = String(order.id).padStart(6, '0');
    const filename = `Adidas-AWA-Receipt-${orderId}.pdf`;

    const mailOptions = {
        from   : '"Adidas AWA" <no-reply@adidas-awa.com>',
        to     : user.email,
        subject,
        html   : htmlBody,
        attachments: [],
    };

    if (attachPdf) {
        const pdfBuffer = await generatePdfBuffer(order);
        mailOptions.attachments.push({
            filename,
            content    : pdfBuffer,
            contentType: 'application/pdf',
        });
    }

    return transporter.sendMail(mailOptions);
}

/* ── 1. Order Confirmation (on placement) ───────────────── */
async function sendOrderConfirmationEmail(order) {
    const orderId = String(order.id).padStart(6, '0');
    return buildAndSend({
        order,
        subject   : `Order Confirmed — #${orderId} | Adidas AWA`,
        htmlBody  : orderConfirmationTemplate(order),
        attachPdf : true,   // attach the PDF receipt on confirmation
    });
}

/* ── 2. Order Status Update (on admin change) ───────────── */
async function sendOrderStatusEmail(order) {
    const orderId     = String(order.id).padStart(6, '0');
    const statusLabel = (order.status || 'Updated').charAt(0).toUpperCase() + (order.status || '').slice(1);
    return buildAndSend({
        order,
        subject   : `Your Order #${orderId} has been ${statusLabel} | Adidas AWA`,
        htmlBody  : orderStatusTemplate(order),
        attachPdf : false,  // no PDF on status updates, matching IKEA pattern
    });
}

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail };