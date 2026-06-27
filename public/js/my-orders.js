$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    $.ajax({
        url: '/api/checkout/orders',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(orders) {
            $('#orders-loading').hide();

            if (!orders || orders.length === 0) {
                $('#orders-empty').show();
                return;
            }

            renderOrders(orders);
        },
        error: function(xhr) {
            $('#orders-loading').hide();
            console.error('Failed to load orders:', xhr.responseText);
            $('#orders-empty').show();
        }
    });

    function renderOrders(orders) {
        const $list = $('#orders-list');
        $list.empty();

        const statusColors = {
            pending: '#c96a00',
            completed: '#2e7d32',
            cancelled: '#c62828'
        };

        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const total = parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const itemCount = order.OrderItems ? order.OrderItems.length : 0;
            const statusColor = statusColors[order.status] || '#888';

            $list.append(`
                <div style="border:1px solid #222; background:#111; padding:24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                    <div style="display:flex; gap:32px; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#888; margin-bottom:4px;">Order</div>
                            <div style="font-size:14px; font-weight:600; color:#fff;">#${String(order.id).padStart(6, '0')}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#888; margin-bottom:4px;">Date</div>
                            <div style="font-size:14px; font-weight:600; color:#fff;">${date}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#888; margin-bottom:4px;">Items</div>
                            <div style="font-size:14px; font-weight:600; color:#fff;">${itemCount}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#888; margin-bottom:4px;">Status</div>
                            <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:${statusColor};">${order.status}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#888; margin-bottom:4px;">Total</div>
                            <div style="font-size:14px; font-weight:700; color:#fff;">₱${total}</div>
                        </div>
                    </div>
                    <a href="order-confirmation.html?id=${order.id}" class="btn btn-dark" style="padding:10px 20px; font-size:12px;">View Details</a>
                </div>
            `);
        });
    }
});