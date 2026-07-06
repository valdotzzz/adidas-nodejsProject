$(document).ready(function () {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '../login.html'; return; }

    let productsTable, categoriesTable, ordersTable, usersTable, auditTable, announcementsTable;
    let allProductsData = [];
    let barChart, lineChart, pieChart;
    let showingDeletedProducts = false;
    let currentProductImages = []; // existing ProductImage rows for the product being edited
    let imagesMarkedForRemoval = [];

    // Boot
    loadDashboard();
    initProductsTable();
    initCategoriesTable();
    initOrdersTable();
    initUsersTable();
    initAuditTable();
    initAnnouncementsTable();
    preloadCategoryDropdown();
    populateFilterCategoryDropdown();

    /* =================================================================
       SIDEBAR NAVIGATION
    ================================================================= */
    function showPanel(panelId, btnId) {
        $('.nav-item').removeClass('active');
        $(btnId).addClass('active');
        $('.admin-view-panel').hide();
        $(panelId).show();
    }

    $('#sidebar-dashboard-btn').on('click', function (e) { e.preventDefault(); showPanel('#dashboard-section', '#sidebar-dashboard-btn'); loadDashboard(); });
    $('#sidebar-products-btn').on('click', function (e) { e.preventDefault(); showPanel('#products-section', '#sidebar-products-btn'); productsTable.ajax.reload(null, false); });
    $('#sidebar-categories-btn').on('click', function (e) { e.preventDefault(); showPanel('#categories-section', '#sidebar-categories-btn'); categoriesTable.ajax.reload(null, false); });
    $('#sidebar-orders-btn').on('click', function (e) { e.preventDefault(); showPanel('#orders-section', '#sidebar-orders-btn'); ordersTable.ajax.reload(null, false); });
    $('#sidebar-users-btn').on('click', function (e) { e.preventDefault(); showPanel('#users-section', '#sidebar-users-btn'); usersTable.ajax.reload(null, false); });
    $('#sidebar-audit-btn').on('click', function (e) { e.preventDefault(); showPanel('#audit-section', '#sidebar-audit-btn'); auditTable.ajax.reload(null, false); });
    $('#sidebar-announcements-btn').on('click', function (e) { e.preventDefault(); showPanel('#announcements-section', '#sidebar-announcements-btn'); announcementsTable.ajax.reload(null, false); });
    $('#sidebar-stock-btn').on('click', function (e) { e.preventDefault(); showPanel('#stock-section', '#sidebar-stock-btn'); loadStockTable(); });

    /* =================================================================
       CONFIRM MODAL (replaces window.confirm)
    ================================================================= */
    function showConfirm(message, onYes) {
        $('#confirmModalMessage').text(message);
        $('#confirmModal').css('display', 'flex');
        $('#confirmModalYes').off('click').on('click', function () {
            $('#confirmModal').hide();
            onYes();
        });
        $('#confirmModalNo, #closeConfirmModalBtn').off('click').on('click', function () {
            $('#confirmModal').hide();
        });
    }

    /* =================================================================
       TOAST NOTIFICATION (replaces alert)
    ================================================================= */
    function showToast(message, type) {
        const colour = type === 'error' ? '#e53e3e' : '#2f8f4e';
        const toast = $(`<div style="position:fixed; bottom:24px; right:24px; background:${colour}; color:#fff; padding:14px 20px; font-size:13px; font-weight:600; z-index:9999; letter-spacing:0.5px; max-width:340px;">${message}</div>`);
        $('body').append(toast);
        setTimeout(() => toast.fadeOut(400, () => toast.remove()), 3500);
    }

    /* =================================================================
       INLINE FIELD VALIDATION HELPERS
    ================================================================= */
    function clearErrors() { $('.field-error').text(''); }

    function setError(fieldId, msg) { $(`#err-${fieldId}`).text(msg); }

    function validateProduct() {
        let valid = true;
        clearErrors();
        if (!$('#prod_name').val().trim()) { setError('prod_name', 'Product name is required.'); valid = false; }
        if (!$('#prod_style_code').val().trim()) { setError('prod_style_code', 'Style code is required.'); valid = false; }
        if (!$('#prod_category_id').val() || $('#prod_category_id').val() === '__new__') { setError('prod_category_id', 'Please select a category.'); valid = false; }
        if (!$('#prod_price').val() || parseFloat($('#prod_price').val()) <= 0) { setError('prod_price', 'Enter a valid price.'); valid = false; }
        return valid;
    }

    function validateCategory() {
        let valid = true;
        clearErrors();
        if (!$('#cat_name').val().trim()) { setError('cat_name', 'Category name is required.'); valid = false; }
        return valid;
    }

    function validateAnnouncement() {
        let valid = true;
        clearErrors();
        if (!$('#ann_message').val().trim()) { setError('ann_message', 'Message is required.'); valid = false; }
        return valid;
    }

    /* =================================================================
       DASHBOARD — STATS + CHARTS
    ================================================================= */
    function loadDashboard() {
        $.ajax({
            url: '/api/admin/dashboard', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (d) {
                $('#stat-revenue').text(`₱${parseFloat(d.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
                $('#stat-orders').text(d.new_orders_30d);
                $('#stat-lowstock').text(d.low_stock_variants);
                $('#stat-users').text(d.total_users);
            }
        });
        loadCharts($('#chartPeriodSelect').val());
    }

    $('#chartPeriodSelect').on('change', function () { loadCharts($(this).val()); });

    function loadCharts(days) {
        $.ajax({
            url: `/api/admin/dashboard/sales-chart?days=${days}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (rows) {
                const labels = rows.map(r => r.date);
                const revenues = rows.map(r => parseFloat(r.revenue));
                const orders = rows.map(r => parseInt(r.orders));

                if (barChart) barChart.destroy();
                barChart = new Chart(document.getElementById('barChart'), {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{ label: 'Daily Revenue (₱)', data: revenues, backgroundColor: 'rgba(255,255,255,0.7)' }]
                    },
                    options: { plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { ticks: { color: '#aaa' } }, y: { ticks: { color: '#aaa' } } } }
                });

                if (lineChart) lineChart.destroy();
                lineChart = new Chart(document.getElementById('lineChart'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{ label: 'Orders', data: orders, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', tension: 0.3, fill: true }]
                    },
                    options: { plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { ticks: { color: '#aaa' } }, y: { ticks: { color: '#aaa' } } } }
                });
            }
        });

        $.ajax({
            url: '/api/admin/dashboard/category-chart', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (rows) {
                if (pieChart) pieChart.destroy();
                pieChart = new Chart(document.getElementById('pieChart'), {
                    type: 'pie',
                    data: {
                        labels: rows.map(r => r.category),
                        datasets: [{ data: rows.map(r => parseFloat(r.revenue)), backgroundColor: ['#ffffff', '#aaaaaa', '#555555', '#333333', '#ff4444'] }]
                    },
                    options: { plugins: { legend: { labels: { color: '#ccc' } } } }
                });
            }
        });
    }

    /* =================================================================
       PRODUCTS TABLE
    ================================================================= */
    function initProductsTable() {
        productsTable = $('#productsSecureTable').DataTable({
            ajax: {
                url: '/api/products', method: 'GET', dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` },
                error: handleAuthFailure,
                dataSrc: function (json) { allProductsData = json; return json; }
            },
            columns: [
                { data: 'id' },
                { data: 'style_code', render: d => `<strong style="color:#aaa;">${d}</strong>` },
                { data: 'name' },
                { data: 'Category', render: d => d ? d.name : 'Unassigned' },
                { data: 'gender', render: d => `<span style="text-transform:uppercase; font-size:11px;">${d}</span>` },
                { data: 'price', render: d => `₱${parseFloat(d).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                {
                    data: 'sale_price', orderable: false,
                    render: (d, t, row) => (d != null && parseFloat(d) < parseFloat(row.price))
                        ? `<span style="color:#ff4d4d; font-weight:700;">₱${parseFloat(d).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`
                        : '<span style="color:#555;">—</span>'
                },
                { data: 'createdAt', render: (d, t) => renderDataTableDate(d, t) }, 
                { data: 'updatedAt', render: (d, t) => renderDataTableDate(d, t) }, 
                {
                    data: 'id', orderable: false,
                    render: d => showingDeletedProducts
                        ? `<button class="btn btn-dark restore-product-row" data-id="${d}" style="padding:6px 12px; font-size:11px; color:#4caf50;">Restore</button>`
                        : `<div style="display:flex; gap:8px;">
                            <button class="btn btn-dark edit-product-row" data-id="${d}" style="padding:6px 12px; font-size:11px;">Edit</button>
                            <button class="btn btn-dark delete-product-row" data-id="${d}" style="padding:6px 12px; font-size:11px; color:#ff4444;">Delete</button>
                        </div>`
                }
            ],
            responsive: true
        });
    }

    // Product filters
    $('#apply-product-filters').on('click', function () {
        const cat = $('#filter-category').val().toLowerCase();
        const gender = $('#filter-gender').val().toLowerCase();
        const style = $('#filter-style').val().toLowerCase();
        const minP = parseFloat($('#filter-price-min').val()) || 0;
        const maxP = parseFloat($('#filter-price-max').val()) || Infinity;

        productsTable.rows().every(function () {
            const d = this.data();
            const catMatch = !cat || (d.Category && d.Category.name.toLowerCase() === cat);
            const genderMatch = !gender || d.gender === gender;
            const styleMatch = !style || d.style_code.toLowerCase().includes(style);
            const priceMatch = parseFloat(d.price) >= minP && parseFloat(d.price) <= maxP;
            $(this.node()).toggle(catMatch && genderMatch && styleMatch && priceMatch);
        });
    });

    $('#clear-product-filters').on('click', function () {
        $('#filter-category, #filter-gender').val('');
        $('#filter-style, #filter-price-min, #filter-price-max').val('');
        productsTable.rows().every(function () { $(this.node()).show(); });
    });

    function populateFilterCategoryDropdown() {
        $.ajax({
            url: '/api/categories', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (cats) {
                cats.forEach(c => $('#filter-category').append(`<option value="${c.name.toLowerCase()}">${c.name}</option>`));
            }
        });
    }

    // Image preview
    $(document).on('change', '#prod_images', function () {
        const preview = $('#prod_image_preview').empty();
        Array.from(this.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => preview.append(`<img src="${e.target.result}" style="width:64px; height:64px; object-fit:cover; border:1px solid #333;">`);
            reader.readAsDataURL(file);
        });
    });

    /* =================================================================
       CATEGORIES TABLE
    ================================================================= */
    function initCategoriesTable() {
        categoriesTable = $('#categoriesSecureTable').DataTable({
            ajax: {
                url: '/api/categories', method: 'GET', dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` }, error: handleAuthFailure
            },
            columns: [
                { data: 'id' },
                { data: 'name', render: d => `<strong style="color:#fff;">${d}</strong>` },
                { data: 'createdAt', render: (d, t) => renderDataTableDate(d, t) }, 
                { data: 'updatedAt', render: (d, t) => renderDataTableDate(d, t) }, 
                {
                    data: 'id', orderable: false,
                    render: d => `
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-dark edit-category-row" data-id="${d}" style="padding:6px 12px; font-size:11px;">Edit</button>
                            <button class="btn btn-dark delete-category-row" data-id="${d}" style="padding:6px 12px; font-size:11px; color:#ff4444;">Delete</button>
                        </div>`
                }
            ],
            responsive: true
        });
    }

    /* =================================================================
       ANNOUNCEMENTS TABLE
    ================================================================= */
    function initAnnouncementsTable() {
        announcementsTable = $('#announcementsSecureTable').DataTable({
            ajax: {
                url: '/api/announcements', method: 'GET', dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` }, error: handleAuthFailure
            },
            columns: [
                { data: 'id' },
                { data: 'title', render: d => d ? `<strong style="color:#fff;">${d}</strong>` : '<span style="color:#555;">—</span>' },
                { data: 'message', render: d => `<span style="color:#ccc;">${d.length > 60 ? d.slice(0, 60) + '…' : d}</span>` },
                {
                    data: 'is_active', orderable: false,
                    render: d => d
                        ? '<span style="color:#2f8f4e; font-weight:700; font-size:11px; text-transform:uppercase;">Active</span>'
                        : '<span style="color:#777; font-weight:700; font-size:11px; text-transform:uppercase;">Inactive</span>'
                },
                {
                    data: null, orderable: false,
                    render: (d, t, row) => {
                        const start = row.start_date ? renderDataTableDate(row.start_date, 'display') : 'Immediately';
                        const end = row.end_date ? renderDataTableDate(row.end_date, 'display') : 'No end';
                        return `<span style="color:#aaa; font-size:12px;">${start} → ${end}</span>`;
                    }
                },
                { data: 'createdAt', render: (d, t) => renderDataTableDate(d, t) },
                {
                    data: 'id', orderable: false,
                    render: d => `
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-dark edit-announcement-row" data-id="${d}" style="padding:6px 12px; font-size:11px;">Edit</button>
                            <button class="btn btn-dark delete-announcement-row" data-id="${d}" style="padding:6px 12px; font-size:11px; color:#ff4444;">Delete</button>
                        </div>`
                }
            ],
            responsive: true
        });
    }

    /* =================================================================
       ORDERS TABLE
    ================================================================= */
    function initOrdersTable() {
        ordersTable = $('#ordersSecureTable').DataTable({
            ajax: {
                url: '/api/admin/orders', method: 'GET', dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` }, error: handleAuthFailure
            },
            columns: [
                { data: 'id', render: d => `#${String(d).padStart(6, '0')}` },
                { data: 'User', render: d => d ? `${d.name}<br><span style="color:#777; font-size:11px;">${d.email}</span>` : 'Guest' },
                {
                    data: null, orderable: false,
                    render: (d, t, row) => `<button class="btn btn-dark view-order-items" data-id="${row.id}" style="padding:4px 10px; font-size:11px;">${row.OrderItems ? row.OrderItems.length : 0} item(s)</button>`
                },
                { data: 'total_amount', render: d => `₱${parseFloat(d).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                {
                    data: 'status', render: (d, t, row) => `
                        <select class="form-select-control order-status-select" data-id="${row.id}" data-prev="${d}" style="padding:6px; background:#1a1a1a; border:1px solid #333; color:#fff;">
                            <option value="pending" ${d === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${d === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${d === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="completed" ${d === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${d === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            <option value="refunded" ${d === 'refunded' ? 'selected' : ''}>Refunded</option>
                        </select>`
                },
                { data: 'createdAt', render: (d, t) => renderDataTableDate(d, t) },
                { data: 'updatedAt', render: (d, t) => renderDataTableDate(d, t) },
                {
                    data: 'id', orderable: false,
                    render: d => `<button class="btn btn-dark delete-order-row" data-id="${d}" style="padding:6px 12px; font-size:11px; color:#ff4444;">Delete</button>`
                }
            ],
            responsive: true
        });
    }

    // Order items pop-up
    $(document).on('click', '.view-order-items', function () {
        const id = $(this).data('id');
        $.ajax({
            url: `/api/admin/orders/${id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (order) {
                $('#orderItemsModalTitle').text(`Order #${String(order.id).padStart(6, '0')} — Items`);
                const items = order.OrderItems || [];
                let html = `<table style="width:100%; border-collapse:collapse; font-size:13px; color:#ccc;">
                    <thead><tr style="border-bottom:1px solid #333;">
                        <th style="padding:8px 4px; text-align:left;">Product</th>
                        <th style="padding:8px 4px;">Size</th>
                        <th style="padding:8px 4px;">Colorway</th>
                        <th style="padding:8px 4px;">Qty</th>
                        <th style="padding:8px 4px; text-align:right;">Price</th>
                    </tr></thead><tbody>`;
                items.forEach(item => {
                    const variant = item.Variant || {};
                    const product = variant.Product || {};
                    html += `<tr style="border-bottom:1px solid #1a1a1a;">
                        <td style="padding:10px 4px;">${product.name || 'Product'}</td>
                        <td style="padding:10px 4px; text-align:center;">${variant.size_type || ''} ${variant.size_value || ''}</td>
                        <td style="padding:10px 4px; text-align:center;">${variant.colorway || '—'}</td>
                        <td style="padding:10px 4px; text-align:center;">${item.quantity}</td>
                        <td style="padding:10px 4px; text-align:right;">₱${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>`;
                });
                html += `</tbody></table>
                    <div style="text-align:right; margin-top:16px; font-weight:700; color:#fff;">
                        Total: ₱${parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>`;
                $('#orderItemsModalBody').html(html);
                $('#orderItemsModal').css('display', 'flex');
            }
        });
    });

    $('#closeOrderItemsModalBtn').on('click', function () { $('#orderItemsModal').hide(); });

    $(document).on('change', '.order-status-select', function () {
        const select = $(this);
        const id = select.data('id');
        const prevStatus = select.data('prev');
        const status = select.val();

        showConfirm(`Change order #${String(id).padStart(6, '0')} status from "${prevStatus}" to "${status}"? The customer will be emailed.`, function () {
            $.ajax({
                url: `/api/admin/orders/${id}`, method: 'PUT',
                contentType: 'application/json', data: JSON.stringify({ status }),
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Order status updated.', 'success'); ordersTable.ajax.reload(null, false); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Update failed.', 'error'); ordersTable.ajax.reload(null, false); }
            });
        });

        // If the admin backs out of the confirmation, snap the dropdown back
        // to its previous value instead of leaving it on the unapplied choice.
        $('#confirmModalNo, #closeConfirmModalBtn').off('click.restoreOrderStatus').on('click.restoreOrderStatus', function () {
            select.val(prevStatus);
        });
    });

    $(document).on('click', '.delete-order-row', function () {
        const id = $(this).data('id');
        showConfirm('Delete this order? It will be hidden from the ledger.', function () {
            $.ajax({
                url: `/api/admin/orders/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Order deleted.', 'success'); ordersTable.ajax.reload(null, false); }
            });
        });
    });

    /* =================================================================
       USERS TABLE
    ================================================================= */
    function initUsersTable() {
        usersTable = $('#usersSecureTable').DataTable({
            ajax: {
                url: '/api/admin/users', method: 'GET', dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` }, error: handleAuthFailure
            },
            columns: [
                { data: 'id' },
                { data: 'name' },
                { data: 'email' },
                {
                    data: 'role', render: (d, t, row) => `
                        <select class="form-select-control user-role-select" data-id="${row.id}" data-prev="${d}" style="padding:6px; background:#1a1a1a; border:1px solid #333; color:#fff;">
                            <option value="customer" ${d === 'customer' ? 'selected' : ''}>Customer</option>
                            <option value="staff" ${d === 'staff' ? 'selected' : ''}>Staff</option>
                            <option value="admin" ${d === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>`
                },
                {
                    data: 'status',
                    render: d => d === 'active'
                        ? `<span style="color:#4caf50; text-transform:uppercase; font-size:11px;">Active</span>`
                        : `<span style="color:#ff4444; text-transform:uppercase; font-size:11px;">Deactivated</span>`
                },
                { data: 'createdAt', render: (d, t) => renderDataTableDate(d, t) },
                { data: 'updatedAt', render: (d, t) => renderDataTableDate(d, t) },
                {
                    data: 'id', orderable: false,
                    render: (d, t, row) => `
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-dark view-user-addresses" data-id="${d}" data-name="${row.name}" style="padding:6px 12px; font-size:11px;">Addresses</button>
                            <button class="btn btn-dark toggle-user-status" data-id="${d}" style="padding:6px 12px; font-size:11px; ${row.status === 'active' ? 'color:#ff4444;' : 'color:#4caf50;'}">
                                ${row.status === 'active' ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button class="btn btn-dark delete-user-row" data-id="${d}" style="padding:6px 12px; font-size:11px; color:#ff4444;">Delete</button>
                        </div>`
                }
            ],
            responsive: true
        });
    }

    $(document).on('change', '.user-role-select', function () {
        const select = $(this);
        const id = select.data('id');
        const prevRole = select.data('prev');
        const role = select.val();

        showConfirm(`Change this user's role from "${prevRole}" to "${role}"? This changes what they can access.`, function () {
            $.ajax({
                url: `/api/admin/users/${id}/role`, method: 'PATCH',
                contentType: 'application/json', data: JSON.stringify({ role }),
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Role updated.', 'success'); usersTable.ajax.reload(null, false); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Role update failed.', 'error'); usersTable.ajax.reload(null, false); }
            });
        });

        $('#confirmModalNo, #closeConfirmModalBtn').off('click.restoreUserRole').on('click.restoreUserRole', function () {
            select.val(prevRole);
        });
    });

    $(document).on('click', '.view-user-addresses', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        $.ajax({
            url: `/api/admin/users/${id}/addresses`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (addresses) {
                $('#userAddressesModalTitle').text(`${name} — Saved Addresses`);
                if (!addresses || addresses.length === 0) {
                    $('#userAddressesModalBody').html('<p style="color:#777; padding:20px 0;">No saved addresses.</p>');
                } else {
                    let html = '<div style="display:flex; flex-direction:column; gap:12px; padding-top:16px;">';
                    addresses.forEach(a => {
                        html += `<div style="border:1px solid #222; padding:14px; font-size:13px; color:#ccc;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                <strong style="color:#fff;">${a.label || 'Address'} <span style="color:#777; font-weight:400; text-transform:uppercase; font-size:10px;">(${a.address_type || 'shipping'})</span></strong>
                                ${a.is_default ? '<span style="color:#4caf50; font-size:11px;">Default</span>' : ''}
                            </div>
                            <div>${a.full_name} — ${a.phone}</div>
                            <div>${a.address_line}${a.landmark ? ' (' + a.landmark + ')' : ''}</div>
                            <div>${a.city}${a.province ? ', ' + a.province : ''} ${a.postal_code || ''}, ${a.country || ''}</div>
                        </div>`;
                    });
                    html += '</div>';
                    $('#userAddressesModalBody').html(html);
                }
                $('#userAddressesModal').css('display', 'flex');
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Could not load addresses.', 'error'); }
        });
    });

    $('#closeUserAddressesModalBtn').on('click', function () { $('#userAddressesModal').hide(); });

    $(document).on('click', '.toggle-user-status', function () {
        const id = $(this).data('id');
        showConfirm('Change this user\'s account status?', function () {
            $.ajax({
                url: `/api/admin/users/${id}/status`, method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Status updated.', 'success'); usersTable.ajax.reload(null, false); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Failed.', 'error'); }
            });
        });
    });

    $(document).on('click', '.delete-user-row', function () {
        const id = $(this).data('id');
        showConfirm('Delete this user account? It will be hidden from the roster.', function () {
            $.ajax({
                url: `/api/admin/users/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('User deleted.', 'success'); usersTable.ajax.reload(null, false); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Delete failed.', 'error'); }
            });
        });
    });

    /* =================================================================
       AUDIT LOGS TABLE
    ================================================================= */
    function initAuditTable(category) {
        if (auditTable) auditTable.destroy();
        auditTable = $('#auditLogsTable').DataTable({
            ajax: {
                url: `/api/admin/dashboard/audit-logs${category ? '?category=' + category : ''}`,
                method: 'GET', dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` }, error: handleAuthFailure
            },
            columns: [
                { data: 'createdAt', render: (d, t) => renderDataTableDate(d, t) },
                { data: 'updatedAt', render: (d, t) => renderDataTableDate(d, t) },
                { data: 'category', render: d => `<span style="text-transform:uppercase; font-size:10px; letter-spacing:1px; color:#aaa;">${d}</span>` },
                { data: 'action', render: d => `<strong>${d}</strong>` },
                { data: 'User', render: d => d ? `${d.name}<br><span style="color:#777; font-size:11px;">${d.email}</span>` : '—' },
                { data: 'description' }
            ],
            order: [[0, 'desc']],
            responsive: true
        });
    }

    $(document).on('click', '.audit-filter-btn', function () {
        $('.audit-filter-btn').removeClass('active');
        $(this).addClass('active');
        initAuditTable($(this).data('cat'));
    });

    /* =================================================================
       MODAL — OPEN / CLOSE
    ================================================================= */
    $('#openCreateProductBtn').on('click', function () {
        resetFormStates();
        $('#modalTargetTitle').text('Register Product Variant');
        $('#productCrudTabs').hide();
        $('#productDetailsTab').closest('form').show();
        $('#productVariantsTab').hide();
        $('#crudModal').css('display', 'flex');
    });

    $('#openCreateCategoryBtn').on('click', function () {
        resetFormStates();
        $('#modalTargetTitle').text('Define Category Segment');
        $('#categoryCrudForm').show();
        $('#crudModal').css('display', 'flex');
    });

    $('#openCreateAnnouncementBtn').on('click', function () {
        resetFormStates();
        $('#modalTargetTitle').text('Create Announcement');
        $('#announcementCrudForm').show();
        $('#crudModal').css('display', 'flex');
    });

    $('#closeModalBtn').on('click', function () { $('#crudModal').hide(); resetFormStates(); });

    /* =================================================================
       CATEGORY DROPDOWN (with inline create)
    ================================================================= */
    function preloadCategoryDropdown() {
        $.ajax({
            url: '/api/categories', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (categories) {
                const select = $('#prod_category_id');
                const currentVal = select.val();
                select.empty();
                categories.forEach(c => select.append(`<option value="${c.id}">${c.name}</option>`));
                select.append(`<option value="__new__">+ Add New Category</option>`);
                if (currentVal) select.val(currentVal);
            }
        });
    }

    $(document).on('change', '#prod_category_id', function () {
        if ($(this).val() !== '__new__') return;
        const name = window.prompt('New category name:');
        if (!name || !name.trim()) { $(this).val(''); return; }
        $.ajax({
            url: '/api/categories', method: 'POST',
            contentType: 'application/json', data: JSON.stringify({ name: name.trim() }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (response) {
                categoriesTable.ajax.reload(null, false);
                preloadCategoryDropdownThenSelect(response.category.id);
                showToast(`Category "${response.category.name}" created.`, 'success');
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Failed.', 'error'); $('#prod_category_id').val(''); }
        });
    });

    function preloadCategoryDropdownThenSelect(newCategoryId) {
        $.ajax({
            url: '/api/categories', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (categories) {
                const select = $('#prod_category_id');
                select.empty();
                categories.forEach(c => select.append(`<option value="${c.id}">${c.name}</option>`));
                select.append(`<option value="__new__">+ Add New Category</option>`);
                select.val(newCategoryId);
            }
        });
    }

    /* =================================================================
       PRODUCT CRUD
    ================================================================= */
    $('#productCrudForm').on('submit', function (e) {
        e.preventDefault();
        if (!validateProduct()) return;
        const id = $('#product_id_field').val();

        // Always use FormData — this is what actually lets image uploads be
        // saved on BOTH create and edit (previously edit sent plain JSON and
        // silently dropped any newly selected images).
        const formData = new FormData();
        formData.append('name', $('#prod_name').val().trim());
        formData.append('style_code', $('#prod_style_code').val().trim());
        formData.append('category_id', $('#prod_category_id').val());
        formData.append('gender', $('#prod_gender').val());
        formData.append('price', $('#prod_price').val());
        formData.append('sale_price', $('#prod_sale_price').val() ? $('#prod_sale_price').val() : '');
        formData.append('description', $('#prod_description').val().trim());
        formData.append('image_urls', $('#prod_image_urls').val().trim());
        formData.append('remove_image_ids', JSON.stringify(imagesMarkedForRemoval));

        const files = $('#prod_images')[0].files;
        for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

        $.ajax({
            url: id ? `/api/products/${id}` : '/api/products',
            method: id ? 'PUT' : 'POST',
            data: formData,
            contentType: false,
            processData: false,
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (response) {
                showToast(id ? 'Product updated.' : 'Product created.', 'success');
                productsTable.ajax.reload(null, false);
                if (id) {
                    // Stay open so the admin can keep working on variants for this product
                    const savedProduct = response.product;
                    currentProductImages = savedProduct.ProductImages || [];
                    imagesMarkedForRemoval = [];
                    renderExistingImages();
                    $('#prod_images').val('');
                    $('#prod_image_urls').val('');
                } else {
                    $('#crudModal').hide();
                    resetFormStates();
                }
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Save failed.', 'error'); }
        });
    });

    function renderExistingImages() {
        const wrap = $('#prod_existing_images').empty();
        if (currentProductImages.length === 0) {
            wrap.append('<div style="color:#777; font-size:11px;">No images yet — a default placeholder is shown on the storefront.</div>');
            return;
        }
        currentProductImages.forEach(img => {
            const marked = imagesMarkedForRemoval.includes(img.id);
            wrap.append(`
                <div class="existing-image-thumb" data-id="${img.id}" style="position:relative; cursor:pointer;">
                    <img src="${img.image_path}" style="width:64px; height:64px; object-fit:cover; border:2px solid ${marked ? '#ff4444' : '#333'}; opacity:${marked ? '0.4' : '1'};">
                    ${marked ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#ff4444; font-weight:700; font-size:11px;">REMOVE</div>' : ''}
                </div>
            `);
        });
    }

    $(document).on('click', '.existing-image-thumb', function () {
        const id = parseInt($(this).data('id'));
        if (imagesMarkedForRemoval.includes(id)) {
            imagesMarkedForRemoval = imagesMarkedForRemoval.filter(x => x !== id);
        } else {
            imagesMarkedForRemoval.push(id);
        }
        renderExistingImages();
    });

    $(document).on('click', '.edit-product-row', function () {
        const id = $(this).data('id');
        resetFormStates();
        $.ajax({
            url: `/api/products/${id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (p) {
                $('#product_id_field').val(p.id);
                $('#prod_name').val(p.name);
                $('#prod_style_code').val(p.style_code);
                preloadCategoryDropdown();
                setTimeout(() => $('#prod_category_id').val(p.category_id), 300);
                $('#prod_gender').val(p.gender);
                $('#prod_price').val(p.price);
                $('#prod_sale_price').val(p.sale_price != null ? p.sale_price : '');
                $('#prod_description').val(p.description);
                currentProductImages = p.ProductImages || [];
                imagesMarkedForRemoval = [];
                renderExistingImages();
                $('#modalTargetTitle').text(`Edit Product: #${p.style_code}`);
                $('#productCrudTabs').css('display', 'flex');
                showProductTab('details');
                loadVariantsForProduct(id);
                $('#productCrudForm').show();
                $('#crudModal').css('display', 'flex');
            }
        });
    });

    $(document).on('click', '.delete-product-row', function () {
        const id = $(this).data('id');
        showConfirm('Delete this product? It will be soft-deleted and hidden from the storefront.', function () {
            $.ajax({
                url: `/api/products/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Product deleted.', 'success'); productsTable.ajax.reload(null, false); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Delete failed.', 'error'); }
            });
        });
    });

    /* =================================================================
       PRODUCTS — VIEW DELETED / RESTORE
    ================================================================= */
    $('#toggleProductTrashBtn').on('click', function () {
        showingDeletedProducts = !showingDeletedProducts;
        $(this).text(showingDeletedProducts ? '← Back to Active' : '🗑 View Deleted');
        $('#openCreateProductBtn').toggle(!showingDeletedProducts);
        productsTable.ajax.url(showingDeletedProducts ? '/api/products/trash/list' : '/api/products').load();
    });

    $(document).on('click', '.restore-product-row', function () {
        const id = $(this).data('id');
        showConfirm('Restore this product? It will reappear on the storefront and in the active list.', function () {
            $.ajax({
                url: `/api/products/${id}/restore`, method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Product restored.', 'success'); productsTable.ajax.reload(null, false); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Restore failed.', 'error'); }
            });
        });
    });

    /* =================================================================
       PRODUCT VARIANTS TAB
    ================================================================= */
    $(document).on('click', '.product-tab-btn', function () {
        showProductTab($(this).data('tab'));
    });

    function showProductTab(tab) {
        $('.product-tab-btn').removeClass('active');
        $(`.product-tab-btn[data-tab="${tab}"]`).addClass('active');
        $('#productDetailsTab').closest('form').toggle(tab === 'details');
        $('#productVariantsTab').toggle(tab === 'variants');
    }

    function loadVariantsForProduct(productId) {
        $.ajax({
            url: `/api/products/${productId}/variants`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (variants) { renderVariantsList(productId, variants); }
        });
    }

    function renderVariantsList(productId, variants) {
        const wrap = $('#variantsListWrapper').empty();
        if (!variants || variants.length === 0) {
            wrap.append('<div style="color:#777; font-size:12px;">No variants yet — add sizes and colorways below.</div>');
            return;
        }
        const table = $(`<table style="width:100%; border-collapse:collapse; font-size:12px; color:#ccc;">
            <thead><tr style="border-bottom:1px solid #333; text-align:left;">
                <th style="padding:8px 4px;">Colorway</th><th style="padding:8px 4px;">Size</th>
                <th style="padding:8px 4px;">Stock</th><th style="padding:8px 4px;"></th>
            </tr></thead><tbody></tbody></table>`);
        const tbody = table.find('tbody');
        variants.forEach(v => {
            tbody.append(`
                <tr style="border-bottom:1px solid #1a1a1a;" data-variant-id="${v.id}">
                    <td style="padding:8px 4px;">${v.colorway}</td>
                    <td style="padding:8px 4px;">${v.size_type} ${v.size_value}</td>
                    <td style="padding:8px 4px;">
                        <input type="number" class="variant-stock-input" data-id="${v.id}" value="${v.stock_level}" style="width:60px; padding:4px; background:#1a1a1a; border:1px solid #333; color:#fff;">
                    </td>
                    <td style="padding:8px 4px; text-align:right;">
                        <button type="button" class="btn btn-dark save-variant-stock" data-id="${v.id}" style="padding:4px 10px; font-size:10px;">Save</button>
                        <button type="button" class="btn btn-dark delete-variant-btn" data-id="${v.id}" style="padding:4px 10px; font-size:10px; color:#ff4444;">Delete</button>
                    </td>
                </tr>`);
        });
        wrap.append(table);
        wrap.data('productId', productId);
    }

    $(document).on('click', '#addVariantBtn', function () {
        const productId = $('#product_id_field').val();
        if (!productId) { showToast('Save the product first.', 'error'); return; }

        const colorway = $('#new_variant_colorway').val().trim();
        const size_type = $('#new_variant_size_type').val();
        const size_value = $('#new_variant_size_value').val();
        const stock_level = $('#new_variant_stock').val() || 0;

        if (!colorway || !size_value) { showToast('Colorway and size are required.', 'error'); return; }

        $.ajax({
            url: `/api/products/${productId}/variants`, method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ colorway, size_type, size_value, stock_level }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                showToast('Variant added.', 'success');
                $('#new_variant_colorway, #new_variant_size_value').val('');
                $('#new_variant_stock').val(0);
                loadVariantsForProduct(productId);
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Could not add variant.', 'error'); }
        });
    });

    $(document).on('click', '.save-variant-stock', function () {
        const id = $(this).data('id');
        const stock_level = $(`.variant-stock-input[data-id="${id}"]`).val();
        const productId = $('#product_id_field').val();
        $.ajax({
            url: `/api/variants/${id}`, method: 'PUT',
            contentType: 'application/json', data: JSON.stringify({ stock_level }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () { showToast('Variant updated.', 'success'); loadVariantsForProduct(productId); },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Could not update variant.', 'error'); }
        });
    });

    $(document).on('click', '.delete-variant-btn', function () {
        const id = $(this).data('id');
        const productId = $('#product_id_field').val();
        showConfirm('Remove this variant? Any stock tracking for it will be lost.', function () {
            $.ajax({
                url: `/api/variants/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () { showToast('Variant removed.', 'success'); loadVariantsForProduct(productId); },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Could not delete variant.', 'error'); }
            });
        });
    });

    /* =================================================================
       CATEGORY CRUD
    ================================================================= */
    $('#categoryCrudForm').on('submit', function (e) {
        e.preventDefault();
        if (!validateCategory()) return;
        const id = $('#category_id_field').val();
        const payload = { name: $('#cat_name').val().trim() };
        $.ajax({
            url: id ? `/api/categories/${id}` : '/api/categories',
            method: id ? 'PUT' : 'POST',
            contentType: 'application/json', data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#crudModal').hide();
                showToast(id ? 'Category updated.' : 'Category created.', 'success');
                categoriesTable.ajax.reload(null, false);
                preloadCategoryDropdown();
                resetFormStates();
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Save failed.', 'error'); }
        });
    });

    $(document).on('click', '.edit-category-row', function () {
        const id = $(this).data('id');
        resetFormStates();
        $.ajax({
            url: `/api/categories/${id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (c) {
                $('#category_id_field').val(c.id);
                $('#cat_name').val(c.name);
                $('#modalTargetTitle').text(`Edit Category: ${c.name}`);
                $('#categoryCrudForm').show();
                $('#crudModal').css('display', 'flex');
            }
        });
    });

    $(document).on('click', '.delete-category-row', function () {
        const id = $(this).data('id');
        showConfirm('Delete this category? Products assigned to it cannot be deleted until reassigned.', function () {
            $.ajax({
                url: `/api/categories/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () {
                    showToast('Category deleted.', 'success');
                    categoriesTable.ajax.reload(null, false);
                    preloadCategoryDropdown();
                },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Delete failed.', 'error'); }
            });
        });
    });

    /* =================================================================
       ANNOUNCEMENT CRUD
    ================================================================= */
    function toDatetimeLocalValue(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    $('#announcementCrudForm').on('submit', function (e) {
        e.preventDefault();
        if (!validateAnnouncement()) return;
        const id = $('#announcement_id_field').val();
        const payload = {
            title: $('#ann_title').val().trim(),
            message: $('#ann_message').val().trim(),
            link_url: $('#ann_link_url').val().trim(),
            link_text: $('#ann_link_text').val().trim(),
            is_active: $('#ann_is_active').is(':checked'),
            start_date: $('#ann_start_date').val() || null,
            end_date: $('#ann_end_date').val() || null
        };
        $.ajax({
            url: id ? `/api/announcements/${id}` : '/api/announcements',
            method: id ? 'PUT' : 'POST',
            contentType: 'application/json', data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#crudModal').hide();
                showToast(id ? 'Announcement updated.' : 'Announcement created.', 'success');
                announcementsTable.ajax.reload(null, false);
                resetFormStates();
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Save failed.', 'error'); }
        });
    });

    $(document).on('click', '.edit-announcement-row', function () {
        const id = $(this).data('id');
        resetFormStates();
        $.ajax({
            url: `/api/announcements/${id}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (a) {
                $('#announcement_id_field').val(a.id);
                $('#ann_title').val(a.title || '');
                $('#ann_message').val(a.message || '');
                $('#ann_link_url').val(a.link_url || '');
                $('#ann_link_text').val(a.link_text || '');
                $('#ann_is_active').prop('checked', !!a.is_active);
                $('#ann_start_date').val(toDatetimeLocalValue(a.start_date));
                $('#ann_end_date').val(toDatetimeLocalValue(a.end_date));
                $('#modalTargetTitle').text('Edit Announcement');
                $('#announcementCrudForm').show();
                $('#crudModal').css('display', 'flex');
            }
        });
    });

    $(document).on('click', '.delete-announcement-row', function () {
        const id = $(this).data('id');
        showConfirm('Delete this announcement? It will stop showing to shoppers immediately.', function () {
            $.ajax({
                url: `/api/announcements/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () {
                    showToast('Announcement deleted.', 'success');
                    announcementsTable.ajax.reload(null, false);
                },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Delete failed.', 'error'); }
            });
        });
    });

    /* =================================================================
       UTILITIES
    ================================================================= */
    function resetFormStates() {
        $('.modal-form-wrapper').hide();
        $('#productCrudForm')[0].reset();
        $('#categoryCrudForm')[0].reset();
        $('#announcementCrudForm')[0].reset();
        $('#product_id_field, #category_id_field, #announcement_id_field').val('');
        $('#prod_image_preview, #prod_existing_images, #variantsListWrapper').empty();
        $('#productCrudTabs').hide();
        currentProductImages = [];
        imagesMarkedForRemoval = [];
        clearErrors();
    }

    /* =================================================================
       STOCK MANAGER
    ================================================================= */

    let stockData     = [];   // full variant list from API
    let selectedVarIds = new Set();  // variant IDs user has checked

    function loadStockTable() {
        $('#stockTable tbody').html('<tr><td colspan="6" style="text-align:center; padding:32px; color:#555;">Loading…</td></tr>');
        selectedVarIds.clear();
        updateSelectedCount();

        $.ajax({
            url: '/api/admin/stock', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (data) {
                stockData = data;
                renderStockRows(stockData);
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Failed to load stock data.', 'error'); }
        });
    }

    function renderStockRows(rows) {
        const tbody = $('#stockTable tbody').empty();

        if (!rows.length) {
            tbody.html('<tr><td colspan="6" style="text-align:center; padding:32px; color:#555;">No variants found.</td></tr>');
            return;
        }

        rows.forEach(v => {
            const stock     = v.stock_level;
            const stockCol  = stock === 0  ? '#ff4444'
                            : stock <= 5   ? '#ff9800'
                            : '#4caf50';
            const isChecked = selectedVarIds.has(v.id);
            const colorway  = v.Colorway?.name  || '—';
            const size      = v.ShoeSize?.label  || '—';
            const product   = v.Product?.name    || '—';
            const style     = v.Product?.style_code || '—';

            tbody.append(`
                <tr data-id="${v.id}">
                    <td><input type="checkbox" class="stock-row-cb" data-id="${v.id}" ${isChecked ? 'checked' : ''}></td>
                    <td>${product}</td>
                    <td><span style="color:#aaa; font-size:11px;">${style}</span></td>
                    <td>${colorway}</td>
                    <td>${size}</td>
                    <td><span style="color:${stockCol}; font-weight:700;">${stock}</span></td>
                </tr>`);
        });

        // Re-init DataTables on this table if already initialised
        if ($.fn.DataTable.isDataTable('#stockTable')) {
            $('#stockTable').DataTable().destroy();
        }
        $('#stockTable').DataTable({
            paging: true,
            searching: false,   // we use our own filter bar
            ordering: true,
            columnDefs: [{ orderable: false, targets: 0 }],
            responsive: true
        });
    }

    // Filter bar — live filter on the cached data, no round-trip
    function applyStockFilters() {
        const prod  = $('#stock-filter-product').val().toLowerCase();
        const cw    = $('#stock-filter-colorway').val().toLowerCase();
        const level = $('#stock-filter-level').val();

        const filtered = stockData.filter(v => {
            const name  = (v.Product?.name       || '').toLowerCase();
            const style = (v.Product?.style_code  || '').toLowerCase();
            const color = (v.Colorway?.name        || '').toLowerCase();

            const prodMatch  = !prod  || name.includes(prod) || style.includes(prod);
            const cwMatch    = !cw    || color.includes(cw);
            const levelMatch = level === ''    ? true
                             : level === 'out' ? v.stock_level === 0
                             : level === 'low' ? (v.stock_level > 0 && v.stock_level <= 5)
                             : v.stock_level > 5;

            return prodMatch && cwMatch && levelMatch;
        });

        renderStockRows(filtered);
    }

    $('#stock-filter-product, #stock-filter-colorway').on('input', applyStockFilters);
    $('#stock-filter-level').on('change', applyStockFilters);

    // Checkbox selection
    $(document).on('change', '.stock-row-cb', function () {
        const id = parseInt($(this).data('id'));
        if ($(this).is(':checked')) selectedVarIds.add(id);
        else                         selectedVarIds.delete(id);
        updateSelectedCount();
    });

    $('#stock-header-checkbox').on('change', function () {
        const check = $(this).is(':checked');
        $('.stock-row-cb').each(function () {
            $(this).prop('checked', check);
            const id = parseInt($(this).data('id'));
            if (check) selectedVarIds.add(id);
            else        selectedVarIds.delete(id);
        });
        updateSelectedCount();
    });

    $('#stock-select-all').on('click', function () {
        $('.stock-row-cb').prop('checked', true).each(function () {
            selectedVarIds.add(parseInt($(this).data('id')));
        });
        updateSelectedCount();
    });

    $('#stock-deselect-all').on('click', function () {
        $('.stock-row-cb').prop('checked', false);
        selectedVarIds.clear();
        updateSelectedCount();
    });

    function updateSelectedCount() {
        const n = selectedVarIds.size;
        $('#stock-selected-count').text(n > 0 ? `${n} selected` : '');
        $('#openStockAdjustBtn').prop('disabled', n === 0);
    }

    // Open the adjustment modal
    $('#openStockAdjustBtn').on('click', function () {
        if (!selectedVarIds.size) return;

        const selected = stockData.filter(v => selectedVarIds.has(v.id));
        const list     = $('#stockAdjustList').empty();

        selected.forEach(v => {
            const colorway = v.Colorway?.name  || '—';
            const size     = v.ShoeSize?.label  || '—';
            const product  = v.Product?.name    || '—';
            const style    = v.Product?.style_code || '';

            list.append(`
                <div class="stock-adjust-row" data-id="${v.id}" data-current="${v.stock_level}"
                     style="display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center;
                            padding:14px 0; border-bottom:1px solid #1a1a1a;">
                    <div>
                        <div style="font-weight:700; font-size:13px;">${product}</div>
                        <div style="color:#aaa; font-size:11px; margin-top:2px;">
                            ${style} · ${colorway} · Size ${size}
                        </div>
                        <div style="margin-top:4px; font-size:12px;">
                            Current stock: <span class="stock-current-badge" style="color:#fff; font-weight:700;">${v.stock_level}</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="stock-decrement btn btn-dark"
                                style="width:32px; height:32px; padding:0; font-size:16px; line-height:1;">−</button>
                        <input type="number" class="stock-delta-input"
                               value="0"
                               style="width:72px; text-align:center; padding:8px; background:#0a0a0a;
                                      border:1px solid #333; color:#fff; font-size:14px; font-weight:700;">
                        <button class="stock-increment btn btn-dark"
                                style="width:32px; height:32px; padding:0; font-size:16px; line-height:1;">+</button>
                        <div style="min-width:60px; text-align:center; font-size:13px; color:#aaa;">
                            → <span class="stock-preview-val" style="font-weight:700; color:#fff;">${v.stock_level}</span>
                        </div>
                    </div>
                </div>`);
        });

        // Reset to step 1
        $('#stockAdjustStep1').show();
        $('#stockAdjustStep2').hide();
        $('#stockAdjustNextBtn').show();
        $('#stockAdjustBackBtn').hide();
        $('#stockAdjustAcceptBtn').hide();

        $('#stockAdjustModal').css('display', 'flex');
    });

    // +/− stepper buttons inside the modal
    $(document).on('click', '.stock-increment', function () {
        const inp = $(this).siblings('.stock-delta-input');
        inp.val(parseInt(inp.val() || 0) + 1).trigger('input');
    });
    $(document).on('click', '.stock-decrement', function () {
        const inp = $(this).siblings('.stock-delta-input');
        inp.val(parseInt(inp.val() || 0) - 1).trigger('input');
    });

    // Live preview of resulting stock
    $(document).on('input', '.stock-delta-input', function () {
        const row     = $(this).closest('.stock-adjust-row');
        const current = parseInt(row.data('current'));
        const delta   = parseInt($(this).val()) || 0;
        const after   = Math.max(0, current + delta);

        row.find('.stock-preview-val').text(after).css('color',
            after === 0 ? '#ff4444' : after <= 5 ? '#ff9800' : '#4caf50'
        );
    });

    // "Review Changes" → build the confirmation summary
    $('#stockAdjustNextBtn').on('click', function () {
        const adjustments = buildAdjustments();

        if (!adjustments.length) {
            showToast('No changes entered — adjust at least one delta value.', 'error');
            return;
        }

        // Build readable summary
        const confirmList = $('#stockConfirmList').empty();
        adjustments.forEach(a => {
            const v       = stockData.find(x => x.id === a.variant_id);
            const product = v?.Product?.name  || `Variant #${a.variant_id}`;
            const style   = v?.Product?.style_code || '';
            const color   = v?.Colorway?.name  || '';
            const size    = v?.ShoeSize?.label  || '';
            const current = parseInt($(`[data-id="${a.variant_id}"]`).data('current'));
            const after   = Math.max(0, current + a.delta);
            const arrow   = a.delta > 0 ? `<span style="color:#4caf50">+${a.delta}</span>`
                                        : `<span style="color:#ff4444">${a.delta}</span>`;

            confirmList.append(`
                <div style="padding:12px 0; border-bottom:1px solid #1a1a1a; font-size:13px;">
                    <span style="font-weight:700;">${product}</span>
                    <span style="color:#666; font-size:11px; margin-left:6px;">${style}</span><br>
                    <span style="color:#aaa;">${color} · Size ${size}</span><br>
                    <span style="margin-top:4px; display:inline-block;">
                        Stock: <strong>${current}</strong> ${arrow} → <strong>${after}</strong>
                    </span>
                </div>`);
        });

        $('#stockAdjustStep1').hide();
        $('#stockAdjustStep2').show();
        $('#stockAdjustNextBtn').hide();
        $('#stockAdjustBackBtn').show();
        $('#stockAdjustAcceptBtn').show();
    });

    // "← Edit" — go back to step 1
    $('#stockAdjustBackBtn').on('click', function () {
        $('#stockAdjustStep2').hide();
        $('#stockAdjustStep1').show();
        $('#stockAdjustNextBtn').show();
        $('#stockAdjustBackBtn').hide();
        $('#stockAdjustAcceptBtn').hide();
    });

    // "Accept Changes" — fire the API
    $('#stockAdjustAcceptBtn').on('click', function () {
        const adjustments = buildAdjustments();

        $.ajax({
            url: '/api/admin/stock', method: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ adjustments }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (res) {
                $('#stockAdjustModal').hide();
                showToast(`${res.results.length} variant(s) updated.`, 'success');
                selectedVarIds.clear();
                updateSelectedCount();
                loadStockTable();
            },
            error: function (xhr) {
                showToast(xhr.responseJSON?.message || 'Stock update failed.', 'error');
            }
        });
    });

    // Close modal
    $('#closeStockAdjustModalBtn, #stockAdjustCancelBtn').on('click', function () {
        $('#stockAdjustModal').hide();
    });

    // Helper: collect non-zero delta entries from the modal form
    function buildAdjustments() {
        const adjustments = [];
        $('.stock-adjust-row').each(function () {
            const delta = parseInt($(this).find('.stock-delta-input').val()) || 0;
            if (delta !== 0) {
                adjustments.push({ variant_id: parseInt($(this).data('id')), delta });
            }
        });
        return adjustments;
    }

    function handleAuthFailure(xhr) {
        if (xhr.status === 401 || xhr.status === 403) {
            showToast('Session expired. Redirecting to login.', 'error');
            setTimeout(() => { localStorage.removeItem('token'); window.location.href = '../login.html'; }, 2000);
        }
    }

    $('#adminLogoutBtn').on('click', function () {
        localStorage.removeItem('token');
        window.location.href = '../shop.html';
    });

    function renderDataTableDate(data, type) {
        if (!data) return '<span style="color:#555;">—</span>';
        
        // If DataTables is sorting or type-checking, feed it the raw numeric timestamp
        if (type === 'sort' || type === 'type') {
            return new Date(data).getTime();
        }
        
        // For visual display to the user, render: M/D/YYYY HH:MM:SS
        const date = new Date(data);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }

    // Add some CSS for toast and field errors inline
    $('<style>.field-error{color:#ff4444;font-size:11px;margin-top:4px;min-height:14px;} .audit-filter-btn.active{background:#fff;color:#000;}</style>').appendTo('head');
});