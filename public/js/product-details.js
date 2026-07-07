$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let selectedVariantId = null;

    // ===================== SIZE UNIT CONVERSION (display-only, DB stays US) =====================
    const MENS_SIZE_CHART = {
        6: { uk: '5.5', eu: '39' }, 6.5: { uk: '6', eu: '39' }, 7: { uk: '6.5', eu: '40' },
        7.5: { uk: '7', eu: '40-41' }, 8: { uk: '7.5', eu: '41' }, 8.5: { uk: '8', eu: '41-42' },
        9: { uk: '8.5', eu: '42' }, 9.5: { uk: '9', eu: '42-43' }, 10: { uk: '9.5', eu: '43' },
        10.5: { uk: '10', eu: '43-44' }, 11: { uk: '10.5', eu: '44' }, 11.5: { uk: '11', eu: '44-45' },
        12: { uk: '11.5', eu: '45' }, 13: { uk: '12.5', eu: '46' }, 14: { uk: '13.5', eu: '47' },
        15: { uk: '14.5', eu: '48' }, 16: { uk: '15.5', eu: '49' }
    };

    const WOMENS_SIZE_CHART = {
        4: { uk: '2', eu: '35' }, 4.5: { uk: '2.5', eu: '35' }, 5: { uk: '3', eu: '35-36' },
        5.5: { uk: '3.5', eu: '36' }, 6: { uk: '4', eu: '36-37' }, 6.5: { uk: '4.5', eu: '37' },
        7: { uk: '5', eu: '37-38' }, 7.5: { uk: '5.5', eu: '38' }, 8: { uk: '6', eu: '38-39' },
        8.5: { uk: '6.5', eu: '39' }, 9: { uk: '7', eu: '39-40' }, 9.5: { uk: '7.5', eu: '40' },
        10: { uk: '8', eu: '40-41' }, 10.5: { uk: '8.5', eu: '41' }, 11: { uk: '9', eu: '41-42' },
        11.5: { uk: '9.5', eu: '42' }, 12: { uk: '10', eu: '42-43' }
    };

    let currentProduct = null;
    let currentSizeUnit = localStorage.getItem('preferredSizeUnit') || 'US';

    const FALLBACK_PRODUCT_IMAGE = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

    // Works for both locally-uploaded images (stored as relative paths like
    // /uploads/xyz.jpg) and images referenced by full external URL.
    function resolveImagePath(path, fallback) {
        if (!path) return fallback || null;
        return /^https?:\/\//i.test(path) ? path : (path.startsWith('/') ? path : `/${path}`);
    }

    // ===================== IMAGE GALLERY =====================
    // Renders a thumbnail strip under the main image. Works the same whether
    // an image came from an uploaded file (relative /uploads/... path) or
    // was pasted in by the admin as a full external URL.
    function renderThumbnails(imageSrcs, productName) {
        const strip = $('#detail-thumbnails').empty();

        if (imageSrcs.length <= 1) return; // nothing to browse between

        imageSrcs.forEach((src, index) => {
            strip.append(`
                <div class="detail-thumb${index === 0 ? ' detail-thumb--active' : ''}" data-src="${src}"
                     style="width:72px; height:72px; background:#111; border:2px solid ${index === 0 ? '#fff' : '#333'}; cursor:pointer; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img src="${src}" alt="${productName || 'Product'} view ${index + 1}" style="width:100%; height:100%; object-fit:contain; padding:6px;">
                </div>
            `);
        });
    }

    $(document).on('click', '.detail-thumb', function () {
        const newSrc = $(this).data('src');
        $('#detail-image').attr('src', newSrc);
        $('.detail-thumb').css('border-color', '#333').removeClass('detail-thumb--active');
        $(this).css('border-color', '#fff').addClass('detail-thumb--active');

        // Check if the clicked image matches any assigned Variant image and auto-switch the Colorway tab
        if (currentProduct && currentProduct.Variants) {
            const matchedVariant = currentProduct.Variants.find(v => v.VariantImage && resolveImagePath(v.VariantImage.image_path) === newSrc);
            if (matchedVariant && matchedVariant.Colorway) {
                if (selectedColorwayId !== matchedVariant.Colorway.id) {
                    selectedColorwayId = matchedVariant.Colorway.id;
                    selectedVariantId = null;
                    renderColorways();
                    renderVariantButtons();
                }
                // Shopee-style label: this picture belongs to a specific colorway variant
                $('#detail-image-variant-label').text(matchedVariant.Colorway.name).show();
            } else {
                $('#detail-image-variant-label').hide();
            }
        }
    });

    function getSizeChart(gender) {
        return gender === 'women' ? WOMENS_SIZE_CHART : MENS_SIZE_CHART; // men/unisex/kids default to men's chart
    }

    function formatSizeLabel(usValue, gender) {
        const numericValue = parseFloat(usValue);
        if (currentSizeUnit === 'US') return `US ${numericValue}`;

        const chart = getSizeChart(gender);
        const entry = chart[numericValue];
        if (!entry) return `US ${numericValue}`; // fallback if this exact size isn't in the chart

        return currentSizeUnit === 'UK' ? `UK ${entry.uk}` : `EU ${entry.eu}`;
    }

    let selectedColorwayId = null;

    function updateSizeUnitButtonUI() {
        $('.size-unit-btn').each(function() {
            const isActive = $(this).data('unit') === currentSizeUnit;
            $(this).css({
                background: isActive ? '#fff' : '#000',
                color: isActive ? '#000' : '#fff',
                border: isActive ? '1px solid #fff' : '1px solid #444'
            });
        });
    }
    updateSizeUnitButtonUI();

    $(document).on('click', '.size-unit-btn', function() {
        currentSizeUnit = $(this).data('unit');
        localStorage.setItem('preferredSizeUnit', currentSizeUnit);
        updateSizeUnitButtonUI();
        renderVariantButtons(); 
    });

    // 1. Render Unique Colorways
    function renderColorways() {
        const cwContainer = $('#colorway-container').empty();
        if (!currentProduct || !currentProduct.Variants) return;

        const uniqueCw = [];
        const cwMap = new Map();
        
        currentProduct.Variants.forEach(v => {
            if (v.Colorway && !cwMap.has(v.Colorway.id)) {
                cwMap.set(v.Colorway.id, true);
                uniqueCw.push({ ...v.Colorway, image: v.VariantImage });
            }
        });

        if (!selectedColorwayId && uniqueCw.length > 0) {
            selectedColorwayId = uniqueCw[0].id; // Auto-select first colorway
        }

        uniqueCw.forEach(cw => {
            const isActive = cw.id === selectedColorwayId;
            const content = cw.image 
                ? `<img src="${resolveImagePath(cw.image.image_path)}" style="width:28px; height:28px; object-fit:cover; border-radius:2px;">` 
                : `<span style="font-weight:700;">${cw.name}</span>`;
                
            cwContainer.append(`
                <button class="btn cw-opt-btn" data-id="${cw.id}" data-img="${cw.image ? cw.image.image_path : ''}" data-name="${cw.name}" 
                    style="padding: 6px 14px; font-size: 12px; display:flex; align-items:center; gap:8px; 
                           border: 1px solid ${isActive ? '#fff' : '#333'}; 
                           background: ${isActive ? '#fff' : '#111'}; 
                           color: ${isActive ? '#000' : '#fff'}; cursor:pointer;">
                    ${content} ${cw.image ? cw.name : ''}
                </button>
            `);
        });
    }

    $(document).on('click', '.cw-opt-btn', function() {
        selectedColorwayId = $(this).data('id');
        selectedVariantId = null; // Clear size selection when changing colors
        renderColorways();
        renderVariantButtons();
        
        // Linkage: Change main image if the variant has a picture attached
        const imgPath = $(this).data('img');
        if (imgPath) {
            $('#detail-image').attr('src', resolveImagePath(imgPath));
            $('.detail-thumb').css('border-color', '#333').removeClass('detail-thumb--active');
            $(`.detail-thumb[data-src="${resolveImagePath(imgPath)}"]`).css('border-color', '#fff').addClass('detail-thumb--active');
            $('#detail-image-variant-label').text($(this).data('name') || '').show();
        } else {
            $('#detail-image-variant-label').hide();
        }
    });

    // 2. Render Sizes tied to the Selected Colorway (With Fade-In)
    function renderVariantButtons() {
        if (!currentProduct) return;
        
        const variantContainer = $('#variant-container');
        variantContainer.hide().empty(); // Hide container immediately for fade-in effect

        const variants = currentProduct.Variants || [];
        const filteredVariants = variants.filter(v => v.Colorway && v.Colorway.id === selectedColorwayId);

        if (filteredVariants.length > 0) {
            filteredVariants.forEach(variant => {
                const usSize = variant.ShoeSize ? variant.ShoeSize.us_size : null;
                const sizeLabel = formatSizeLabel(usSize, currentProduct.gender);
                const isOutOfStock = variant.stock_level <= 0;
                
                const optionBtn = $(`
                    <button class="btn variant-opt-btn" data-id="${variant.id}" 
                            style="padding: 10px 20px; font-size: 12px; border: 1px solid #444; background: #111; color: #fff; cursor:pointer; transition: all 0.2s;">
                        ${sizeLabel} ${isOutOfStock ? '(No Stock)' : ''}
                    </button>
                `);

                if (isOutOfStock) {
                    optionBtn.prop('disabled', true).css({ 'opacity': '0.3', 'cursor': 'not-allowed', 'background': '#000' });
                }

                if (selectedVariantId && variant.id === selectedVariantId) {
                    optionBtn.css({ 'border-color': '#fff', 'background': '#fff', 'color': '#000' });
                }

                variantContainer.append(optionBtn);
            });
        } else {
            variantContainer.html('<p style="font-size:12px; color:#555;">No sizes mapped to this colorway yet.</p>');
        }

        variantContainer.fadeIn(300); // Execute fade-in animation
    }

    // 3. Handle Interactive Button Selection Choice Toggles (Fixed Cart Logic)
    $(document).on('click', '.variant-opt-btn', function() {
        // Reset all buttons to default dark styling
        $('.variant-opt-btn').css({ 'border-color': '#444', 'background': '#111', 'color': '#fff' });
        
        // Highlight selected button
        $(this).css({ 'border-color': '#fff', 'background': '#fff', 'color': '#000' });
        
        selectedVariantId = $(this).data('id'); // Save ID for CartStore
        $('#variant-error').hide();
    });

    // ===================== REVIEWS =====================
    const token = localStorage.getItem('token');

    loadReviews();

    if (token) {
        checkCanReview();
    }

  function getCurrentUserId() {
        const t = localStorage.getItem('token');
        if (!t) return null;
        try {
            const payload = JSON.parse(atob(t.split('.')[1]));
            return payload.id;
        } catch (e) {
            return null;
        }
    }

    // Preview thumbnails for newly selected review photos, before upload
    $(document).on('change', '#review-images', function () {
        const preview = $('#review-image-preview').empty();
        Array.from(this.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => preview.append(`<img src="${e.target.result}" style="width:56px; height:56px; object-fit:cover; border:1px solid #333;">`);
            reader.readAsDataURL(file);
        });
    });

    // Renders a row of clickable review photo thumbnails; clicking one opens
    // the full-size image in a new tab.
    function renderReviewImages(review) {
        const images = review.ReviewImages || review.review_images || [];
        if (images.length === 0) return '';

        const thumbs = images.map(img => {
            const src = resolveImagePath(img.image_path);
            return `<a href="${src}" target="_blank" rel="noopener">
                        <img src="${src}" alt="Review photo" style="width:64px; height:64px; object-fit:cover; border:1px solid #333;">
                    </a>`;
        }).join('');

        return `<div class="review-images" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">${thumbs}</div>`;
    }

    function loadReviews() {
        $.ajax({
            url: `/api/reviews/product/${productId}`,
            method: 'GET',
            success: function(reviews) {
                const $list = $('#reviews-list');
                $list.empty();

                if (!reviews || reviews.length === 0) {
                    $list.html('<p style="color:#888; padding:20px 0;">No reviews yet. Be the first to review this shoe!</p>');
                    return;
                }

                const currentUserId = getCurrentUserId();

                reviews.forEach(review => {
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    const date = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    const isOwner = currentUserId && review.user_id === currentUserId;

                    const reviewImages = review.ReviewImages || review.review_images || [];
                    const imagesJson = JSON.stringify(reviewImages.map(img => ({ id: img.id, image_path: img.image_path }))).replace(/"/g, '&quot;');

                    const ownerControls = isOwner ? `
                        <div class="review-controls" style="margin-top:8px;">
                            <button class="review-edit-btn" data-id="${review.id}" data-rating="${review.rating}" data-comment="${review.comment ? review.comment.replace(/"/g, '&quot;') : ''}" data-images="${imagesJson}" style="background:none; border:none; color:#9cf; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; margin-right:16px; padding:0;">Edit</button>
                            <button class="review-delete-btn" data-id="${review.id}" style="background:none; border:none; color:#f88; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; padding:0;">Delete</button>
                        </div>
                    ` : '';

                    $list.append(`
                        <div class="review-item" data-review-id="${review.id}" style="padding:20px 0; border-bottom:1px solid #222;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <strong style="font-size:14px; color:#fff;">${review.User ? review.User.name : 'Anonymous'}</strong>
                                <span style="font-size:12px; color:#666;">${date}</span>
                            </div>
                            <div class="review-stars" style="color:#fb0; margin-bottom:8px; letter-spacing:2px; font-size:14px;">${stars}</div>
                            <div class="review-body">
                                ${review.comment ? `<p style="font-size:14px; color:#ccc; line-height:1.6;">${review.comment}</p>` : ''}
                                ${renderReviewImages(review)}
                            </div>
                            ${ownerControls}
                        </div>
                    `);
                });
            },
            error: function(xhr) {
                console.error('Failed to load reviews:', xhr.responseText);
            }
        });
    }

    // Delete own review
    $(document).on('click', '.review-delete-btn', function() {
        if (!confirm('Delete this review? This cannot be undone.')) return;

        const reviewId = $(this).data('id');
        const token = localStorage.getItem('token');

        $.ajax({
            url: `/api/reviews/${reviewId}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                loadReviews();
                checkCanReview(); // re-check — deleting your review unlocks the form again
            },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not delete review.');
            }
        });
    });

    // Tracks which existing review-image IDs are marked for removal while an
    // edit form is open. Reset every time a review is opened for editing.
    let editImagesMarkedForRemoval = [];
    let editReviewImages = [];

    function renderEditExistingImages() {
        const wrap = $('.edit-review-existing-images').empty();
        if (editReviewImages.length === 0) {
            wrap.append('<div style="color:#777; font-size:11px;">No photos attached.</div>');
            return;
        }
        editReviewImages.forEach(img => {
            const marked = editImagesMarkedForRemoval.includes(img.id);
            const src = resolveImagePath(img.image_path);
            wrap.append(`
                <div class="edit-review-image-thumb" data-id="${img.id}" style="position:relative; cursor:pointer;">
                    <img src="${src}" style="width:56px; height:56px; object-fit:cover; border:2px solid ${marked ? '#ff4444' : '#333'}; opacity:${marked ? '0.4' : '1'};">
                    ${marked ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#ff4444; font-weight:700; font-size:10px;">REMOVE</div>' : ''}
                </div>
            `);
        });
    }

    // Edit own review — swap the card into an inline edit form
    $(document).on('click', '.review-edit-btn', function() {
        const $btn = $(this);
        const reviewId = $btn.data('id');
        const currentRating = $btn.data('rating');
        const currentComment = $btn.data('comment') || '';
        const $item = $btn.closest('.review-item');

        editReviewImages = $btn.data('images') || [];
        editImagesMarkedForRemoval = [];

        $item.html(`
            <form class="review-edit-form" data-id="${reviewId}" style="padding:4px 0;">
                <div class="form-group" style="margin-bottom:14px;">
                    <label class="form-label" style="color:#fff; display:block; margin-bottom:8px; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Rating</label>
                    <select class="edit-review-rating" required style="max-width:220px; background:#000; color:#fff; border:1px solid #333; padding:10px 12px; font-size:13px;">
                        <option value="5" ${currentRating == 5 ? 'selected' : ''}>★★★★★ Excellent</option>
                        <option value="4" ${currentRating == 4 ? 'selected' : ''}>★★★★☆ Good</option>
                        <option value="3" ${currentRating == 3 ? 'selected' : ''}>★★★☆☆ Average</option>
                        <option value="2" ${currentRating == 2 ? 'selected' : ''}>★★☆☆☆ Poor</option>
                        <option value="1" ${currentRating == 1 ? 'selected' : ''}>★☆☆☆☆ Terrible</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:14px;">
                    <label class="form-label" style="color:#fff; display:block; margin-bottom:8px; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Your Review</label>
                    <textarea class="edit-review-comment" rows="3" style="width:100%; background:#000; color:#fff; border:1px solid #333; padding:12px; font-size:13px; resize:vertical;">${currentComment}</textarea>
                </div>
                <div class="form-group" style="margin-bottom:14px;">
                    <label class="form-label" style="color:#fff; display:block; margin-bottom:8px; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Photos</label>
                    <div class="edit-review-existing-images" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;"></div>
                    <div style="color:#777; font-size:11px; margin-bottom:10px;">Click a photo to mark it for removal.</div>
                    <input type="file" class="edit-review-images" multiple accept="image/*" style="color:#fff; font-size:13px;">
                </div>
                <button type="submit" style="background:#fff; color:#000; border:none; padding:10px 22px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; cursor:pointer; margin-right:12px;">Save</button>
                <button type="button" class="review-cancel-edit-btn" style="background:none; color:#888; border:none; font-size:12px; text-transform:uppercase; letter-spacing:1px; cursor:pointer;">Cancel</button>
            </form>
        `);

        renderEditExistingImages();
    });

    // Toggle an existing review photo's removal state within the edit form
    $(document).on('click', '.edit-review-image-thumb', function() {
        const id = parseInt($(this).data('id'));
        if (editImagesMarkedForRemoval.includes(id)) {
            editImagesMarkedForRemoval = editImagesMarkedForRemoval.filter(x => x !== id);
        } else {
            editImagesMarkedForRemoval.push(id);
        }
        renderEditExistingImages();
    });

    // Cancel edit — just reload the list to discard changes
    $(document).on('click', '.review-cancel-edit-btn', function() {
        loadReviews();
    });

    // Submit the edit
    $(document).on('submit', '.review-edit-form', function(e) {
        e.preventDefault();
        const $form = $(this);
        const reviewId = $form.data('id');
        const rating = $form.find('.edit-review-rating').val();
        const comment = $form.find('.edit-review-comment').val().trim();
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('rating', rating);
        formData.append('comment', comment);
        formData.append('remove_image_ids', JSON.stringify(editImagesMarkedForRemoval));

        const files = $form.find('.edit-review-images')[0].files;
        for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

        $.ajax({
            url: `/api/reviews/${reviewId}`,
            method: 'PUT',
            data: formData,
            contentType: false,
            processData: false,
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                loadReviews();
            },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not update review.');
            }
        });
    });

    function checkCanReview() {
        $.ajax({
            url: `/api/reviews/can-review/${productId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(result) {
                if (result.can_review) {
                    $('#review-form-container').show();
                } else if (result.has_purchased && result.already_reviewed) {
                    // Already reviewed — show neither form nor locked message
                } else {
                    $('#review-locked-message').show();
                }
            },
            error: function(xhr) {
                console.error('Failed to check review eligibility:', xhr.responseText);
            }
        });
    }

    $('#reviewForm').on('submit', function(e) {
        e.preventDefault();

        const rating = $('#review-rating').val();
        const comment = $('#review-comment').val().trim();

        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        const formData = new FormData();
        formData.append('rating', rating);
        formData.append('comment', comment);
        const files = $('#review-images')[0].files;
        for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

        $.ajax({
            url: `/api/reviews/product/${productId}`,
            method: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(response) {
                alert(response.message || 'Review submitted!');
                $('#reviewForm')[0].reset();
                $('#review-image-preview').empty();
                $('#review-form-container').hide();
                loadReviews();
            },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not submit review.');
            }
        });
    });
    console.log(`Initializing request to secure API route: /api/products/${productId}`);

    // 1. Fetch Product Record with Associations from Backend
    $.ajax({
        url: `/api/products/${productId}`,
        method: 'GET',
        dataType: 'json',
        success: function(product) {
            console.log("Successfully intercepted backend data payload:", product);

            $('#detail-name').text(product.name || 'Unnamed Product');
            $('#detail-desc').text(product.description || 'No additional specifications provided for this corporate catalog item.');
            $('#detail-style-code').text(product.style_code || 'N/A');
            $('#detail-category').text(`${product.Category ? product.Category.name : 'Adidas'} | ${product.gender || 'unisex'}`);

            if (product.price) {
                const price = parseFloat(product.price);
                const salePrice = product.sale_price != null ? parseFloat(product.sale_price) : null;
                const onSale = salePrice != null && salePrice < price;

                if (onSale) {
                    $('#detail-price').html(
                        `<span class="price--original">₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>` +
                        `<span class="price--on-sale">₱${salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`
                    );
                } else {
                    $('#detail-price').text(`₱${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                }
            }

            const images = product.ProductImages || product.product_images || [];
            const imageSrcs = images.length > 0
                ? images.map(img => resolveImagePath(img.image_path, FALLBACK_PRODUCT_IMAGE))
                : [FALLBACK_PRODUCT_IMAGE];

            $('#detail-image').attr('src', imageSrcs[0]).attr('alt', product.name);
            renderThumbnails(imageSrcs, product.name);

            // 2. Map Related Inventory Variants — rendering now handled by renderVariantButtons()
            // so it can be re-run whenever the size unit toggle changes
            currentProduct = product;
            renderColorways();
            renderVariantButtons();

            if (token) {
                $.ajax({
                    url: '/api/wishlist/ids',
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function(ids) {
                        if (ids && ids.map(String).includes(String(productId))) {
                            $('#wishlistToggleBtn').addClass('is-active').attr('title', 'Remove from Wishlist');
                        }
                    },
                    error: function() {}
                });
            }
        },
        error: function(xhr, status, error) {
            console.error("=================== API ERROR LOG ===================");
            console.error("Status Code:", xhr.status);
            console.error("Response Text:", xhr.responseText);
            console.error("Error Thrown:", error);
            console.error("====================================================");

            $('#detail-name').text('Failed to load item components');
            $('#detail-desc').text('The application server encountered an association or routing fault. Check terminal logs for details.');
        }
    });

    // 4. Quantity Stepper
    $('#qtyMinusBtn').on('click', function() {
        const input = $('#qtyInput');
        let val = parseInt(input.val()) - 1;
        if (val < 1) val = 1;
        input.val(val);
    });

    $('#qtyPlusBtn').on('click', function() {
        const input = $('#qtyInput');
        let val = parseInt(input.val()) + 1;
        input.val(val);
    });

    // 5. Add to Cart — now calls the real backend API instead of localStorage
    $('#addToCartBtn').on('click', function() {
        const hasVariants = $('.variant-opt-btn').length > 0;

        if (hasVariants && !selectedVariantId) {
            $('#variant-error').show();
            return;
        }

        // Require login before adding to cart
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const quantity = parseInt($('#qtyInput').val()) || 1;
        const btn = $(this);
        const $feedback = $('#cart-feedback');

        btn.prop('disabled', true).text('Adding...');

        // Cart lives in localStorage now -- no DB round trip to add an item.
        CartStore.add(selectedVariantId, quantity);

        btn.text('Added To Cart!').removeClass('btn-primary').addClass('btn-outline');
        $feedback.css('color', '#9f9').text('Added to cart!').show();

        loadCartCount(token);

        setTimeout(() => {
            btn.text('Add to Cart').removeClass('btn-outline').addClass('btn-primary').prop('disabled', false);
            $feedback.fadeOut();
        }, 1800);
    });

    // 6. Wishlist Toggle
    $('#wishlistToggleBtn').on('click', function() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const $btn = $(this);
        const isActive = $btn.hasClass('is-active');
        $btn.prop('disabled', true);

        if (isActive) {
            $.ajax({
                url: `/api/wishlist/${productId}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function() {
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
                    $btn.addClass('is-active').attr('title', 'Remove from Wishlist').prop('disabled', false);
                    if (typeof loadWishlistCount === 'function') loadWishlistCount(token);
                },
                error: function() { $btn.prop('disabled', false); }
            });
        }
    });
});