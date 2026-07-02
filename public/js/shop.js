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

    function buildCard(product) {
        const imageSrc = (product.ProductImages && product.ProductImages.length > 0)
            ? `/uploads/${product.ProductImages[0].image_path.replace(/^uploads\//, '')}`
            : 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

        const dayDiff    = Math.floor((new Date() - new Date(product.createdAt)) / 86400000);
        const badgeHtml  = dayDiff < 30 ? `<span class="product-card__badge product-card__badge--new">New</span>` : '';
        const catName    = product.Category ? product.Category.name : 'Adidas';

        return `
            <div class="product-card">
                <a href="product-details.html?id=${product.id}">
                    <div class="product-card__image">
                        <img src="${imageSrc}" alt="${product.name}" loading="lazy">
                        ${badgeHtml}
                    </div>
                    <div class="product-card__info">
                        <div class="product-card__category">${catName}</div>
                        <div class="product-card__name">${product.name}</div>
                        <div class="product-card__price">₱${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
});