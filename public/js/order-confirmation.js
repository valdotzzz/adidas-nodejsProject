$(document).ready(function() {
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!orderId) {
        $('#order-loading').text('No order specified.');
        return;
    }

    $.ajax({
        url: `/api/checkout/orders/${orderId}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(order) {
            $('#order-loading').hide();
            $('#order-details').show();

            $('#order-number').text('#' + String(order.id).padStart(6, '0'));
            $('#order-payment').text((order.payment_method || 'cod').toUpperCase());
            $('#order-total').text('₱' + parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }));
            $('#order-address').text(`${order.Address.address_line}, ${order.Address.city}`);
        },
        error: function(xhr) {
            $('#order-loading').text('Could not load order details.');
            console.error(xhr.responseText);
        }
    });
});