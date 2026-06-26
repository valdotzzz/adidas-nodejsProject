$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadCart();

    function loadCart() {
        $.ajax({
            url: '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(cartItems) {
                $('#cart-loading').hide();

                if (!cartItems || cartItems.length === 0) {
                    $('#cart-empty').show();
                    $('#cart-layout').hide();
                    return;
                }

                renderCartItems(cartItems);
                updateSummary(cartItems);
                $('#cart-layout').css('display', 'grid');
            },
            error: function(xhr) {
                $('#cart-loading').hide();
                console.error('Failed to load cart:', xhr.responseText);
                $('#cart-empty').show();
            }
        });
    }

    function renderCartItems(cartItems) {
        const $container = $('#cart-items');
        $container.empty();

        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        $('#bag-item-count').text(`(${totalItems} ${totalItems === 1 ? 'item' : 'items'})`);

        cartItems.forEach(item => {
            const variant = item.Variant;
            const product = variant ? variant.Product : null;
            if (!product) return;

            const images = product.ProductImages || product.product_images;
            const imageSrc = (images && images.length > 0)
                ? images[0].image_path
                : 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

            const lineTotal = (parseFloat(product.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const lowStock = variant.stock_level > 0 && variant.stock_level <= 5;

            // Build quantity dropdown options (1 up to current stock, capped at 10 for sanity)
            const maxQty = Math.min(variant.stock_level, 10) || 1;
            let qtyOptions = '';
            for (let i = 1; i <= maxQty; i++) {
                qtyOptions += `<option value="${i}" ${i === item.quantity ? 'selected' : ''}>${i}</option>`;
            }

            const rowHtml = `
                <div class="cart-row" data-item-id="${item.id}">
                    <div class="cart-row__image">
                        <img src="${imageSrc}" alt="${product.name}">
                    </div>
                    <div class="cart-row__details">
                        <div>
                            <div class="cart-row__top">
                                <div>
                                    <div class="cart-row__name">${product.name}</div>
                                    <div class="cart-row__meta">
                                        ${variant.colorway}<br>
                                        Size: ${variant.size_type} ${variant.size_value}
                                    </div>
                                    ${lowStock ? `<div class="cart-row__stock-warning">Low in stock</div>` : ''}
                                </div>
                                <button class="cart-row__icon-btn remove-item-btn" title="Remove">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>
                                        <path d="M10 11v6"></path>
                                        <path d="M14 11v6"></path>
                                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"></path>
                                    </svg>
                                </button>
                            </div>

                            <div class="cart-row__bottom">
                                <select class="qty-dropdown qty-select">
                                    ${qtyOptions}
                                </select>
                                <div class="cart-row__price">₱${lineTotal}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            $container.append(rowHtml);
        });
    }

    function updateSummary(cartItems) {
        let subtotal = 0;
        let totalItems = 0;
        cartItems.forEach(item => {
            if (item.Variant && item.Variant.Product) {
                subtotal += parseFloat(item.Variant.Product.price) * item.quantity;
                totalItems += item.quantity;
            }
        });

        const shipping = subtotal >= 3000 ? 0 : 150;
        const total = subtotal + shipping;

        $('#summary-item-count').text(`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`);
        $('#cart-subtotal').text('₱' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#cart-shipping').text(shipping === 0 ? 'Free' : '₱' + shipping.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#cart-total').text('₱' + total.toLocaleString('en-US', { minimumFractionDigits: 2 }));

        const $note = $('#shipping-note');
        if (shipping > 0) {
            const remaining = (3000 - subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 });
            $note.text(`Add ₱${remaining} more for free shipping`);
        } else {
            $note.text('You qualify for free shipping!');
        }
    }

    // Quantity dropdown change
    $(document).on('change', '.qty-select', function() {
        const $row = $(this).closest('.cart-row');
        const newQty = parseInt($(this).val());
        updateQuantity($row.data('item-id'), newQty);
    });

    function updateQuantity(itemId, newQty) {
        $.ajax({
            url: `/api/cart/${itemId}`,
            method: 'PUT',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ quantity: newQty }),
            success: function() { loadCart(); },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not update quantity.');
            }
        });
    }

    $(document).on('click', '.remove-item-btn', function() {
        const itemId = $(this).closest('.cart-row').data('item-id');
        if (!confirm('Remove this item from your bag?')) return;

        $.ajax({
            url: `/api/cart/${itemId}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() { loadCart(); },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not remove item.');
            }
        });
    });

    $('#checkoutBtn').on('click', function() {
        window.location.href = 'checkout.html';
    });
});