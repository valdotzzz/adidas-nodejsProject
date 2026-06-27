const PDFDocument = require('pdfkit');

function generateReceiptPdf(order) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // ── Header ──────────────────────────────────────────────
        doc.fontSize(20).font('Helvetica-Bold').text('ADIDAS', { align: 'left' });
        doc.fontSize(10).font('Helvetica').fillColor('#888').text('Order Receipt', { align: 'left' });
        doc.moveDown(1.5);

        // ── Order Info ──────────────────────────────────────────
        doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text(`Order #${String(order.id).padStart(6, '0')}`);
        doc.fontSize(10).font('Helvetica').fillColor('#555')
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
            .text(`Status: ${order.status.toUpperCase()}`)
            .text(`Payment Method: ${(order.payment_method || 'cod').toUpperCase()}`);
        doc.moveDown(1);

        // ── Shipping Info ───────────────────────────────────────
        doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('Shipping To:');
        doc.fontSize(10).font('Helvetica').fillColor('#555')
            .text(order.full_name)
            .text(order.phone)
            .text(`${order.address_line}, ${order.city}${order.province ? ', ' + order.province : ''} ${order.postal_code || ''}`);
        doc.moveDown(1.5);

        // ── Items Table Header ──────────────────────────────────
        doc.fillColor('#000').fontSize(11).font('Helvetica-Bold');
        const tableTop = doc.y;
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 320, tableTop);
        doc.text('Price', 380, tableTop);
        doc.text('Subtotal', 460, tableTop);
        doc.moveTo(50, tableTop + 18).lineTo(550, tableTop + 18).strokeColor('#ccc').stroke();
        doc.moveDown(1.5);

        // ── Items Rows ──────────────────────────────────────────
        doc.font('Helvetica').fontSize(10).fillColor('#333');
        let y = doc.y;
        const items = order.OrderItems || [];

        items.forEach(item => {
            const lineTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
            const itemLabel = `${item.product_name}${item.colorway ? ' - ' + item.colorway : ''}${item.size_value ? ' (Size ' + item.size_type + ' ' + item.size_value + ')' : ''}`;

            doc.text(itemLabel, 50, y, { width: 250 });
            doc.text(String(item.quantity), 320, y);
            doc.text(`₱${parseFloat(item.price).toFixed(2)}`, 380, y);
            doc.text(`₱${lineTotal}`, 460, y);

            y += 24;
        });

        doc.moveTo(50, y + 4).lineTo(550, y + 4).strokeColor('#ccc').stroke();
        y += 16;

        // ── Totals ──────────────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000');
        doc.text(`Total: ₱${parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 380, y);

        doc.moveDown(3);
        doc.fontSize(9).font('Helvetica').fillColor('#999').text('Thank you for shopping with Adidas AWA.', 50, doc.y, { align: 'center', width: 500 });

        doc.end();
    });
}

module.exports = generateReceiptPdf;