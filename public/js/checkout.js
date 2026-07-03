$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let checkoutData = null;
    // Mirrors the constants in controllers/checkoutController.js — there is
    // no GET /api/checkout endpoint (the cart lives in localStorage now, see
    // cart-store.js), so the summary is built client-side from
    // /api/cart/resolve + /api/addresses instead.
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
            const resolved = resolvedResp[0];
            const addresses = addressesResp[0];

            if (!resolved || resolved.length === 0) {
                $('#checkout-loading').hide();
                $('#checkout-empty').show();
                return;
            }

            const subtotal = resolved.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
            const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

            checkoutData = {
                cartItems: resolved,
                addresses: addresses,
                cards: [], // saved cards aren't implemented server-side yet
                subtotal: subtotal,
                shipping_fee: shippingFee,
                discount_rate: DISCOUNT_RATE
            };
            discountRate = DISCOUNT_RATE;

            $('#checkout-loading').hide();
            $('#checkout-layout').css('display', 'grid');

            renderOrderSummary(checkoutData);
            renderSavedAddresses(checkoutData.addresses);
            renderSavedCards(checkoutData.cards);
        }).fail(function(xhr) {
            $('#checkout-loading').hide();
            alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not load checkout.');
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
                    <span>${product.name} (${variant.colorway}, ${variant.size_type} ${variant.size_value}) × ${item.quantity}</span>
                    <span>₱${lineTotal}</span>
                </div>
            `);
        });

        updateTotalsDisplay();
    }

    // Recomputes the subtotal/discount/shipping/total block using the currently
    // selected discount option. Mirrors the server-side calc in checkoutController.
    function updateTotalsDisplay() {
        if (!checkoutData) return;

        const subtotal = parseFloat(checkoutData.subtotal);
        const shipping = parseFloat(checkoutData.shipping_fee);
        const discountType = $('input[name="discount_type"]:checked').val();

        let discountAmount = 0;
        if (discountType === 'pwd' || discountType === 'senior') {
            discountAmount = Math.round(subtotal * discountRate * 100) / 100;
        }

        const total = Math.max(subtotal - discountAmount, 0) + shipping;

        $('#checkout-subtotal').text('₱' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#checkout-shipping').text(shipping === 0 ? 'Free' : '₱' + shipping.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#checkout-total').text('₱' + total.toLocaleString('en-US', { minimumFractionDigits: 2 }));

        if (discountAmount > 0) {
            const label = discountType === 'pwd' ? 'PWD Discount' : 'Senior Citizen Discount';
            $('#checkout-discount-label').text(label);
            $('#checkout-discount-amount').text('−₱' + discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }));
            $('#checkout-discount-row').css('display', 'flex');
        } else {
            $('#checkout-discount-row').hide();
        }
    }

    // Toggle the ID-number field whenever the discount selection changes
    $(document).on('change', 'input[name="discount_type"]', function() {
        const type = $(this).val();
        $('#discount-id-wrapper').toggleClass('is-visible', type === 'pwd' || type === 'senior');
        if (type === 'none') $('#discount_id_number').val('');
        updateTotalsDisplay();
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

    // Lets the saved-card click handler share/reset its selection state
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

    // Selecting a saved card fills in the cardholder name + expiry for display,
    // disables manual entry of the masked number, and only asks for the CVV
    // (the masked number can't be reconstructed — CVV must always be re-entered)
    $(document).on('click', '.saved-card-option', function() {
        const cardId = $(this).data('card-id');

        // Clicking the already-selected card deselects it and re-enables manual entry
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

    // Clicking a saved address fills the form and flashes the clicked card
    // to make the selection feel deliberate instead of a silent form-fill.
    $(document).on('click', '.saved-address-option', function() {
        const $this = $(this);

        $('.saved-address-option').removeClass('is-selected flash-select');
        $this.addClass('is-selected flash-select');

        // Remove the flash class once its animation finishes so it can
        // replay cleanly if the user clicks a different address and back.
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

        const discountType = $('input[name="discount_type"]:checked').val();
        const paymentMethod = $('input[name="payment_method"]:checked').val();

        const payload = {
            items: CartStore.read(),
            full_name: $('#full_name').val().trim(),
            phone: $('#phone').val().trim(),
            address_line: $('#address_line').val().trim(),
            city: $('#city').val().trim(),
            province: $('#province').val().trim(),
            postal_code: $('#postal_code').val().trim(),
            payment_method: paymentMethod,
            save_address: $('#save_address').is(':checked'),
            discount_type: discountType,
            discount_id_number: $('#discount_id_number').val().trim()
        };

        if (!payload.full_name || !payload.phone || !payload.address_line || !payload.city) {
            $error.text('Please fill in all required shipping fields.').show();
            return;
        }

        if ((discountType === 'pwd' || discountType === 'senior') && !payload.discount_id_number) {
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
                // Redirect to a confirmation page, passing the new order id
                window.location.href = `order-confirmation.html?id=${response.order.id}`;
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('Place Order');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Could not place order. Please try again.';
                $error.text(msg).show();
            }
        });
    });
});