/**
 * orderStatusTemplate.js
 * Generates the HTML body for the order status update email.
 * Ported from IKEA Laravel order-status-updated.blade.php → adapted for Adidas AWA.
 *
 * @param {object} order  - Sequelize Order instance with OrderItems[].Variant.Product
 * @returns {string}      - Full HTML string ready to pass to nodemailer
 */
function orderStatusTemplate(order) {
    const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const { buildReceiptLink } = require('./receiptLink');
    const receiptLink = buildReceiptLink(order, BASE_URL);
    const user  = order.User  || {};
    const items = order.OrderItems || [];

    const orderId = String(order.id).padStart(6, '0');
    const status  = order.status || 'pending';

    const statusConfig = {
        pending: {
            headerBg : '#111111',
            icon     : '🕐',
            title    : 'Order Received',
            message  : "Your order has been received and is awaiting processing. We'll update you as soon as it moves forward.",
            badgeBg  : '#f0f0f0',
            badgeColor: '#111111',
            msgBorder: '#767676',
            msgBg    : '#f5f5f0',
        },
        processing: {
            headerBg : '#1a1a2e',
            icon     : '⚙️',
            title    : 'Order Processing',
            message  : "Great news — your order is now being prepared and packed. We'll notify you once it's on its way.",
            badgeBg  : '#e3f2fd',
            badgeColor: '#1565c0',
            msgBorder: '#1565c0',
            msgBg    : '#f5f9ff',
        },
        shipped: {
            headerBg : '#0d3b66',
            icon     : '🚚',
            title    : 'Order Shipped',
            message  : "Your order is on its way! You'll receive it soon — thanks for your patience.",
            badgeBg  : '#e1f0ff',
            badgeColor: '#0d3b66',
            msgBorder: '#0d3b66',
            msgBg    : '#f5faff',
        },
        completed: {
            headerBg : '#1b4332',
            icon     : '✅',
            title    : 'Order Completed',
            message  : 'Your order has been delivered and marked as complete. We hope you love your new Adidas gear!',
            badgeBg  : '#e8f5e9',
            badgeColor: '#2e7d32',
            msgBorder: '#2e7d32',
            msgBg    : '#f5fff7',
        },
        cancelled: {
            headerBg : '#7f1d1d',
            icon     : '❌',
            title    : 'Order Cancelled',
            message  : 'Your order has been cancelled. If you paid online, a refund will be processed within 3–5 business days.',
            badgeBg  : '#ffebee',
            badgeColor: '#b71c1c',
            msgBorder: '#CC0008',
            msgBg    : '#fff8f8',
        },
        refunded: {
            headerBg : '#4a2b7a',
            icon     : '💸',
            title    : 'Order Refunded',
            message  : 'Your refund has been processed. Please allow 3–5 business days for it to reflect.',
            badgeBg  : '#f1e9ff',
            badgeColor: '#4a2b7a',
            msgBorder: '#4a2b7a',
            msgBg    : '#faf7ff',
        },
    };

    const cfg = statusConfig[status] || statusConfig.pending;
    const fmt = (n) => parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const subtotal   = parseFloat(order.total_amount) || 0;
    const shipping   = subtotal >= 3000 ? 0 : 150;
    const grandTotal = subtotal + shipping;

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    /* ── Item rows ── */
    const itemRows = items.map(item => {
        const variant = item.Variant || {};
        const product = variant.Product || {};
        const lineTotal = fmt(parseFloat(item.price || 0) * item.quantity);
        return `
        <div class="product-row">
            <div>
                <div class="product-name">${product.name || 'Product'}</div>
                <div class="product-qty">${variant.colorway || ''} · Size ${variant.size_type || ''} ${variant.size_value || ''} · Qty: ${item.quantity}</div>
            </div>
            <div class="product-price">₱${lineTotal}</div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Order Update — Adidas AWA</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f0;
            color: #111;
            padding: 32px 16px;
        }
        .wrapper { max-width: 600px; margin: 0 auto; }

        .email-header {
            background: ${cfg.headerBg};
            border-radius: 10px 10px 0 0;
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
        .meta-item { text-align: center; }
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

        .cta-wrap { text-align: center; margin: 28px 0; }
        .cta-btn {
            display: inline-block;
            background: #111111;
            color: #ffffff;
            font-weight: 800;
            font-size: 15px;
            padding: 14px 36px;
            border-radius: 2px;
            text-decoration: none;
            letter-spacing: 0.5px;
        }
        .cta-btn.secondary {
            background: #ffffff;
            color: #111111;
            border: 2px solid #111111;
            margin-left: 12px;
        }

        .email-footer {
            background: #111;
            border-radius: 0 0 10px 10px;
            padding: 24px 32px;
            text-align: center;
        }
        .email-footer p { color: rgba(255,255,255,0.5); font-size: 12px; line-height: 1.7; }
        .email-footer a { color: #ffffff; text-decoration: none; font-weight: 700; }
    </style>
</head>
<body>
<div class="wrapper">

    <!-- Header -->
    <div class="email-header">
        <div class="logo-box">ADIDAS</div>
        <span class="status-icon">${cfg.icon}</span>
        <h1>Order ${cfg.title}</h1>
        <p>Hi ${user.name || 'Customer'}, your order #${orderId} has been updated.</p>
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
                <div class="meta-label">New Status</div>
                <div class="meta-value">
                    <span class="status-badge">${statusLabel}</span>
                </div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Payment</div>
                <div class="meta-value">${(order.payment_status || 'Pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}</div>
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

        <!-- CTA -->
        <div class="cta-wrap">
            <a href="${BASE_URL}/order-confirmation.html?id=${order.id}" class="cta-btn">View Order Details →</a>
            <a href="${receiptLink}" class="cta-btn secondary" target="_blank">📄 Download PDF Receipt</a>
        </div>

        <p style="font-size:13px;color:#767676;text-align:center;line-height:1.6;">
            Need help? Reply to this email and our support team will assist you.
        </p>

    </div>

    <!-- Footer -->
    <div class="email-footer">
        <p>
            © ${new Date().getFullYear()} Adidas AWA. All rights reserved.<br>
            <a href="${BASE_URL}/index.html">Home</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/my-orders.html">My Orders</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/shop.html">Shop</a>
        </p>
    </div>

</div>
</body>
</html>`;
}

module.exports = orderStatusTemplate;