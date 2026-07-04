/**
 * generateReceiptPdf.js
 * Builds the order receipt PDF as a Buffer by rendering the same HTML
 * design used for the emails (see utils/receiptHtml.js / utils/orderStatus.js)
 * through a headless browser — so the PDF is a direct render of that
 * markup, not a hand-drawn approximation of it.
 *
 * Shared by:
 *   - utils/sendOrderEmail.js           (PDF email attachment)
 *   - controllers/receiptController.js  (direct "Download PDF Receipt" link)
 *
 * @param {object} order - Sequelize Order instance with:
 *   order.User
 *   order.OrderItems[].Variant.Product
 * @returns {Promise<Buffer>}
 */
const htmlPdf = require('html-pdf-node');
const receiptHtmlTemplate = require('./receiptHtml');

async function generateReceiptPdf(order) {
    const html = receiptHtmlTemplate(order);

    const file = { content: html };
    const options = {
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    };

    return htmlPdf.generatePdf(file, options);
}

module.exports = { generateReceiptPdf };