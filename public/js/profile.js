$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let cachedAddresses = [];

    loadProfile();

    /* ==========================================================================
       LOAD PROFILE + ADDRESSES
       ========================================================================== */
    function loadProfile() {
        $.ajax({
            url: '/api/profile',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(user) {
                $('#profile_name').val(user.name);
                $('#profile_email').val(user.email);
                cachedAddresses = user.Addresses || [];
                renderAddresses(cachedAddresses);
            },
            error: handleAuthFailure
        });
    }

    /* ==========================================================================
       PROFILE INFORMATION
       ========================================================================== */
    $('#profileInfoForm').on('submit', function(e) {
        e.preventDefault();
        clearErrors('profileInfoForm');

        const payload = {
            name: $('#profile_name').val().trim(),
            email: $('#profile_email').val().trim()
        };

        $.ajax({
            url: '/api/profile',
            method: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() {
                flashSaved('#profileInfoSavedMsg');
            },
            error: function(xhr) {
                $('#profile_email_error').text(xhr.responseJSON?.message || 'Could not update your profile.');
            }
        });
    });

    /* ==========================================================================
       UPDATE PASSWORD
       ========================================================================== */
    $('#updatePasswordForm').on('submit', function(e) {
        e.preventDefault();
        clearErrors('updatePasswordForm');

        const payload = {
            current_password: $('#current_password').val(),
            password: $('#new_password').val(),
            password_confirmation: $('#password_confirmation').val()
        };

        if (payload.password !== payload.password_confirmation) {
            $('#password_confirmation_error').text('New password and confirmation do not match.');
            return;
        }

        $.ajax({
            url: '/api/profile/password',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() {
                $('#updatePasswordForm')[0].reset();
                flashSaved('#passwordSavedMsg');
            },
            error: function(xhr) {
                $('#current_password_error').text(xhr.responseJSON?.message || 'Could not update your password.');
            }
        });
    });

    /* ==========================================================================
       ADDRESS BOOK — RENDER
       ========================================================================== */
    function renderAddresses(addresses) {
        const grid = $('#addressGrid');
        grid.empty();

        if (!addresses || addresses.length === 0) {
            grid.html('<div class="address-empty">You haven\'t saved any addresses yet.</div>');
            return;
        }

        addresses.forEach(addr => {
            const card = $(`
                <div class="address-card ${addr.is_default ? 'is-default' : ''}">
                    ${addr.is_default ? '<span class="address-card__default-tag">Default</span>' : ''}
                    ${addr.label ? `<span class="address-card__label">${addr.label}</span>` : ''}
                    <div class="address-card__name">${addr.full_name}</div>
                    ${addr.address_type ? `<span class="address-card__label" style="margin-left:6px;">${addr.address_type}</span>` : ''}
                    <div class="address-card__detail">
                        ${addr.phone}<br>
                        ${addr.address_line}${addr.landmark ? ' (' + addr.landmark + ')' : ''}<br>
                        ${addr.city}${addr.province ? ', ' + addr.province : ''} ${addr.postal_code || ''}<br>
                        ${addr.country || ''}
                    </div>
                    <div class="address-card__actions">
                        ${!addr.is_default ? `<button type="button" class="set-default-address" data-id="${addr.id}">Set Default</button>` : ''}
                        <a href="#" class="edit-address-row" data-id="${addr.id}">Edit</a>
                        <button type="button" class="danger delete-address-row" data-id="${addr.id}">Delete</button>
                    </div>
                </div>
            `);
            grid.append(card);
        });
    }

    /* ==========================================================================
       ADDRESS BOOK — MODAL CONTROLS
       ========================================================================== */
    $('#openAddAddressBtn').on('click', function() {
        resetAddressForm();
        $('#addressModalTitle').text('New Address');
        $('#addressModal').css('display', 'flex');
    });

    $('#closeAddressModalBtn').on('click', function() {
        $('#addressModal').hide();
    });

    $(document).on('click', '.edit-address-row', function(e) {
        e.preventDefault();
        const id = $(this).data('id');
        const address = cachedAddresses.find(a => a.id === id);
        if (!address) return;

        $('#address_id_field').val(address.id);
        $('#addr_label').val(address.label || 'Home');
        $('#addr_address_type').val(address.address_type || 'shipping');
        $('#addr_full_name').val(address.full_name);
        $('#addr_phone').val(address.phone);
        $('#addr_address_line').val(address.address_line);
        $('#addr_city').val(address.city);
        $('#addr_province').val(address.province || '');
        $('#addr_postal_code').val(address.postal_code || '');
        $('#addr_country').val(address.country || 'Philippines');
        $('#addr_landmark').val(address.landmark || '');

        $('#addressModalTitle').text('Edit Address');
        $('#addressModal').css('display', 'flex');
    });

    function resetAddressForm() {
        $('#addressForm')[0].reset();
        $('#address_id_field').val('');
    }

    /* ==========================================================================
       ADDRESS BOOK — SAVE (CREATE / UPDATE)
       ========================================================================== */
    $('#addressForm').on('submit', function(e) {
        e.preventDefault();
        const id = $('#address_id_field').val();

        const payload = {
            label: $('#addr_label').val(),
            address_type: $('#addr_address_type').val(),
            full_name: $('#addr_full_name').val().trim(),
            phone: $('#addr_phone').val().trim(),
            address_line: $('#addr_address_line').val().trim(),
            city: $('#addr_city').val().trim(),
            province: $('#addr_province').val().trim(),
            postal_code: $('#addr_postal_code').val().trim(),
            country: $('#addr_country').val().trim() || 'Philippines',
            landmark: $('#addr_landmark').val().trim()
        };

        const url = id ? `/api/addresses/${id}` : '/api/addresses';
        const method = id ? 'PATCH' : 'POST';

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() {
                $('#addressModal').hide();
                loadProfile();
            },
            error: function(xhr) {
                alert(xhr.responseJSON?.message || 'Could not save this address.');
            }
        });
    });

    /* ==========================================================================
       ADDRESS BOOK — DELETE / SET DEFAULT
       ========================================================================== */
    $(document).on('click', '.delete-address-row', function() {
        const id = $(this).data('id');
        if (confirm('Delete this address?')) {
            $.ajax({
                url: `/api/addresses/${id}`,
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function() { loadProfile(); }
            });
        }
    });

    $(document).on('click', '.set-default-address', function() {
        const id = $(this).data('id');
        $.ajax({
            url: `/api/addresses/${id}/default`,
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() { loadProfile(); }
        });
    });

    /* ==========================================================================
       DELETE ACCOUNT
       ========================================================================== */
    $('#deleteAccountForm').on('submit', function(e) {
        e.preventDefault();
        $('#delete_password_error').text('');

        if (!confirm('Are you absolutely sure? This cannot be undone.')) return;

        $.ajax({
            url: '/api/profile',
            method: 'DELETE',
            contentType: 'application/json',
            data: JSON.stringify({ password: $('#delete_password').val() }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            },
            error: function(xhr) {
                $('#delete_password_error').text(xhr.responseJSON?.message || 'Could not delete your account.');
            }
        });
    });

    /* ==========================================================================
       UTILITIES
       ========================================================================== */
    function clearErrors(formId) {
        $(`#${formId}`).find('.form-error').text('');
    }

    function flashSaved(selector) {
        $(selector).show();
        setTimeout(() => $(selector).fadeOut(), 2000);
    }

    function handleAuthFailure(xhr) {
        if (xhr.status === 401 || xhr.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
});