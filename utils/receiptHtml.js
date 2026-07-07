/**
 * receiptHtmlTemplate.js
 * Builds the HTML for the PDF receipt — same visual design system as the
 * status-update email (utils/orderStatus.js): same statusConfig colors,
 * same badge, meta grid, message box, order summary, and totals layout.
 *
 * Deliberately drops the email-only bits that don't make sense on a
 * static PDF: the "View Order Details" / "Download PDF Receipt" buttons
 * and the "reply to this email" line.
 *
 * Used only by utils/generateReceiptPdf.js, which renders this HTML to
 * a PDF buffer with html-pdf-node.
 *
 * @param {object} order - Sequelize Order instance with:
 *   order.User
 *   order.OrderItems[].Variant.Product
 * @returns {string} Full HTML string ready to hand to html-pdf-node
 */
const statusConfig = require('./statusConfig');

function receiptHtmlTemplate(order) {
    const user  = order.User || {};
    const items = order.OrderItems || [];

    const orderId = String(order.id).padStart(6, '0');
    const status  = order.status || 'pending';
    const cfg     = statusConfig[status] || statusConfig.pending;

    const fmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const subtotal   = parseFloat(order.total_amount) || 0;
    const shipping   = subtotal >= 3000 ? 0 : 150;
    const grandTotal = subtotal + shipping;

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    /* ── Item rows ── */
    const itemRows = items.map(item => {
        const variant = item.Variant || {};
        const product = variant.Product || {};
        const lineTotal = fmt(parseFloat(item.price || 0) * item.quantity);
        return `
        <div class="product-row">
            <div>
                <div class="product-name">${product.name || 'Product'}</div>
                <div class="product-qty">${item.colorway || ''} · Size ${item.size_type || ''} ${item.size_value || ''} · Qty: ${item.quantity}</div>
            </div>
            <div class="product-price">₱${lineTotal}</div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt — Order #${orderId} — Adidas AWA</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #ffffff;
            color: #111;
        }
        .wrapper { width: 100%; }

        .email-header {
            background: ${cfg.headerBg};
            padding: 32px;
            text-align: center;
        }
        .logo-box {
            display: inline-block;
            background: #ffffff;
            color: #111111;
            font-weight: 900;
            font-size: 22px;
            letter-spacing: 3px;
            padding: 6px 18px;
            border-radius: 2px;
            margin-bottom: 20px;
        }
        .status-icon { font-size: 48px; display: block; margin-bottom: 12px; }
        .email-header h1 { color: white; font-size: 24px; font-weight: 800; }
        .email-header p  { color: rgba(255,255,255,0.85); font-size: 15px; margin-top: 8px; }

        .email-body { background: white; padding: 32px; }

        .order-meta {
            display: flex;
            justify-content: space-between;
            background: #f5f5f0;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 28px;
            flex-wrap: wrap;
            gap: 12px;
        }
        .meta-item { text-align: center; flex: 1; }
        .meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #767676; }
        .meta-value { font-size: 15px; font-weight: 800; color: #111; margin-top: 3px; }

        .status-badge {
            display: inline-block;
            background: ${cfg.badgeBg};
            color: ${cfg.badgeColor};
            font-size: 13px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 40px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .message-box {
            border-left: 4px solid ${cfg.msgBorder};
            background: ${cfg.msgBg};
            border-radius: 0 8px 8px 0;
            padding: 16px 20px;
            margin-bottom: 28px;
            font-size: 14px;
            line-height: 1.7;
            color: #333;
        }

        .section-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #767676;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 8px;
            margin-bottom: 16px;
        }

        .product-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
            gap: 12px;
        }
        .product-row:last-child { border-bottom: none; }
        .product-name { font-size: 14px; font-weight: 700; }
        .product-qty  { font-size: 13px; color: #767676; margin-top: 2px; }
        .product-price { font-size: 14px; font-weight: 800; white-space: nowrap; }

        .totals {
            background: #f5f5f0;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 20px 0 28px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            padding: 4px 0;
            color: #767676;
        }
        .totals-row.grand {
            font-size: 18px;
            font-weight: 900;
            color: #111;
            border-top: 2px solid #e5e5e5;
            margin-top: 8px;
            padding-top: 12px;
        }

        .email-footer {
            background: #111;
            padding: 24px 32px;
            text-align: center;
        }
        .email-footer p { color: rgba(255,255,255,0.5); font-size: 12px; line-height: 1.7; }
    </style>
</head>
<body>
<div class="wrapper">

    <!-- Header -->
    <div class="email-header">
        <div class="logo-box">ADIDAS</div>
        <span class="status-icon">${cfg.icon}</span>
        <h1>${cfg.title}</h1>
        <p>Hi ${user.name || 'Customer'}, here is the receipt for your order #${orderId}.</p>
    </div>

    <!-- Body -->
    <div class="email-body">

        <!-- Order meta -->
        <div class="order-meta">
            <div class="meta-item">
                <div class="meta-label">Order</div>
                <div class="meta-value">#${orderId}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Date</div>
                <div class="meta-value">${orderDate}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Status</div>
                <div class="meta-value">
                    <span class="status-badge">${statusLabel}</span>
                </div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Payment</div>
                <div class="meta-value">${(order.payment_method || 'COD').toUpperCase()}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Total</div>
                <div class="meta-value">₱${fmt(grandTotal)}</div>
            </div>
        </div>

        <!-- Status message -->
        <div class="message-box">
            ${cfg.message}
        </div>

        <!-- Items summary -->
        <div class="section-title">Order Summary</div>
        ${itemRows}

        <!-- Totals -->
        <div class="totals">
            <div class="totals-row">
                <span>Subtotal</span>
                <span>₱${fmt(subtotal)}</span>
            </div>
            <div class="totals-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : '₱' + fmt(shipping)}</span>
            </div>
            <div class="totals-row grand">
                <span>Total</span>
                <span>₱${fmt(grandTotal)}</span>
            </div>
        </div>

    </div>

    <!-- Footer -->
    <div class="email-footer">
        <p>
            © ${new Date().getFullYear()} Adidas AWA. All rights reserved.<br>
            Thank you for shopping with us!
        </p>
    </div>

</div>
</body>
</html>`;
}

module.exports = receiptHtmlTemplate;