$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const DEFAULT_PRODUCT_IMAGE = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

    function resolveProductImage(path) {
        if (!path) return DEFAULT_PRODUCT_IMAGE;
        if (/^https?:\/\//i.test(path)) return path;
        return path.startsWith('/') ? path : `/${path}`;
    }

    loadWishlist();

    function loadWishlist() {
        $.ajax({
            url: '/api/wishlist',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(items) {
                $('#wishlist-loading').hide();

                if (!items || items.length === 0) {
                    $('#wishlist-empty').show();
                    return;
                }

                renderWishlist(items);
            },
            error: function(xhr) {
                $('#wishlist-loading').hide();
                console.error('Failed to load wishlist:', xhr.responseText);
                $('#wishlist-empty').show();
            }
        });
    }

    function renderWishlist(items) {
        const $grid = $('#wishlist-grid');
        $grid.empty();

        items.forEach(item => {
            const product = item.Product;
            if (!product) return; // guard against orphaned rows

            const imageSrc = (product.ProductImages && product.ProductImages.length > 0)
                ? resolveProductImage(product.ProductImages[0].image_path)
                : DEFAULT_PRODUCT_IMAGE;

            const price     = parseFloat(product.price);
            const salePrice = product.sale_price != null ? parseFloat(product.sale_price) : null;
            const onSale    = salePrice != null && salePrice < price;

            const priceHtml = onSale
                ? `<span class="price--original">₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span><span class="price--on-sale">₱${salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`
                : `₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

            const catName = product.Category ? product.Category.name : 'Adidas';
            const saleBadge = onSale ? `<span class="product-card__badge product-card__badge--sale">Sale</span>` : '';

            $grid.append(`
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-card__image" style="position:relative;">
                        <button type="button" class="wishlist-remove-btn" data-product-id="${product.id}" title="Remove from Wishlist">✕ Remove</button>
                        <a href="product-details.html?id=${product.id}">
                            <img src="${imageSrc}" alt="${product.name}" loading="lazy">
                            ${saleBadge}
                        </a>
                    </div>
                    <a href="product-details.html?id=${product.id}" style="text-decoration:none;">
                        <div class="product-card__info">
                            <div class="product-card__category">${catName}</div>
                            <div class="product-card__name">${product.name}</div>
                            <div class="product-card__price">${priceHtml}</div>
                        </div>
                    </a>
                    <a href="product-details.html?id=${product.id}" class="product-card__quick-add" style="display:block; text-align:center; text-decoration:none;">
                        View Details
                    </a>
                </div>
            `);
        });
    }

    // Remove item from wishlist — pulls it out of the grid on success
    $(document).on('click', '.wishlist-remove-btn', function() {
        const $btn = $(this);
        const $card = $btn.closest('.product-card');
        const productId = $btn.data('productId');

        $btn.prop('disabled', true).text('Removing...');

        $.ajax({
            url: `/api/wishlist/${productId}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                $card.fadeOut(200, function() {
                    $(this).remove();
                    if ($('#wishlist-grid').children().length === 0) {
                        $('#wishlist-empty').show();
                    }
                });
                if (typeof loadWishlistCount === 'function') loadWishlistCount(token);
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('✕ Remove');
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not remove item.');
            }
        });
    });
});
