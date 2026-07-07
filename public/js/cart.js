$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadCart();

    function resolveProductImage(path) {
        if (!path) return 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';
        if (/^https?:\/\//i.test(path)) return path;
        return path.startsWith('/') ? path : `/${path}`;
    }

    function loadCart() {
        CartStore.resolve(token)
            .done(function(cartItems) {
                $('#cart-loading').hide();

                if (!cartItems || cartItems.length === 0) {
                    $('#cart-empty').show();
                    $('#cart-layout').hide();
                    return;
                }

                renderCartItems(cartItems);
                updateSummary(cartItems);
                $('#cart-layout').css('display', 'grid');
            })
            .fail(function(xhr) {
                $('#cart-loading').hide();
                console.error('Failed to load cart:', xhr.responseText);
                $('#cart-empty').show();
                $('#cart-layout').hide();
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
                ? resolveProductImage(images[0].image_path)
                : resolveProductImage(null);

            const lineTotal = (item.unit_price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const lowStock = variant.stock_level > 0 && variant.stock_level <= 5;

            // Track dynamic maximum bounds based on database stock level (capped at 10)
            const maxQty = Math.min(variant.stock_level, 10) || 1;

            const rowHtml = `
                <div class="cart-row" data-variant-id="${item.variant_id}">
                    <div class="cart-row__image">
                        <img src="${imageSrc}" alt="${product.name}">
                    </div>
                    <div class="cart-row__details">
                        <div>
                            <div class="cart-row__top">
                                <div>
                                    <div class="cart-row__name">${product.name}</div>
                                    <div class="cart-row__meta">
                                        ${variant.Colorway ? variant.Colorway.name : ''}<br>
                                        Size: ${variant.ShoeSize ? variant.ShoeSize.label : ''}
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
                                <div class="quantity-control">
                                    <button type="button" class="qty-btn qty-minus">−</button>
                                    <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${maxQty}">
                                    <button type="button" class="qty-btn qty-plus">+</button>
                                </div>
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
            subtotal += item.unit_price * item.quantity;
            totalItems += item.quantity;
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

    function updateQuantity(variantId, newQty) {
        CartStore.updateQuantity(variantId, newQty);
        loadCart();
    }

    /* --- Stepper Element Interactive Handlers --- */

    $(document).on('click', '.qty-minus', function() {
        const $input = $(this).siblings('.qty-input');
        let currentVal = parseInt($input.val()) || 1;
        if (currentVal > 1) {
            $input.val(currentVal - 1).trigger('change');
        }
    });

    $(document).on('click', '.qty-plus', function() {
        const $input = $(this).siblings('.qty-input');
        const maxVal = parseInt($input.attr('max')) || 10;
        let currentVal = parseInt($input.val()) || 1;

        if (currentVal < maxVal) {
            $input.val(currentVal + 1).trigger('change');
        } else {
            alert(`Cannot exceed available stock limit of ${maxVal}.`);
        }
    });

    $(document).on('change', '.qty-input', function() {
        const $input = $(this);
        const $row = $input.closest('.cart-row');
        const variantId = $row.data('variant-id');

        let minVal = parseInt($input.attr('min')) || 1;
        let maxVal = parseInt($input.attr('max')) || 10;
        let newVal = parseInt($input.val());

        if (isNaN(newVal) || newVal < minVal) {
            newVal = minVal;
        } else if (newVal > maxVal) {
            alert(`Maximum structural stock boundary limit is ${maxVal}`);
            newVal = maxVal;
        }

        $input.val(newVal);
        updateQuantity(variantId, newVal);
    });

    $(document).on('click', '.remove-item-btn', function() {
        const variantId = $(this).closest('.cart-row').data('variant-id');
        if (!confirm('Remove this item from your bag?')) return;

        CartStore.remove(variantId);
        loadCart();
    });

    $('#checkoutBtn').on('click', function() {
        window.location.href = 'checkout.html';
    });
});