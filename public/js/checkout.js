$(document).ready(function() {
    const token = localStorage.getItem('token');
    
    let appliedPromoCode = null;
    let appliedPromoPercent = 0;

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let checkoutData = null;
    const DISCOUNT_RATE = 0.20;
    const FREE_SHIPPING_THRESHOLD = 3000;
    const SHIPPING_FEE = 150;
    let discountRate = DISCOUNT_RATE;
    let selectedSavedCardId = null;

    loadCheckout();

    function loadCheckout() {
        const cartItems = CartStore.read();

        if (cartItems.length === 0) {
            $('#checkout-loading').hide();
            $('#checkout-empty').show();
            return;
        }

        $.when(
            CartStore.resolve(token),
            $.ajax({ url: '/api/addresses', method: 'GET', headers: { 'Authorization': 'Bearer ' + token } })
        ).done(function(resolvedResp, addressesResp) {
            const resolved = resolvedResp; 
            const addresses = addressesResp[0];

            if (!resolved || resolved.length === 0) {
                $('#checkout-loading').hide();
                $('#checkout-empty').show();
                return;
            }

            $('#checkout-items').empty(); 

            resolved.forEach(function(item) {
                const imgTrack = item.Variant && item.Variant.VariantImage 
                    ? (item.Variant.VariantImage.image_path || item.Variant.VariantImage.image_url) 
                    : '/uploads/default-shoe.png';

                const isLastItem = (resolved.indexOf(item) === resolved.length - 1);
                const borderStyle = isLastItem ? '' : 'border-bottom: 1px solid #eee;';

                const itemHtml = `
                    <div style="display:flex; gap:16px; margin-bottom:16px; ${borderStyle} padding-bottom:16px;">
                     <img src="${imgTrack}" 
                            style="width:70px; height:70px; object-fit:contain; background:#f5f5f5; border:1px solid #ddd;" />
                        <div style="flex:1;">
                            <h4 style="font-size:13px; font-weight:800; text-transform:uppercase; margin:0 0 4px; color:#ddd;">${item.Variant && item.Variant.Product ? item.Variant.Product.name : 'Adidas Sneaker'}</h4>
                            <p style="font-size:11px; color:#666; margin:0 0 2px;">Colorway: ${item.Variant && item.Variant.Colorway ? item.Variant.Colorway.name : 'Default'}</p>
                            <p style="font-size:11px; color:#666; margin:0 0 6px;">Size: US ${item.Variant && item.Variant.ShoeSize ? item.Variant.ShoeSize.us_size : 'N/A'}</p>
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700;">
                                <span style="color:#888;">Qty: ${item.quantity}</span>
                                <span style="color:#ddd;">₱${(item.unit_price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>
                    </div>`;
                $('#checkout-items').append(itemHtml);
            });

            checkoutData = { items: resolved }; 
            recalculateTotals();

            renderSavedAddresses(addresses);

            $('#checkout-loading').hide();
            $('#checkout-layout').css('display', 'grid');
            
        }).fail(function(xhr) {
            $('#checkout-loading').hide();
            $('#checkout-empty').show().html(
                '<p style="color:#c00; font-size: 16px; font-weight: bold;">Failed to load checkout details. Please refresh.</p>'
            );
        });
    }

    function renderOrderSummary(data) {
        const $items = $('#checkout-items');
        $items.empty();

        data.cartItems.forEach(item => {
            const variant = item.Variant;
            const product = variant.Product;
            const lineTotal = (parseFloat(product.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 });

            $items.append(`
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px;">
                    <span>${product.name} (${variant.Colorway ? variant.Colorway.name : ''}, ${variant.ShoeSize ? variant.ShoeSize.label : ''}) × ${item.quantity}</span>
                    <span>₱${lineTotal}</span>
                </div>
            `);
        });

        recalculateTotals();
    }

    function recalculateTotals() {
        if (!checkoutData || !checkoutData.items) return;

        let subtotal = 0;
        checkoutData.items.forEach(item => {
            subtotal += parseFloat(item.unit_price) * parseInt(item.quantity);
        });

        let discountAmount = 0;

        if ($('#is_pwd_senior').is(':checked')) {
            discountAmount = subtotal * DISCOUNT_RATE;
            $('#checkout-discount-label').text('Senior/PWD Discount');
        } else if (appliedPromoPercent > 0) {
            discountAmount = subtotal * (appliedPromoPercent / 100);
            $('#checkout-discount-label').text(`Promo Code (${appliedPromoCode})`);
        }

        const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

        $('#checkout-subtotal').text(`₱${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        $('#checkout-shipping').text(shippingFee === 0 ? 'FREE' : `₱${shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        $('#checkout-total').text(`₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        
        if (discountAmount > 0) {
            $('#checkout-discount-amount').text(`−₱${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            $('#checkout-discount-row').css('display', 'flex');
        } else {
            $('#checkout-discount-row').hide();
        }
    }

    // Handle Smooth Toggles and Mutual Exclusivity (With Combined Slide + Fade)
    $(document).on('change', '#is_pwd_senior', function() {
        if ($(this).is(':checked')) {
            $('#pwd-senior-fields').css('display', 'block').animate({
                height: 'show',
                opacity: 1
            }, { duration: 250, queue: false });

            if ($('#toggle_promo_input').is(':checked')) {
                $('#toggle_promo_input').prop('checked', false);
                $('#promo-input-fields').animate({
                    height: 'hide',
                    opacity: 0
                }, { duration: 200, queue: false });
                clearPromo();
            }
        } else {
            $('#pwd-senior-fields').animate({
                height: 'hide',
                opacity: 0
            }, { duration: 200, queue: false });
        }
        recalculateTotals();
    });

    $(document).on('change', '#toggle_promo_input', function() {
        if ($(this).is(':checked')) {
            $('#promo-input-fields').css('display', 'block').animate({
                height: 'show',
                opacity: 1
            }, { duration: 250, queue: false });

            if ($('#is_pwd_senior').is(':checked')) {
                $('#is_pwd_senior').prop('checked', false);
                $('#pwd-senior-fields').animate({
                    height: 'hide',
                    opacity: 0
                }, { duration: 200, queue: false });
            }
        } else {
            $('#promo-input-fields').animate({
                height: 'hide',
                opacity: 0
            }, { duration: 200, queue: false });
            clearPromo();
        }
        recalculateTotals();
    });

    // Toggle the gcash / card payment forms whenever the payment method changes
    $(document).on('change', 'input[name="payment_method"]', function() {
        const method = $(this).val();
        $('#gcash-form-wrapper').toggleClass('is-visible', method === 'gcash');
        $('#card-form-wrapper').toggleClass('is-visible', method === 'card');

        if (method !== 'gcash') {
            $('#gcash_account_name, #gcash_number').val('');
        }
        if (method !== 'card') clearSavedCardSelection();
    });

    function clearSavedCardSelection() {
        selectedSavedCardId = null;
        $('.saved-card-option').removeClass('is-selected');
        $('#cardholder_name, #card_number, #expiry_month, #expiry_year').val('').prop('disabled', false);
        $('#save_card').prop('disabled', false);
        $('#cvv').val('');
    }

    function renderSavedCards(cards) {
        const $container = $('#saved-cards');
        $container.empty();

        if (!cards || cards.length === 0) {
            $('#card-form-intro').text('Enter your card details below:');
            return;
        }

        $('#card-form-intro').text('Or enter a new card below:');

        cards.forEach(card => {
            $container.append(`
                <div class="saved-card-option" data-card-id="${card.id}">
                    <div>
                        <div class="saved-card-option__brand">${card.card_brand} •••• ${card.card_last4}</div>
                        <div class="saved-card-option__meta">${card.cardholder_name} — Expires ${card.expiry_month}/${card.expiry_year}</div>
                    </div>
                    <span style="font-size:11px; color:#888;">Use this card</span>
                </div>
            `);
        });
    }

    $(document).on('click', '.saved-card-option', function() {
        const cardId = $(this).data('card-id');

        if (selectedSavedCardId === cardId) {
            clearSavedCardSelection();
            return;
        }

        selectedSavedCardId = cardId;
        $('.saved-card-option').removeClass('is-selected');
        $(this).addClass('is-selected');

        const card = (checkoutData.cards || []).find(c => c.id === cardId);
        if (!card) return;

        $('#cardholder_name').val(card.cardholder_name).prop('disabled', true);
        $('#card_number').val(`${card.card_brand} •••• ${card.card_last4}`).prop('disabled', true);
        $('#expiry_month').val(card.expiry_month).prop('disabled', true);
        $('#expiry_year').val(card.expiry_year).prop('disabled', true);
        $('#save_card').prop('checked', false).prop('disabled', true);
        $('#cvv').val('').prop('disabled', false).focus();
    });

    function renderSavedAddresses(addresses) {
        const $container = $('#saved-addresses');
        $container.empty();

        if (!addresses || addresses.length === 0) return;

        addresses.forEach(addr => {
            $container.append(`
                <div class="saved-address-option" data-address='${JSON.stringify(addr)}'>
                    <div style="font-weight:700; font-size:14px;">${addr.full_name} — ${addr.phone}</div>
                    <div style="font-size:13px; color:#888;">
                        ${addr.address_line}, ${addr.city}${addr.province ? ', ' + addr.province : ''} ${addr.postal_code || ''}
                    </div>
                </div>
            `);
        });
    }

    $(document).on('click', '.saved-address-option', function() {
        const $this = $(this);

        $('.saved-address-option').removeClass('is-selected flash-select');
        $this.addClass('is-selected flash-select');

        $this.on('animationend', function() {
            $this.removeClass('flash-select');
        });

        const addr = JSON.parse($this.attr('data-address'));
        $('#full_name').val(addr.full_name);
        $('#phone').val(addr.phone);
        $('#address_line').val(addr.address_line);
        $('#city').val(addr.city);
        $('#province').val(addr.province || '');
        $('#postal_code').val(addr.postal_code || '');
    });

    // Submit order
    $('#checkoutForm').on('submit', function(e) {
        e.preventDefault();

        const $btn = $('#placeOrderBtn');
        const $error = $('#checkout-error');
        $error.hide();

        const paymentMethod = $('input[name="payment_method"]:checked').val();

        let payload = {
            items: CartStore.read(),
            full_name: $('#full_name').val().trim(),
            phone: $('#phone').val().trim(),
            address_line: $('#address_line').val().trim(),
            city: $('#city').val().trim(),
            province: $('#province').val().trim(),
            postal_code: $('#postal_code').val().trim(),
            address_id: $('input[name="address_id"]:checked').val(),
            payment_method: paymentMethod,
            save_address: $('#save_address').is(':checked'),
            
            discount_type: $('#is_pwd_senior').is(':checked') ? $('#discount_type_select').val() : 'none',
            discount_id_number: $('#is_pwd_senior').is(':checked') ? $('#discount_id_number').val().trim() : null,
            
            discount_code: $('#is_pwd_senior').is(':checked') ? null : appliedPromoCode
        };

        if (!payload.full_name || !payload.phone || !payload.address_line || !payload.city) {
            $error.text('Please fill in all required shipping fields.').show();
            return;
        }

        if ($('#is_pwd_senior').is(':checked') && !payload.discount_id_number) {
            $error.text('Please enter your PWD / Senior Citizen ID number.').show();
            return;
        }

        if (paymentMethod === 'gcash') {
            payload.gcash_account_name = $('#gcash_account_name').val().trim();
            payload.gcash_number = $('#gcash_number').val().trim();

            if (!payload.gcash_account_name || !/^09\d{9}$/.test(payload.gcash_number)) {
                $error.text('Please enter your GCash account name and a valid 11-digit mobile number (starts with 09).').show();
                return;
            }
        }

        if (paymentMethod === 'card') {
            payload.cvv = $('#cvv').val().trim();

            if (selectedSavedCardId) {
                payload.use_saved_card_id = selectedSavedCardId;

                if (!payload.cvv) {
                    $error.text('Please enter the CVV for your saved card.').show();
                    return;
                }
            } else {
                payload.cardholder_name = $('#cardholder_name').val().trim();
                payload.card_number = $('#card_number').val().replace(/\s/g, '');
                payload.expiry_month = $('#expiry_month').val().trim();
                payload.expiry_year = $('#expiry_year').val().trim();
                payload.save_card = $('#save_card').is(':checked');

                if (!payload.cardholder_name || !payload.expiry_month || !payload.expiry_year || !payload.cvv || payload.card_number.replace(/\D/g, '').length < 12) {
                    $error.text('Please complete all card payment fields.').show();
                    return;
                }
            }
        }

        $btn.prop('disabled', true).text('Placing Order...');

        $.ajax({
            url: '/api/checkout',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify(payload),
            success: function(response) {
                CartStore.clear();
                window.location.href = `order-confirmation.html?id=${response.order.id}`;
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('Place Order');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Could not place order. Please try again.';
                $error.text(msg).show();
            }
        });
    });

    // Verification mechanism on 'Apply' click
    $(document).on('click', '#apply-promo-btn', function(e) {
        e.preventDefault();
        const codeInput = $('#checkout-promo-input').val().trim().toUpperCase();
        const $msg = $('#promo-status-msg');

        if (!codeInput) {
            $msg.text('Please enter a code.').css('color', '#c00').show();
            return;
        }

        if ($('#is_pwd_senior').is(':checked')) {
            $msg.text('Cannot use promo codes while Senior/PWD discount is active.').css('color', '#c00').show();
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true).text('Verifying...');

        $.ajax({
            url: `/api/admin/discounts/validate/${codeInput}`, 
            method: 'GET', 
            success: function(match) {
                $btn.prop('disabled', false).text('Apply');
                
                // Code Verified Successfully
                appliedPromoCode = match.code;
                appliedPromoPercent = parseFloat(match.percent_off);

                $msg.text(`Code "${match.code}" applied! (${appliedPromoPercent}% OFF)`).css('color', '#1a7a3c').show();
                recalculateTotals();
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('Apply');
                
                // Extract the specific error message from the backend, or default to a generic one
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message 
                    ? xhr.responseJSON.message 
                    : 'Failed to validate code.';
                    
                $msg.text(errorMessage).css('color', '#c00').show();
                
                // Reset internal math variables but DO NOT call clearPromo() 
                // so the user's text and the error message remain visible
                appliedPromoCode = null;
                appliedPromoPercent = 0;
                recalculateTotals();
            }
        });
    });

    // Make sure your clearPromo function looks exactly like this.
    // This is ONLY called when the user unchecks the promo box entirely.
    function clearPromo() {
        appliedPromoCode = null;
        appliedPromoPercent = 0;
        $('#checkout-promo-input').val('');
        $('#promo-status-msg').hide().text('');
        recalculateTotals();
    }

    // Clean out promo parameters cleanly
    function clearPromo() {
        appliedPromoCode = null;
        appliedPromoPercent = 0;
        $('#checkout-promo-input').val('');
        $('#promo-status-msg').hide().text('');
        recalculateTotals();
    }
});