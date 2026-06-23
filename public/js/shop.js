$(document).ready(function() {
    // 1. Extract category state parameters from URL query string strings
    const urlParams = new URLSearchParams(window.location.search);
    let currentCategory = urlParams.get('category') || 'all';

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
                const container = $('#catalog-grid');
                container.empty();

                // Client-side filtering check against category payload structural strings
                const filteredProducts = products.filter(product => {
                    if (category === 'all') return true;
                    const prodCategory = product.Category ? product.Category.name.toLowerCase() : '';
                    return prodCategory === category.toLowerCase();
                });

                if (filteredProducts.length === 0) {
                    renderEmptyMessage(container);
                    return;
                }

                // Render matching data arrays directly into standard layout models
                filteredProducts.forEach(product => {
                    const imageSrc = (product.ProductImages && product.ProductImages.length > 0) 
                        ? product.ProductImages[0].image_path 
                        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';

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
            },
            error: function(xhr) {
                console.error("Failed to recover product grid collection items:", xhr.statusText);
                renderEmptyMessage($('#catalog-grid'));
            }
        });
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