$(document).ready(function() {
    const PRODUCTS_PER_PAGE = 12;

    // 1. Extract category state parameters from URL query string strings
    const urlParams = new URLSearchParams(window.location.search);
    let currentCategory = urlParams.get('category') || 'all';

    let currentPage = 1;
    let activeProducts = []; // holds the currently filtered list, so pagination can slice it

    const searchQuery = urlParams.get('search') || '';
    if (searchQuery) {
        $('#headerSearchInput').val(searchQuery); // pre-fill the search box if coming from a search
    }

    // Highlight the active button matching URL state query row fields
    updateFilterButtonUI(currentCategory);
    loadCatalog(currentCategory);

    // 2. Click Handler for dynamic sorting without reloading pages
    $('.filter-btn').on('click', function() {
        const selectedCategory = $(this).data('category');

        // Update URL path parameters without refreshing the client framework state
        const newUrl = selectedCategory === 'all' ? 'shop.html' : `shop.html?category=${selectedCategory}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        updateFilterButtonUI(selectedCategory);
        loadCatalog(selectedCategory);
    });

    // 3. Pagination click handler — delegated since buttons are re-rendered each time
    $(document).on('click', '.pagination-btn', function() {
        if ($(this).hasClass('disabled')) return;

        const targetPage = $(this).data('page');
        currentPage = targetPage;
        renderPage(currentPage);

        // Scroll back to the top of the catalog so the new page is visible
        $('html, body').animate({ scrollTop: $('.products-section').offset().top - 100 }, 300);
    });

    function loadCatalog(category) {
        // Adapt label context texts based on dynamic parameters
        if (category === 'all') {
            $('#catalog-title').text('All Shoes');
        } else {
            $('#catalog-title').text(`${category} Drops`);
        }

        // Trigger request to backend REST API route
        $.ajax({
            url: '/api/products',
            method: 'GET',
            dataType: 'json',
            success: function(products) {
                // Client-side filtering check against category payload structural strings
                activeProducts = products.filter(product => {
                    const matchesCategory = category === 'all' || (product.Category && product.Category.name.toLowerCase() === category.toLowerCase());
                    const matchesSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                });

                currentPage = 1; // reset to page 1 every time the filter/search changes
                renderPage(currentPage);
            },
            error: function(xhr) {
                console.error("Failed to recover product grid collection items:", xhr.statusText);
                renderEmptyMessage($('#catalog-grid'));
                $('#catalog-pagination').empty();
            }
        });
    }

    function renderPage(page) {
        const container = $('#catalog-grid');
        container.empty();

        if (activeProducts.length === 0) {
            renderEmptyMessage(container);
            $('#catalog-pagination').empty();
            return;
        }

        const totalPages = Math.ceil(activeProducts.length / PRODUCTS_PER_PAGE);
        const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
        const pageItems = activeProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

        pageItems.forEach(product => {
            const imageSrc = (product.ProductImages && product.ProductImages.length > 0)
                ? product.ProductImages[0].image_path
                : 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

            const createdDate = new Date(product.createdAt);
            const systemDate = new Date();
            const dayDifference = Math.floor((systemDate - createdDate) / (1000 * 60 * 60 * 24));
            const badgeHtml = (dayDifference < 30) ? `<span class="product-card__badge product-card__badge--new">New</span>` : '';
            const categoryName = product.Category ? product.Category.name : 'Adidas';

            const cardHtml = `
                <div class="product-card">
                    <a href="product-details.html?id=${product.id}">
                        <div class="product-card__image">
                            <img src="${imageSrc}" alt="${product.name}">
                            ${badgeHtml}
                        </div>
                        <div class="product-card__info">
                            <div class="product-card__category">${categoryName}</div>
                            <div class="product-card__name">${product.name}</div>
                            <div class="product-card__price">
                                ₱${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </a>
                    <a href="product-details.html?id=${product.id}" class="product-card__quick-add" style="display:block; text-align:center; text-decoration:none;">
                        View Details
                    </a>
                </div>
            `;
            container.append(cardHtml);
        });

        renderPaginationControls(page, totalPages);
    }

    function renderPaginationControls(page, totalPages) {
        const $pagination = $('#catalog-pagination');
        $pagination.empty();

        if (totalPages <= 1) return; // nothing to paginate

        const btnStyle = 'min-width:36px; height:36px; padding:0 10px; background:#000; color:#fff; border:1px solid #333; font-size:12px; font-weight:700; cursor:pointer;';
        const activeStyle = 'min-width:36px; height:36px; padding:0 10px; background:#fff; color:#000; border:1px solid #fff; font-size:12px; font-weight:800; cursor:default;';
        const disabledStyle = 'min-width:36px; height:36px; padding:0 10px; background:#000; color:#444; border:1px solid #222; font-size:12px; font-weight:700; cursor:not-allowed;';

        // Prev button
        $pagination.append(`
            <button class="pagination-btn ${page === 1 ? 'disabled' : ''}" data-page="${page - 1}" style="${page === 1 ? disabledStyle : btnStyle}">‹ Prev</button>
        `);

        // Numbered page buttons
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === page;
            $pagination.append(`
                <button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}" style="${isActive ? activeStyle : btnStyle}">${i}</button>
            `);
        }

        // Next button
        $pagination.append(`
            <button class="pagination-btn ${page === totalPages ? 'disabled' : ''}" data-page="${page + 1}" style="${page === totalPages ? disabledStyle : btnStyle}">Next ›</button>
        `);
    }

    function updateFilterButtonUI(activeCategory) {
        $('.filter-btn').removeClass('btn-primary').addClass('btn-dark');
        $(`.filter-btn[data-category="${activeCategory}"]`).removeClass('btn-dark').addClass('btn-primary');
    }

    function renderEmptyMessage(targetContainer) {
        targetContainer.html(`
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 0;">
                <p style="font-size: 16px; color: #555555; text-transform: uppercase; letter-spacing: 2px;">No collections found matching this segment parameter.</p>
            </div>
        `);
    }
});