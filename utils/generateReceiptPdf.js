/**
 * generateReceiptPdf.js
 * Builds the order receipt PDF as a Buffer.
 * Shared by:
 *   - utils/sendOrderEmail.js      (PDF email attachment)
 *   - controllers/receiptController.js  (direct "Download PDF Receipt" link)
 *
 * @param {object} order - Sequelize Order instance with:
 *   order.User
 *   order.OrderItems[].Variant.Product
 * @returns {Promise<Buffer>}
 */
const PDFDocument = require('pdfkit');

function generateReceiptPdf(order) {
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
            const variant = item.Variant || {};
            const product = variant.Product || {};
            doc.text(`  ${product.name || 'Item'} — ${variant.colorway || ''} ${variant.size_type || ''} ${variant.size_value || ''} x${item.quantity} @ ₱${parseFloat(item.price).toFixed(2)}`);
        });

        doc.moveDown();
        doc.font('Helvetica-Bold').text(`Total: ₱${parseFloat(order.total_amount).toFixed(2)}`);
        doc.text(`Payment: ${order.payment_method?.toUpperCase() || 'COD'}`);
        doc.moveDown();
        doc.font('Helvetica').fontSize(10).text('Thank you for your order!', { align: 'center' });

        doc.end();
    });
}

module.exports = { generateReceiptPdf };