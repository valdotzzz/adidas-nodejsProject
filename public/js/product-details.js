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
        renderVariantButtons(); // redraw the existing variant buttons in the new unit
    });

    function renderVariantButtons() {
        if (!currentProduct) return;

        const variantContainer = $('#variant-container');
        variantContainer.empty();

        const variants = currentProduct.Variants || currentProduct.variants;

        if (variants && variants.length > 0) {
            variants.forEach(variant => {
                const sizeLabel = formatSizeLabel(variant.size_value, currentProduct.gender);
                const optionBtn = $(`
                    <button class="btn btn-dark variant-opt-btn" data-id="${variant.id}" style="padding: 10px 20px; font-size: 12px;">
                        ${sizeLabel} (${variant.stock_level} left)
                    </button>
                `);

                if (variant.stock_level <= 0) {
                    optionBtn.prop('disabled', true).css({ 'opacity': '0.3', 'cursor': 'not-allowed' });
                }

                // Re-apply active highlight if this variant was already selected before the unit switch
                if (selectedVariantId && variant.id === selectedVariantId) {
                    optionBtn.removeClass('btn-dark').addClass('btn-primary');
                }

                variantContainer.append(optionBtn);
            });
        } else {
            variantContainer.html('<p style="font-size:12px; color:#555;">Standard One-Size Fit Only (No variants linked)</p>');
        }
    }
    if (!productId) {
        console.error("Missing product ID parameter inside URL query string.");
        return;
    }

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

                    const ownerControls = isOwner ? `
                        <div class="review-controls" style="margin-top:8px;">
                            <button class="review-edit-btn" data-id="${review.id}" data-rating="${review.rating}" data-comment="${review.comment ? review.comment.replace(/"/g, '&quot;') : ''}" style="background:none; border:none; color:#9cf; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; margin-right:16px; padding:0;">Edit</button>
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

    // Edit own review — swap the card into an inline edit form
    $(document).on('click', '.review-edit-btn', function() {
        const $btn = $(this);
        const reviewId = $btn.data('id');
        const currentRating = $btn.data('rating');
        const currentComment = $btn.data('comment') || '';
        const $item = $btn.closest('.review-item');

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
                <button type="submit" style="background:#fff; color:#000; border:none; padding:10px 22px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; cursor:pointer; margin-right:12px;">Save</button>
                <button type="button" class="review-cancel-edit-btn" style="background:none; color:#888; border:none; font-size:12px; text-transform:uppercase; letter-spacing:1px; cursor:pointer;">Cancel</button>
            </form>
        `);
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

        $.ajax({
            url: `/api/reviews/${reviewId}`,
            method: 'PUT',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ rating: parseInt(rating), comment }),
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

        $.ajax({
            url: `/api/reviews/product/${productId}`,
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ rating: parseInt(rating), comment }),
            success: function(response) {
                alert(response.message || 'Review submitted!');
                $('#reviewForm')[0].reset();
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
                $('#detail-price').text(`₱${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            }

            let imageSrc = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';
            const images = product.ProductImages || product.product_images;

            if (images && images.length > 0) {
                imageSrc = images[0].image_path;
            }
            $('#detail-image').attr('src', imageSrc).attr('alt', product.name);

            // 2. Map Related Inventory Variants — rendering now handled by renderVariantButtons()
            // so it can be re-run whenever the size unit toggle changes
            currentProduct = product;
            renderVariantButtons();
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

    // 3. Handle Interactive Button Selection Choice Toggles
    $(document).on('click', '.variant-opt-btn', function() {
        $('.variant-opt-btn').removeClass('btn-primary').addClass('btn-dark');
        $(this).removeClass('btn-dark').addClass('btn-primary');
        selectedVariantId = $(this).data('id');
        $('#variant-error').hide();
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

        $.ajax({
            url: '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({
                variant_id: selectedVariantId,
                quantity: quantity
            }),
            success: function(response) {
                btn.text('Added To Cart!').removeClass('btn-primary').addClass('btn-outline');
                $feedback.css('color', '#9f9').text(response.message || 'Added to cart!').show();

                    loadCartCount(token);


                setTimeout(() => {
                    btn.text('Add to Cart').removeClass('btn-outline').addClass('btn-primary').prop('disabled', false);
                    $feedback.fadeOut();
                }, 1800);
            },
            error: function(xhr) {
                btn.prop('disabled', false).text('Add to Cart');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Could not add item to cart.';
                $feedback.css('color', '#f88').text(msg).show();
            }
        });
    });
});