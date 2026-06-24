$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let selectedVariantId = null;

    if (!productId) {
        console.error("Missing product ID parameter inside URL query string.");
        // COMMENTED OUT FOR DEBUGGING: Prevents page flickering if route misfires
        // window.location.href = 'shop.html';
        return;
    }

    console.log(`Initializing request to secure API route: /api/products/${productId}`);

    // 1. Fetch Product Record with Associations from Backend
    $.ajax({
        url: `/api/products/${productId}`,
        method: 'GET',
        dataType: 'json',
        success: function(product) {
            console.log("Successfully intercepted backend data payload:", product);

            // Set basic textual detail layers with null checks
            $('#detail-name').text(product.name || 'Unnamed Product');
            $('#detail-desc').text(product.description || 'No additional specifications provided for this corporate catalog item.');
            $('#detail-style-code').text(product.style_code || 'N/A');
            $('#detail-category').text(`${product.Category ? product.Category.name : 'Adidas'} | ${product.gender || 'unisex'}`);
            
            if (product.price) {
                $('#detail-price').text(`₱${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            }

            // Resolve Image Array fallback loops (checking both camelCase and snake_case properties)
            let imageSrc = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';
            const images = product.ProductImages || product.product_images;
            
            if (images && images.length > 0) {
                imageSrc = images[0].image_path;
            }
            $('#detail-image').attr('src', imageSrc).attr('alt', product.name);

            // 2. Map Related Inventory Variants
            const variantContainer = $('#variant-container');
            variantContainer.empty();

            const variants = product.Variants || product.variants;

            if (variants && variants.length > 0) {
                variants.forEach(variant => {
                    const optionBtn = $(`
                        <button class="btn btn-dark variant-opt-btn" data-id="${variant.id}" style="padding: 10px 20px; font-size: 12px;">
                            UK ${variant.size} (${variant.stock_quantity} left)
                        </button>
                    `);
                    
                    if (variant.stock_quantity <= 0) {
                        optionBtn.prop('disabled', true).css({ 'opacity': '0.3', 'cursor': 'not-allowed' });
                    }
                    
                    variantContainer.append(optionBtn);
                });
            } else {
                variantContainer.html('<p style="font-size:12px; color:#555;">Standard One-Size Fit Only (No variants linked)</p>');
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

    // 3. Handle Interactive Button Selection Choice Toggles
    $(document).on('click', '.variant-opt-btn', function() {
        $('.variant-opt-btn').removeClass('btn-primary').addClass('btn-dark');
        $(this).removeClass('btn-dark').addClass('btn-primary');
        selectedVariantId = $(this).data('id');
        $('#variant-error').hide();
    });

    // 4. Cart Processing Pipeline
    $('#addToCartBtn').on('click', function() {
        const hasVariants = $('.variant-opt-btn').length > 0;
        
        if (hasVariants && !selectedVariantId) {
            $('#variant-error').show();
            return;
        }

        let cart = JSON.parse(localStorage.getItem('adidas_cart')) || [];
        
        const cartItem = {
            product_id: parseInt(productId),
            variant_id: selectedVariantId,
            quantity: 1
        };

        const duplicateIndex = cart.findIndex(item => item.product_id === cartItem.product_id && item.variant_id === cartItem.variant_id);
        if (duplicateIndex > -1) {
            cart[duplicateIndex].quantity += 1;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('adidas_cart', JSON.stringify(cart));
        
        const btn = $(this);
        btn.text('Added To Cart!').removeClass('btn-primary').addClass('btn-outline').prop('disabled', true);
        setTimeout(() => {
            btn.text('Add to Cart').removeClass('btn-outline').addClass('btn-primary').prop('disabled', false);
        }, 1500);
    });
});