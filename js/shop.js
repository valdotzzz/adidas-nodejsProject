$(document).ready(function () {

    /* =========================================================================
       CONFIGURATION
    ========================================================================= */
    const PRODUCTS_PER_PAGE = 9; // slightly smaller so scroll kicks in sooner

    /* =========================================================================
       STATE
    ========================================================================= */
    const urlParams      = new URLSearchParams(window.location.search);
    let currentCategory  = urlParams.get('category') || 'all';
    let currentPage      = 1;
    let activeProducts   = [];
    let isLoading        = false;   // infinite scroll guard
    let allLoaded        = false;   // true once last page has been appended

    const searchQuery = urlParams.get('search') || '';
    if (searchQuery) $('#headerSearchInput').val(searchQuery);

    let wishlistedIds = new Set();
    const shopToken = localStorage.getItem('token');
    if (shopToken) {
        $.ajax({
            url: '/api/wishlist/ids',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + shopToken },
            success: function(ids) {
                wishlistedIds = new Set((ids || []).map(String));
                $('.wishlist-heart-btn').each(function() {
                    if (wishlistedIds.has(String($(this).data('productId')))) {
                        $(this).addClass('is-active');
                    }
                });
            },
            error: function() {}
        });
    }

    updateFilterButtonUI(currentCategory);
    loadCatalog(currentCategory);

    /* =========================================================================
       FILTER BUTTONS
    ========================================================================= */
    $('.filter-btn').on('click', function () {
        const sel = $(this).data('category');
        const newUrl = sel === 'all' ? 'shop.html' : `shop.html?category=${sel}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        currentCategory = sel;
        updateFilterButtonUI(sel);
        loadCatalog(sel);
    });

    /* =========================================================================
       NUMBERED PAGINATION — click handler
    ========================================================================= */
    $(document).on('click', '.pagination-btn', function () {
        if ($(this).hasClass('disabled')) return;
        currentPage = parseInt($(this).data('page'));

        // In pagination mode, replace the grid rather than append
        renderPageReplace(currentPage);
        $('html, body').animate({ scrollTop: $('.products-section').offset().top - 100 }, 280);
    });

    /* =========================================================================
       LOAD CATALOG FROM API
    ========================================================================= */
    function loadCatalog(category) {
        $('#catalog-title').text(category === 'all' ? 'All Shoes' : `${category.charAt(0).toUpperCase() + category.slice(1)} Drops`);
        $('#catalog-grid').html('<div style="grid-column:1/-1; padding:60px 0; text-align:center; color:#555; font-size:13px; text-transform:uppercase; letter-spacing:2px;">Loading…</div>');
        $('#catalog-pagination').empty();
        $('#load-more-trigger').hide();

        $.ajax({
            url: '/api/products',
            method: 'GET',
            dataType: 'json',
            success: function (products) {
                activeProducts = products.filter(p => {
                    const catMatch    = category === 'all' || (p.Category && p.Category.name.toLowerCase() === category.toLowerCase());
                    const searchMatch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.style_code || '').toLowerCase().includes(searchQuery.toLowerCase());
                    return catMatch && searchMatch;
                });

                currentPage = 1;
                allLoaded   = false;
                isLoading   = false;

                $('#catalog-grid').empty();

                if (activeProducts.length === 0) {
                    renderEmptyMessage($('#catalog-grid'));
                    return;
                }

                // First page — append (sets up the grid)
                appendPage(1);
                renderPaginationControls(1, totalPages());

                // Show infinite scroll trigger only if there are more pages
                if (totalPages() > 1) $('#load-more-trigger').show();
            },
            error: function (xhr) {
                renderEmptyMessage($('#catalog-grid'));
                console.error('Catalog fetch error:', xhr.statusText);
            }
        });
    }

    /* =========================================================================
       RENDER HELPERS
    ========================================================================= */
    function totalPages() {
        return Math.ceil(activeProducts.length / PRODUCTS_PER_PAGE);
    }

    function resolveProductImage(path) {
        if (!path) return DEFAULT_PRODUCT_IMAGE;
        if (/^https?:\/\//i.test(path)) return path;
        return path.startsWith('/') ? path : `/${path}`;
    }
    const DEFAULT_PRODUCT_IMAGE = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

    function buildCard(product) {
        const imageSrc = (product.ProductImages && product.ProductImages.length > 0)
            ? resolveProductImage(product.ProductImages[0].image_path)
            : DEFAULT_PRODUCT_IMAGE;

        const dayDiff    = Math.floor((new Date() - new Date(product.createdAt)) / 86400000);
        const catName    = product.Category ? product.Category.name : 'Adidas';

        const price      = parseFloat(product.price);
        const salePrice  = product.sale_price != null ? parseFloat(product.sale_price) : null;
        const onSale     = salePrice != null && salePrice < price;

        const badgeHtml  = onSale
            ? `<span class="product-card__badge product-card__badge--sale">Sale</span>`
            : (dayDiff < 30 ? `<span class="product-card__badge product-card__badge--new">New</span>` : '');

        const priceHtml  = onSale
            ? `<span class="price--original">₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span><span class="price--on-sale">₱${salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`
            : `₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const isWishlisted = wishlistedIds.has(String(product.id));

        return `
            <div class="product-card">
                <div class="product-card__image" style="position:relative;">
                    <button type="button" class="wishlist-heart-btn ${isWishlisted ? 'is-active' : ''}" data-product-id="${product.id}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4a5.4 5.4 0 016.5 3 5.4 5.4 0 016.5-3C22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z"></path></svg>
                    </button>
                    <a href="product-details.html?id=${product.id}">
                        <img src="${imageSrc}" alt="${product.name}" loading="lazy">
                        ${badgeHtml}
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
            </div>`;
    }

    // APPEND — adds one page worth of cards to the existing grid (infinite scroll mode)
    function appendPage(page) {
        const start = (page - 1) * PRODUCTS_PER_PAGE;
        const slice = activeProducts.slice(start, start + PRODUCTS_PER_PAGE);
        slice.forEach(p => $('#catalog-grid').append(buildCard(p)));
    }

    // REPLACE — clears the grid and renders one page (numbered pagination mode)
    function renderPageReplace(page) {
        $('#catalog-grid').empty();
        appendPage(page);
        // After a manual pagination jump, reset infinite scroll state to continue from that page
        allLoaded = (page >= totalPages());
        if (!allLoaded) $('#load-more-trigger').show();
        else            $('#load-more-trigger').hide();
        renderPaginationControls(page, totalPages());
    }

    /* =========================================================================
       INFINITE SCROLL
    ========================================================================= */
    $(window).on('scroll.infiniteShop', function () {
        if (isLoading || allLoaded) return;

        const trigger  = document.getElementById('load-more-trigger');
        if (!trigger) return;

        const triggerTop = trigger.getBoundingClientRect().top;
        const viewHeight = window.innerHeight;

        // Fire when the trigger div is within 200px of the viewport bottom
        if (triggerTop <= viewHeight + 200) {
            loadNextPage();
        }
    });

    function loadNextPage() {
        if (isLoading || allLoaded) return;
        isLoading = true;

        const nextPage = currentPage + 1;
        const tp       = totalPages();

        // Show spinner
        $('#load-more-spinner').show();

        // Slight delay so the spinner is visible (keeps it feeling intentional)
        setTimeout(function () {
            appendPage(nextPage);
            currentPage = nextPage;

            $('#load-more-spinner').hide();
            isLoading = false;

            if (currentPage >= tp) {
                allLoaded = true;
                $('#load-more-trigger').hide();
                $('#all-loaded-msg').fadeIn(300);
            }

            renderPaginationControls(currentPage, tp);
        }, 380);
    }

    /* =========================================================================
       PAGINATION CONTROLS (numbered, still functional alongside infinite scroll)
    ========================================================================= */
    function renderPaginationControls(page, tp) {
        const $p = $('#catalog-pagination').empty();
        if (tp <= 1) return;

        const base     = 'min-width:36px; height:36px; padding:0 10px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid;';
        const normal   = base + 'background:#000; color:#fff; border-color:#333;';
        const active   = base + 'background:#fff; color:#000; border-color:#fff; cursor:default;';
        const disabled = base + 'background:#000; color:#444; border-color:#222; cursor:not-allowed;';

        $p.append(`<button class="pagination-btn ${page===1?'disabled':''}" data-page="${page-1}" style="${page===1?disabled:normal}">‹ Prev</button>`);

        // Show at most 7 page buttons with ellipsis
        const range = pageRange(page, tp);
        range.forEach(n => {
            if (n === '…') {
                $p.append(`<span style="padding:0 6px; color:#555; line-height:36px;">…</span>`);
            } else {
                $p.append(`<button class="pagination-btn ${n===page?'active':''}" data-page="${n}" style="${n===page?active:normal}">${n}</button>`);
            }
        });

        $p.append(`<button class="pagination-btn ${page===tp?'disabled':''}" data-page="${page+1}" style="${page===tp?disabled:normal}">Next ›</button>`);
    }

    // Returns an array like [1, 2, '…', 7, 8, 9, '…', 15]
    /*function pageRange(cur, tp) {
        if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
        const pages = new Set([1, tp]);
        for (let i = Math.max(1, cur - 1); i <= Math.min(tp, cur + 1); i++) pages.add(i);
        const sorted = [...pages].sort((a, b) => a - b);
        const result = [];
        let prev = 0;
        sorted.forEach(n => {
            if (n - prev > 1) result.push('…');
            result.push(n);
            prev = n;
        });
        return result;
    }*/

    /* =========================================================================
       UTILITIES
    ========================================================================= */
    function updateFilterButtonUI(cat) {
        $('.filter-btn').removeClass('btn-primary').addClass('btn-dark');
        $(`.filter-btn[data-category="${cat}"]`).removeClass('btn-dark').addClass('btn-primary');
    }

    function renderEmptyMessage($el) {
        $el.html(`<div style="grid-column:1/-1; text-align:center; padding:80px 0; color:#555; font-size:13px; text-transform:uppercase; letter-spacing:2px;">No products found.</div>`);
    }

    /* =========================================================================
       WISHLIST HEART TOGGLE (delegated — cards are rebuilt constantly)
    ========================================================================= */
    $(document).on('click', '.wishlist-heart-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const $btn = $(this);
        const productId = $btn.data('productId');
        const isActive = $btn.hasClass('is-active');
        $btn.prop('disabled', true);

        if (isActive) {
            $.ajax({
                url: `/api/wishlist/${productId}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function() {
                    wishlistedIds.delete(String(productId));
                    $btn.removeClass('is-active').attr('title', 'Add to Wishlist').prop('disabled', false);
                    if (typeof loadWishlistCount === 'function') loadWishlistCount(token);
                },
                error: function() { $btn.prop('disabled', false); }
            });
        } else {
            $.ajax({
                url: '/api/wishlist',
                method: 'POST',
                contentType: 'application/json',
                headers: { 'Authorization': 'Bearer ' + token },
                data: JSON.stringify({ product_id: productId }),
                success: function() {
                    wishlistedIds.add(String(productId));
                    $btn.addClass('is-active').attr('title', 'Remove from Wishlist').prop('disabled', false);
                    if (typeof loadWishlistCount === 'function') loadWishlistCount(token);
                },
                error: function() { $btn.prop('disabled', false); }
            });
        }
    });
});