$(document).ready(function() {
    function resolveProductImage(path) {
        if (!path) return 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';
        if (/^https?:\/\//i.test(path)) return path;
        return path.startsWith('/') ? path : `/${path}`;
    }

    fetchFeaturedDrops();

    function fetchFeaturedDrops() {
        $.ajax({
            url: '/api/products',
            method: 'GET',
            dataType: 'json',
            success: function(products) {
                const container = $('#featured-products');
                container.empty(); // Clear static wrappers

                if (!products || products.length === 0) {
                    renderPlaceholders(container);
                    return;
                }

                // Append up to 4 featured items matching your layout grid constraints
                const displayLimit = Math.min(products.length, 4);
                for (let i = 0; i < displayLimit; i++) {
                    const product = products[i];
                    
                    // Extract image path safely from relational associations (MP3 fallback check)
                    const imageSrc = (product.ProductImages && product.ProductImages.length > 0) 
                        ? resolveProductImage(product.ProductImages[0].image_path) 
                        : resolveProductImage(null);

                    // Compute dynamic date metrics to determine if new badge is applicable
                    const createdDate = new Date(product.createdAt);
                    const systemDate = new Date();
                    const dayDifference = Math.floor((systemDate - createdDate) / (1000 * 60 * 60 * 24));
                    
                    const badgeHtml = (dayDifference < 30) 
                        ? `<span class="product-card__badge product-card__badge--new">New</span>` 
                        : '';

                    // Resolve category field safely from joined Category model
                    const categoryName = product.Category ? product.Category.name : 'Adidas';

                    // Construct structural component template string
                    const productCard = `
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
                    container.append(productCard);
                }
            },
            error: function(xhr) {
                console.error("Failed to populate featured catalog grid:", xhr.statusText);
                renderPlaceholders($('#featured-products'));
            }
        });
    }

    // Fallback template builder if backend returns an empty query row set
    function renderPlaceholders(targetContainer) {
        targetContainer.empty();
        for (let i = 0; i < 4; i++) {
            const placeholder = `
                <div class="product-card">
                    <div class="product-card__image" style="background:#e8e8e8; display:flex; align-items:center; justify-content:center; height:250px;">
                        <span style="color:#aaa; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">Coming Soon</span>
                    </div>
                    <div class="product-card__info">
                        <div class="product-card__category">Adidas</div>
                        <div class="product-card__name">New Arrival</div>
                        <div class="product-card__price">₱0.00</div>
                    </div>
                </div>
            `;
            targetContainer.append(placeholder);
        }
    }
});