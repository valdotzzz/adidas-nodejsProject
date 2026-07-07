/**
 * generateReceiptPdf.js
 * Builds the order receipt as a PDF Buffer using pdfkit.
 * Replaces the previous html-pdf-node / Chromium approach which crashed on Windows.
 *
 * Shared by:
 *   - utils/sendOrderEmail.js           (PDF email attachment)
 *   - controllers/receiptController.js  (direct "Download PDF Receipt" link)
 *
 * @param {object} order - Sequelize Order instance with:
 *   order.User
 *   order.Address
 *   order.OrderItems[].Variant.Product
 * @returns {Promise<Buffer>}
 */

const PDFDocument = require('pdfkit');
const statusConfig = require('./statusConfig');

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const len = clean.length === 3 ? 1 : 2;
    const r = parseInt(clean.slice(0, len).padEnd(2, clean[0]), 16);
    const g = parseInt(clean.slice(len, len * 2).padEnd(2, clean[len]), 16);
    const b = parseInt(clean.slice(len * 2, len * 3).padEnd(2, clean[len * 2]), 16);
    return [r, g, b];
}

// Draw a filled rectangle
function fillRect(doc, x, y, w, h, hex) {
    doc.save().rect(x, y, w, h).fill(hex).restore();
}

// Draw a left-border accent bar (replaces CSS border-left)
function accentBar(doc, x, y, h, hex) {
    fillRect(doc, x, y, 4, h, hex);
}

// ── Main export ───────────────────────────────────────────────────────────────

