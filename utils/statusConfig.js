/**
 * statusConfig.js
 * Single source of truth for per-status colors/copy used by:
 *   - utils/orderStatus.js        (HTML status-update email)
 *   - utils/generateReceiptPdf.js (PDF receipt attachment)
 *
 * Keeping this in one file means the PDF and the email can never
 * show different colors/labels for the same status.
 */
const statusConfig = {
    pending: {
        headerBg  : '#111111',
        icon      : '🕐',
        title     : 'Order Received',
        message   : "Your order has been received and is awaiting processing. We'll update you as soon as it moves forward.",
        badgeBg   : '#f0f0f0',
        badgeColor: '#111111',
        msgBorder : '#767676',
        msgBg     : '#f5f5f0',
    },
    processing: {
        headerBg  : '#1a1a2e',
        icon      : '⚙️',
        title     : 'Order Processing',
        message   : "Great news — your order is now being prepared and packed. We'll notify you once it's on its way.",
        badgeBg   : '#e3f2fd',
        badgeColor: '#1565c0',
        msgBorder : '#1565c0',
        msgBg     : '#f5f9ff',
    },
    shipped: {
        headerBg  : '#0d3b66',
        icon      : '🚚',
        title     : 'Order Shipped',
        message   : "Your order is on its way! You'll receive it soon — thanks for your patience.",
        badgeBg   : '#e1f0ff',
        badgeColor: '#0d3b66',
        msgBorder : '#0d3b66',
        msgBg     : '#f5faff',
    },
    completed: {
        headerBg  : '#1b4332',
        icon      : '✅',
        title     : 'Order Completed',
        message   : 'Your order has been delivered and marked as complete. We hope you love your new Adidas gear!',
        badgeBg   : '#e8f5e9',
        badgeColor: '#2e7d32',
        msgBorder : '#2e7d32',
        msgBg     : '#f5fff7',
    },
    cancelled: {
        headerBg  : '#7f1d1d',
        icon      : '❌',
        title     : 'Order Cancelled',
        message   : 'Your order has been cancelled. If you paid online, a refund will be processed within 3–5 business days.',
        badgeBg   : '#ffebee',
        badgeColor: '#b71c1c',
        msgBorder : '#CC0008',
        msgBg     : '#fff8f8',
    },
    refunded: {
        headerBg  : '#4a2b7a',
        icon      : '💸',
        title     : 'Order Refunded',
        message   : 'Your refund has been processed. Please allow 3–5 business days for it to reflect.',
        badgeBg   : '#f1e9ff',
        badgeColor: '#4a2b7a',
        msgBorder : '#4a2b7a',
        msgBg     : '#faf7ff',
    },
};

module.exports = statusConfig;