/**
 * orderConfirmationTemplate.js
 * Generates the HTML body for the order confirmation email.
 * Ported from IKEA Laravel order-confirmation.blade.php → adapted for Adidas AWA.
 *
 * @param {object} order  - Sequelize Order instance with nested associations:
 *                          order.OrderItems[].Variant.Product, order.Address, order.User
 * @returns {string}      - Full HTML string ready to pass to nodemailer
 */
function orderConfirmationTemplate(order) {
    const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const { buildReceiptLink } = require('./receiptLink');
    const receiptLink = buildReceiptLink(order, BASE_URL);
    const user    = order.User    || {};
    const address = order.Address || {};
    const items   = order.OrderItems || [];

    const orderId   = String(order.id).padStart(6, '0');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const subtotal  = parseFloat(order.total_amount) || 0;
    const shipping  = subtotal >= 3000 ? 0 : 150;
    const grandTotal = subtotal + shipping;

    const fmt = (n) => parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const paymentLabels = {
        cod:           'Cash on Delivery',
        gcash:         'GCash',
        bank_transfer: 'Bank Transfer',
        card:          'Credit / Debit Card',
    };
    const paymentLabel = paymentLabels[order.payment_method] || (order.payment_method || 'N/A');

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
    <title>Order Confirmed — Adidas AWA</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f0;
            color: #111;
            padding: 32px 16px;
        }
        .wrapper { max-width: 600px; margin: 0 auto; }

        /* Header */
        .email-header {
            background: #111111;
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
        .email-header h1 { color: white; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .email-header p  { color: rgba(255,255,255,0.75); font-size: 15px; margin-top: 8px; }

        /* Body */
        .email-body { background: white; padding: 32px; }

        /* Order meta strip */
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

        /* Section title */
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

        /* Product rows */
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

        /* Totals */
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

        /* Delivery box */
        .delivery-box {
            border: 1.5px solid #e5e5e5;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 28px;
        }
        .delivery-box p { font-size: 14px; line-height: 1.6; color: #444; }
        .delivery-box strong { color: #111; }
        .payment-badge {
            display: inline-block;
            background: #f0f0f0;
            color: #111;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 40px;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* CTA */
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

        /* Footer */
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
        <h1>Your order is confirmed! 🎉</h1>
        <p>Thank you, ${user.name || 'Customer'}. We've received your order and it's being processed.</p>
    </div>

    <!-- Body -->
    <div class="email-body">

        <!-- Order meta -->
        <div class="order-meta">
            <div class="meta-item">
                <div class="meta-label">Order Number</div>
                <div class="meta-value">#${orderId}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Date</div>
                <div class="meta-value">${orderDate}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Status</div>
                <div class="meta-value">${(order.status || 'Pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Total</div>
                <div class="meta-value">₱${fmt(grandTotal)}</div>
            </div>
        </div>

        <!-- Items -->
        <div class="section-title">Items Ordered</div>
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

        <!-- Delivery details -->
        <div class="section-title">Delivery Details</div>
        <div class="delivery-box">
            <p>
                <strong>${address.full_name || user.name || ''}</strong><br>
                ${address.address_line || ''}<br>
                ${address.city || ''}, ${address.province || ''} ${address.postal_code || ''}<br>
                📞 ${address.phone || user.phone || ''}
            </p>
            <div class="payment-badge">Payment: ${paymentLabel}</div>
            ${order.notes ? `<p style="margin-top:12px;font-size:13px;color:#767676;"><strong>Notes:</strong> ${order.notes}</p>` : ''}
        </div>

        <!-- CTA -->
        <div class="cta-wrap">
            <a href="${BASE_URL}/order-confirmation.html?id=${order.id}" class="cta-btn">View Order Details →</a>
            <a href="${receiptLink}" class="cta-btn secondary" target="_blank">📄 Download PDF Receipt</a>
        </div>

        <p style="font-size:13px;color:#767676;text-align:center;line-height:1.6;">
            Questions about your order? Reply to this email and our team will assist you.
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

module.exports = orderConfirmationTemplate;