function generateReceiptPdf(order) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0, compress: true });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end',  ()    => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = 595.28;   // A4 width  (pt)
            const PAD = 40;     // side padding

            const user    = order.User    || {};
            const address = order.Address || {};
            const items   = order.OrderItems || [];

            const orderId   = String(order.id).padStart(6, '0');
            const status    = order.status || 'pending';
            const cfg       = statusConfig[status] || statusConfig.pending;
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
            const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const subtotal        = parseFloat(order.total_amount)       || 0;
            const shippingFee     = parseFloat(order.shipping_fee)        || 0;
            const discountAmount  = parseFloat(order.discount_amount)     || 0;
            const codeAmount      = parseFloat(order.discount_code_amount)|| 0;
            const grandTotal      = subtotal;   // total_amount is already the final figure

            // ── 1. HEADER BAND ──────────────────────────────────────────────
            const HEADER_H = 120;
            fillRect(doc, 0, 0, W, HEADER_H, cfg.headerBg);

            // ADIDAS wordmark box
            doc.save()
               .rect(PAD, 20, 90, 26)
               .fill('#ffffff');
            doc.fillColor('#111111')
               .font('Helvetica-Bold')
               .fontSize(12)
               .text('ADIDAS', PAD + 6, 27, { width: 78, align: 'center' });
            doc.restore();

            // Title + subtitle
            doc.fillColor('#ffffff')
               .font('Helvetica-Bold')
               .fontSize(18)
               .text(cfg.title, PAD, 55, { width: W - PAD * 2, align: 'center' });

            doc.font('Helvetica')
               .fontSize(11)
               .fillOpacity(0.85)
               .text(`Hi ${user.name || 'Customer'}, here is the receipt for Order #${orderId}.`, PAD, 82, {
                   width: W - PAD * 2, align: 'center'
               })
               .fillOpacity(1);

            // ── 2. ORDER META BAR ───────────────────────────────────────────
            let y = HEADER_H + 20;
            fillRect(doc, PAD, y, W - PAD * 2, 58, '#f5f5f0');

            const metaCols = [
                { label: 'ORDER',   value: `#${orderId}` },
                { label: 'DATE',    value: orderDate },
                { label: 'STATUS',  value: statusLabel },
                { label: 'PAYMENT', value: (order.payment_method || 'COD').toUpperCase() },
                { label: 'TOTAL',   value: `PHP ${fmt(grandTotal)}` },
            ];
            const colW = (W - PAD * 2) / metaCols.length;

            metaCols.forEach((col, i) => {
                const cx = PAD + i * colW;
                doc.fillColor('#767676').font('Helvetica-Bold').fontSize(8)
                   .text(col.label, cx, y + 10, { width: colW, align: 'center' });
                doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11)
                   .text(col.value, cx, y + 24, { width: colW, align: 'center' });
            });

            // ── 3. STATUS MESSAGE BOX ───────────────────────────────────────
            y += 58 + 18;
            const msgText  = cfg.message;
            const msgH     = 44;
            fillRect(doc, PAD, y, W - PAD * 2, msgH, cfg.msgBg);
            accentBar(doc, PAD, y, msgH, cfg.msgBorder);

            doc.fillColor('#333333').font('Helvetica').fontSize(11)
               .text(msgText, PAD + 14, y + 10, {
                   width: W - PAD * 2 - 18,
                   lineGap: 3
               });

            // ── 4. SHIPPING ADDRESS ─────────────────────────────────────────
            y += msgH + 22;

            doc.fillColor('#767676').font('Helvetica-Bold').fontSize(9)
               .text('SHIPPING ADDRESS', PAD, y);
            doc.moveTo(PAD, y + 13).lineTo(W - PAD, y + 13)
               .strokeColor('#e5e5e5').lineWidth(1).stroke();
            y += 20;

            const addrLines = [
                address.full_name  || user.name || '—',
                address.phone      || '',
                address.address_line || '',
                [address.city, address.province, address.postal_code].filter(Boolean).join(', '),
                address.country    || 'Philippines',
            ].filter(Boolean);

            doc.fillColor('#111111').font('Helvetica').fontSize(11);
            addrLines.forEach(line => {
                doc.text(line, PAD, y);
                y += 16;
            });

            // ── 5. ORDER SUMMARY ────────────────────────────────────────────
            y += 10;
            doc.fillColor('#767676').font('Helvetica-Bold').fontSize(9)
               .text('ORDER SUMMARY', PAD, y);
            doc.moveTo(PAD, y + 13).lineTo(W - PAD, y + 13)
               .strokeColor('#e5e5e5').lineWidth(1).stroke();
            y += 20;

            items.forEach(item => {
                const variant    = item.Variant || {};
                const product    = variant.Product || {};
                const name       = item.product_name || product.name || 'Product';
                const colorway   = item.colorway  || '';
                const sizeLabel  = item.size_value ? `Size US ${item.size_value}` : '';
                const meta       = [colorway, sizeLabel, `Qty: ${item.quantity}`].filter(Boolean).join('  ·  ');
                const lineTotal  = parseFloat(item.price || 0) * item.quantity;

                doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11)
                   .text(name, PAD, y, { width: W - PAD * 2 - 90 });

                doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11)
                   .text(`PHP ${fmt(lineTotal)}`, W - PAD - 90, y, { width: 90, align: 'right' });

                y += 16;

                doc.fillColor('#767676').font('Helvetica').fontSize(10)
                   .text(meta, PAD, y);

                y += 18;

                // divider
                doc.moveTo(PAD, y).lineTo(W - PAD, y)
                   .strokeColor('#f0f0f0').lineWidth(0.5).stroke();
                y += 8;
            });

            // ── 6. TOTALS BLOCK ─────────────────────────────────────────────
            y += 8;
            const totalsData = [
                { label: 'Subtotal (items)',   value: `PHP ${fmt(subtotal + discountAmount + codeAmount - shippingFee)}` },
                shippingFee > 0
                    ? { label: 'Shipping',     value: `PHP ${fmt(shippingFee)}` }
                    : { label: 'Shipping',     value: 'Free' },
            ];
            if (discountAmount > 0) {
                totalsData.push({ label: `Discount (${order.discount_type?.toUpperCase()})`, value: `- PHP ${fmt(discountAmount)}` });
            }
            if (codeAmount > 0) {
                totalsData.push({ label: 'Promo Code',                                        value: `- PHP ${fmt(codeAmount)}` });
            }

            const TOTALS_H = totalsData.length * 20 + 44;
            fillRect(doc, PAD, y, W - PAD * 2, TOTALS_H, '#f5f5f0');

            let ty = y + 12;
            totalsData.forEach(row => {
                doc.fillColor('#767676').font('Helvetica').fontSize(11)
                   .text(row.label, PAD + 14, ty, { width: W - PAD * 2 - 28 - 90 });
                doc.fillColor('#767676').font('Helvetica').fontSize(11)
                   .text(row.value, W - PAD - 90 - 14, ty, { width: 90, align: 'right' });
                ty += 20;
            });

            // Grand total separator
            doc.moveTo(PAD + 14, ty).lineTo(W - PAD - 14, ty)
               .strokeColor('#e5e5e5').lineWidth(1.5).stroke();
            ty += 10;

            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(14)
               .text('Total', PAD + 14, ty, { width: W - PAD * 2 - 28 - 90 });
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(14)
               .text(`PHP ${fmt(grandTotal)}`, W - PAD - 90 - 14, ty, { width: 90, align: 'right' });

            // ── 7. FOOTER BAND ──────────────────────────────────────────────
            y += TOTALS_H + 24;
            const FOOTER_H = 52;
            fillRect(doc, 0, y, W, FOOTER_H, '#111111');

            doc.fillColor('rgba(255,255,255,0.5)').font('Helvetica').fontSize(10)
               .text(
                   `© ${new Date().getFullYear()} Adidas AWA. All rights reserved.\nThank you for shopping with us!`,
                   PAD, y + 10,
                   { width: W - PAD * 2, align: 'center', lineGap: 3 }
               );

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateReceiptPdf };