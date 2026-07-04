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

    const FALLBACK_PRODUCT_IMAGE = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

    // Works for both locally-uploaded images (relative /uploads/... paths)
    // and images referenced by full external URL.
    function resolveImagePath(path) {
        if (!path) return FALLBACK_PRODUCT_IMAGE;
        return /^https?:\/\//i.test(path) ? path : (path.startsWith('/') ? path : `/${path}`);
    }

    function renderOrderItems(order) {
        const items = order.OrderItems || [];
        const $wrap = $('#order-items').empty();

        if (items.length === 0) return;

        items.forEach(item => {
            const product = item.Product || {};
            const images = product.ProductImages || [];
            const imageSrc = resolveImagePath(images.length > 0 ? images[0].image_path : null);

            const detailParts = [];
            if (item.colorway) detailParts.push(item.colorway);
            if (item.size_value) detailParts.push(`Size ${item.size_value} ${item.size_type || ''}`.trim());
            detailParts.push(`Qty ${item.quantity}`);

            $wrap.append(`
                <div class="order-item-row" data-product-id="${item.product_id}" style="display:flex; gap:16px; align-items:center; padding:14px 0; border-bottom:1px solid #1a1a1a; cursor:pointer;">
                    <div style="width:72px; height:72px; flex-shrink:0; background:#111; border:1px solid #1a1a1a; display:flex; align-items:center; justify-content:center;">
                        <img src="${imageSrc}" alt="${item.product_name}" style="max-width:100%; max-height:100%; object-fit:contain;">
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:14px; color:#fff; font-weight:700;">${item.product_name}</div>
                        <div style="font-size:12px; color:#888; margin-top:4px;">${detailParts.join(' • ')}</div>
                    </div>
                    <div style="font-size:14px; color:#fff; font-weight:700;">₱${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
            `);
        });

        $wrap.show();
    }

    // Clicking an order item takes you to that product's detail page
    $(document).on('click', '.order-item-row', function() {
        const productId = $(this).data('product-id');
        if (productId) window.location.href = `product-details.html?id=${productId}`;
    });

    $.ajax({
        url: `/api/checkout/orders/${orderId}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(order) {
            $('#order-loading').hide();
            $('#order-details').show();
            renderOrderItems(order);

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