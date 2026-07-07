$(document).ready(function () {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '../login.html'; return; }

    let productsTable, categoriesTable, ordersTable, usersTable, auditTable, announcementsTable, discountsTable;    
    let allProductsData = [];
    let barChart, lineChart, pieChart;
    let showingDeletedProducts = false;
    let currentProductImages = []; // existing ProductImage rows for the product being edited
    let imagesMarkedForRemoval = [];
    let pendingImageFiles = []; // newly-selected-but-not-yet-saved File objects, accumulated across multiple picks

    // Boot
    loadDashboard();
    initProductsTable();
    initCategoriesTable();
    initOrdersTable();
    initUsersTable();
    initAuditTable();
    initAnnouncementsTable();
    initDiscountsTable();
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

/* =================================================================
       CONSOLIDATED PRODUCT MANAGEMENT SUB-TAB ROUTING ENGINE
    ================================================================= */
    window.switchProductSubTab = function(targetTab) {
        $('.nav-item').removeClass('active');
        $('#sidebar-products-btn').addClass('active');
        $('.admin-view-panel').hide();
        $('.sub-tab-btn').css({ 'background': '#111', 'color': '#888', 'border-color': '#222' });

        if (targetTab === 'products') {
            $('#products-section').show();
            $('.sub-tab-prod').css({ 'background': '#fff', 'color': '#000', 'border-color': '#fff' });
            if (typeof productsTable !== 'undefined') productsTable.ajax.reload(null, false);
        } 
        else if (targetTab === 'categories') {
            $('#categories-section').show();
            $('.sub-tab-cat').css({ 'background': '#fff', 'color': '#000', 'border-color': '#fff' });
            if (typeof categoriesTable !== 'undefined') categoriesTable.ajax.reload(null, false);
        } 
        else if (targetTab === 'stock') {
            $('#stock-section').show();
            $('.sub-tab-stock').css({ 'background': '#fff', 'color': '#000', 'border-color': '#fff' });
            loadStockTable(); // FIX: Now successfully tells the server to fetch the data
        }
    };

    $('#sidebar-products-btn').off('click').on('click', function (e) {
        e.preventDefault(); switchProductSubTab('products');
    });

    $('#sidebar-categories-btn').off('click').on('click', function(e) { e.preventDefault(); switchProductSubTab('categories'); });
    $('#sidebar-stock-btn').off('click').on('click', function(e) { e.preventDefault(); switchProductSubTab('stock'); });
    $('#sidebar-orders-btn').on('click', function (e) { e.preventDefault(); showPanel('#orders-section', '#sidebar-orders-btn'); ordersTable.ajax.reload(null, false); });
    $('#sidebar-users-btn').on('click', function (e) { e.preventDefault(); showPanel('#users-section', '#sidebar-users-btn'); usersTable.ajax.reload(null, false); });
    $('#sidebar-audit-btn').on('click', function (e) { e.preventDefault(); showPanel('#audit-section', '#sidebar-audit-btn'); auditTable.ajax.reload(null, false); });
    $('#sidebar-announcements-btn').on('click', function (e) { e.preventDefault(); showPanel('#announcements-section', '#sidebar-announcements-btn'); announcementsTable.ajax.reload(null, false); });
    $('#sidebar-variants-btn').on('click', function (e) { e.preventDefault(); showPanel('#variants-section', '#sidebar-variants-btn'); });
    $('#sidebar-dashboard-btn').on('click', function (e) { e.preventDefault(); showPanel('#dashboard-section', '#sidebar-dashboard-btn'); loadDashboard(); });
    $('#sidebar-products-btn').off('click').on('click', function (e) { e.preventDefault(); switchProductSubTab('products'); });
    $('#sidebar-discounts-btn').on('click', function (e) { e.preventDefault(); showPanel('#discounts-section', '#sidebar-discounts-btn'); if (discountsTable) { discountsTable.ajax.reload(null, false); }});
    
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

        // Clear previous chart instances if they exist to free the canvas elements
        if (barChart) barChart.destroy();
        if (lineChart) lineChart.destroy();
        if (pieChart) pieChart.destroy();

        // FIXED: Removed "Canvas" suffix to match the actual IDs in your HTML
        const barCtx = document.getElementById('barChart')?.getContext('2d');
        const lineCtx = document.getElementById('lineChart')?.getContext('2d');
        const pieCtx = document.getElementById('pieChart')?.getContext('2d');

        // Safe initialization guard
        if (barCtx && lineCtx && pieCtx) {
            barChart = new Chart(barCtx, { /* chart config */ });
            lineChart = new Chart(lineCtx, { /* chart config */ });
            pieChart = new Chart(pieCtx, { /* chart config */ });
        }

        // Call loadCharts to fetch the data metrics asynchronously
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
                    options: { 
                        plugins: { legend: { labels: { color: '#ccc' } } }, 
                        scales: { 
                            x: { 
                                ticks: { color: '#aaa' }, 
                                grid: { color: '#2d2d2d' } // Adds a dark gray grid line for X axis
                            }, 
                            y: { 
                                ticks: { color: '#aaa' }, 
                                grid: { color: '#2d2d2d' } // Adds a dark gray grid line for Y axis
                            } 
                        } 
                    }
                });

                if (lineChart) lineChart.destroy();
                lineChart = new Chart(document.getElementById('lineChart'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{ label: 'Orders', data: orders, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', tension: 0.3, fill: true }]
                    },
                    options: { 
                        plugins: { legend: { labels: { color: '#ccc' } } }, 
                        scales: { 
                            x: { 
                                ticks: { color: '#aaa' }, 
                                grid: { color: '#2d2d2d' } // Adds a dark gray grid line for X axis
                            }, 
                            y: { 
                                ticks: { color: '#aaa' }, 
                                grid: { color: '#2d2d2d' } // Adds a dark gray grid line for Y axis
                            } 
                        } 
                    }
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
                // Add this as the first column definition in initProductsTable()
                {
                    data: 'id', orderable: false,
                    render: d => `<input type="checkbox" class="product-row-cb" value="${d}">`
                },
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
                    data: 'is_hidden', orderable: false,
                    render: d => d
                        ? `<span style="color:#ff9800; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Hidden</span>`
                        : `<span style="color:#4caf50; font-size:11px;">Visible</span>`
                },
                {
                    data: null, orderable: false,
                    render: (d, t, row) => showingDeletedProducts
                        ? `<button class="btn btn-dark restore-product-row" data-id="${row.id}" style="padding:6px 12px; font-size:11px; color:#4caf50;">Restore</button>`
                        : `<div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button class="btn btn-dark edit-product-row" data-id="${row.id}" style="padding:6px 12px; font-size:11px;">Edit</button>
                            <button class="btn btn-dark toggle-product-visibility" data-id="${row.id}" data-hidden="${row.is_hidden}" style="padding:6px 12px; font-size:11px; color:${row.is_hidden ? '#4caf50' : '#ff9800'};">${row.is_hidden ? 'Show' : 'Hide'}</button>
                            <button class="btn btn-dark delete-product-row" data-id="${row.id}" style="padding:6px 12px; font-size:11px; color:#ff4444;">Delete</button>
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

    // Select All functionality
    $('#product-select-all').on('change', function() {
        $('.product-row-cb').prop('checked', $(this).is(':checked'));
    });

    $('#apply-bulk-sale').on('click', function() {
        const ids = $('.product-row-cb:checked').map(function() { return $(this).val(); }).get();
        if (ids.length === 0) {
            showToast('Select at least one product.', 'error');
            return;
        }

        const sale_type = $('#bulk_sale_type').val();
        const sale_value = $('#bulk_sale_value').val();

        showConfirm(`Apply this bulk sale configuration to ${ids.length} products?`, function() {
            $.ajax({
                url: '/api/products/bulk-sale',
                method: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ ids, sale_type, sale_value }),
                headers: { 'Authorization': `Bearer ${token}` },
                success: function(res) {
                    showToast(res.message, 'success');
                    productsTable.ajax.reload(null, false);
                    $('.product-row-cb, #product-select-all').prop('checked', false);
                },
                error: function(xhr) { showToast(xhr.responseJSON?.message || 'Bulk sale failed.', 'error'); }
            });
        });
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

    // Image preview — accumulate newly picked files rather than letting a fresh
    // selection replace the previous one (native <input type=file> would otherwise
    // hand us a brand new FileList each time, silently dropping earlier picks).
    $(document).on('change', '#prod_images', function () {
        Array.from(this.files).forEach(file => pendingImageFiles.push(file));
        this.value = ''; // clear so the next pick fires 'change' again and never duplicates what we already stored
        renderPendingImagePreview();
    });

    function renderPendingImagePreview() {
        const preview = $('#prod_image_preview').empty();
        pendingImageFiles.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = e => {
                preview.append(`
                    <div class="pending-image-thumb" data-index="${i}" style="position:relative;">
                        <img src="${e.target.result}" style="width:64px; height:64px; object-fit:cover; border:1px solid #333;">
                        <span class="remove-pending-image" data-index="${i}" style="position:absolute; top:-6px; right:-6px; background:#ff4444; color:#fff; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; cursor:pointer; font-weight:700;">✕</span>
                    </div>`);
            };
            reader.readAsDataURL(file);
        });
    }

    $(document).on('click', '.remove-pending-image', function () {
        const idx = parseInt($(this).data('index'));
        pendingImageFiles.splice(idx, 1);
        renderPendingImagePreview();
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
                        <td style="padding:10px 4px; text-align:center;">${item.size_type || ''} ${item.size_value || ''}</td>
                        <td style="padding:10px 4px; text-align:center;">${item.colorway || '—'}</td>
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

    // Close Order Items Modal Event Handler
    $('#closeOrderItemsModalBtn, #orderItemsModal').on('click', function(e) {
        if (e.target === this) {
            $('#orderItemsModal').fadeOut(200);
        }
    });

    // Example implementation inside your orders DataTables column rendering / click function
    function viewOrderItems(orderId, itemsArray) {
        $('#orderItemsModal').fadeIn(200);
        
        let htmlContent = `
            <table style="width:100%; border-collapse: collapse; font-size:12px; color:#fff; text-align:left;">
                <thead>
                    <tr style="border-bottom: 1px solid #222; color:#888; text-transform:uppercase; letter-spacing:1px;">
                        <th style="padding:12px 8px;">Product Description</th>
                        <th style="padding:12px 8px;">Size / Var</th>
                        <th style="padding:12px 8px; text-align:right;">Quantity</th>
                        <th style="padding:12px 8px; text-align:right;">Unit Price</th>
                    </tr>
                </thead>
                <tbody>
        `;

        itemsArray.forEach(item => {
            htmlContent += `
                <tr style="border-bottom: 1px solid #111;">
                    <td style="padding:12px 8px; font-weight:700;">${item.name} <br><span style="color:#666; font-size:11px;">${item.style_code}</span></td>
                    <td style="padding:12px 8px; color:#aaa;">US ${item.size} (${item.colorway})</td>
                    <td style="padding:12px 8px; text-align:right;">${item.quantity}</td>
                    <td style="padding:12px 8px; text-align:right; color:#4caf50;">₱${parseFloat(item.price).toLocaleString()}</td>
                </tr>
            `;
        });

        htmlContent += `</tbody></table>`;
        $('#orderItemsModalBody').html(htmlContent);
    }

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
        $('#productDetailsTab').closest('form').show();
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

    $('#openCreateUserBtn').on('click', function () {
        resetFormStates();
        $('#modalTargetTitle').text('Create User');
        $('#userCrudForm').show();
        $('#crudModal').css('display', 'flex');
    });

    $('#openCreateDiscountBtn').on('click', function () {
        resetFormStates();
        $('#modalTargetTitle').text('Generate Discount Codes');
        $('#addDiscountCodeForm').show();
        
        // Ensure default state is set to Single Code
        $('#bulk_generate_toggle').prop('checked', false);
        $('#single_code_group').show();
        $('#bulk_code_group').hide();
        
        $('#crudModal').css('display', 'flex');
        });
        $(document).on('change', '#bulk_generate_toggle', function() {
        if ($(this).is(':checked')) {
            $('#single_code_group').hide();
            $('#bulk_code_group').show();
            $('#code').val(''); // Clear single code input
        } else {
            $('#single_code_group').show();
            $('#bulk_code_group').hide();
            $('#generate_count, #prefix').val(''); // Clear bulk inputs
        }
    });

    $('#closeModalBtn').on('click', function () { $('#crudModal').hide(); resetFormStates(); });

    /* =================================================================
       CATEGORY DROPDOWN (with inline create)
    ================================================================= */
    function preloadCategoryDropdown() {
    $.ajax({
        url: '/api/categories', 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        success: function (categories) {
            const select = $('#prod_category_id');
            const currentVal = select.val();
            select.empty();
            select.append(`<option value="">Select a category</option>`);
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
        formData.append('sale_type', $('#prod_sale_type').val());
        formData.append('sale_value', $('#prod_sale_value').val());
        formData.append('description', $('#prod_description').val().trim());
        formData.append('image_urls', $('#prod_image_urls').val().trim());
        formData.append('remove_image_ids', JSON.stringify(imagesMarkedForRemoval));
        formData.append('is_hidden', $('#prod_is_hidden').is(':checked') ? 'true' : 'false');

        pendingImageFiles.forEach(file => formData.append('images', file));

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
                    pendingImageFiles = [];
                    renderExistingImages();
                    renderPendingImagePreview();
                    $('#prod_image_urls').val('');
                } else {
                    $('#crudModal').hide();
                    resetFormStates();
                }
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Save failed.', 'error'); }
        });
    });

    // Images tab has its own Save button, independent of the Details tab's "Save Product".
    // Only usable once the product exists (id present) since images attach to a product row.
    $(document).on('click', '#saveImagesBtn', function () {
        const id = $('#product_id_field').val();
        if (!id) { showToast('Save the product details first, then add images.', 'error'); return; }

        const formData = new FormData();
        formData.append('image_urls', $('#prod_image_urls').val().trim());
        formData.append('remove_image_ids', JSON.stringify(imagesMarkedForRemoval));
        pendingImageFiles.forEach(file => formData.append('images', file));

        $.ajax({
            url: `/api/products/${id}`,
            method: 'PUT',
            data: formData,
            contentType: false,
            processData: false,
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (response) {
                showToast('Images saved.', 'success');
                productsTable.ajax.reload(null, false);
                const savedProduct = response.product;
                currentProductImages = savedProduct.ProductImages || [];
                imagesMarkedForRemoval = [];
                pendingImageFiles = []; // clear the cached/pending previews now that they're persisted
                renderExistingImages();
                renderPendingImagePreview();
                $('#prod_image_urls').val('');
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Could not save images.', 'error'); }
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
                
                // Updated to support new sale configuration fields
                $('#prod_sale_type').val(p.sale_type || 'none');
                $('#prod_sale_value').val(p.sale_value != null ? p.sale_value : '');
                if (p.sale_type === 'none' || !p.sale_type) {
                    $('#prod_sale_value').prop('disabled', true);
                } else {
                    $('#prod_sale_value').prop('disabled', false);
                }
                calculateLiveSalePreview();
                
                $('#prod_description').val(p.description);
                $('#prod_is_hidden').prop('checked', !!p.is_hidden);
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

    $(document).on('click', '.toggle-product-visibility', function () {
        const id = $(this).data('id');
        const isHidden = $(this).data('hidden');
        const action = isHidden ? 'show on' : 'hide from';
        showConfirm(`${isHidden ? 'Show' : 'Hide'} this product? It will ${isHidden ? 'reappear on' : 'be hidden from'} the storefront.`, function () {
            $.ajax({
                url: `/api/products/${id}/visibility`, method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function (res) {
                    showToast(res.message, 'success');
                    productsTable.ajax.reload(null, false);
                },
                error: function (xhr) { showToast(xhr.responseJSON?.message || 'Failed.', 'error'); }
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
       PRODUCT VARIANTS TAB (DECOUPLED FROM STOCK)
    ================================================================= */
    // Boot Initialization: Fetch lookup tables immediately
    $.get('/api/colorways', data => {
        const sel = $('#new_variant_colorway_id').empty();
        data.forEach(c => sel.append(`<option value="${c.id}">${c.name}</option>`));
    });
    $.get('/api/shoe-sizes', data => {
        const sel = $('#new_variant_size_id').empty();
        data.forEach(s => sel.append(`<option value="${s.id}">${s.label} (US ${s.us_size})</option>`));
    });

    $(document).on('click', '.product-tab-btn', function () {
        showProductTab($(this).data('tab'));
    });

    function showProductTab(tab) {
        $('.product-tab-btn').removeClass('active');
        $(`.product-tab-btn[data-tab="${tab}"]`).addClass('active');
        $('#productDetailsTab').closest('form').toggle(tab === 'details');
        $('#productImagesTab').toggle(tab === 'images');
        if (tab === 'images') renderExistingImages();
        $('#productVariantsTab').toggle(tab === 'variants');
    }

    function loadVariantsForProduct(productId) {
        $.ajax({
            url: `/api/products/${productId}/variants`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (variants) { renderVariantsList(productId, variants); }
        });
    }

    let currentVariantsCache = []; // last variants payload, used to prefill the Edit form

    function renderVariantsList(productId, variants) {
        const wrap = $('#variantsListWrapper').empty();
        currentVariantsCache = variants || [];

        // Which product images are already claimed by a variant (for the "already used" warning)
        const usedImageMap = new Map(); // image_id -> colorway name
        currentVariantsCache.forEach(v => {
            if (v.image_id) usedImageMap.set(v.image_id, v.Colorway ? v.Colorway.name : 'another variant');
        });

        // Refresh the image assignment dropdown based on current product images
        const editingId = $('#editing_variant_id').val();
        const editingImageId = editingId ? (currentVariantsCache.find(v => String(v.id) === String(editingId))?.image_id ?? null) : null;
        const imgSel = $('#new_variant_image_id').empty().append('<option value="">No Picture</option>');
        currentProductImages.forEach((img, i) => {
            const usedBy = usedImageMap.get(img.id);
            // Don't warn against the picture the variant being edited already owns
            const isUsedByOther = usedBy && String(img.id) !== String(editingImageId);
            const label = isUsedByOther ? `Product Image ${i + 1} — ⚠ already used (${usedBy})` : `Product Image ${i + 1}`;
            imgSel.append(`<option value="${img.id}">${label}</option>`);
        });

        if (!variants || variants.length === 0) {
            wrap.append('<div style="color:#777; font-size:12px;">No variants mapped yet.</div>');
            return;
        }

        const table = $(`<table style="width:100%; border-collapse:collapse; font-size:12px; color:#ccc;">
            <thead><tr style="border-bottom:1px solid #333; text-align:left;">
                <th style="padding:8px 4px;">Picture</th>
                <th style="padding:8px 4px;">Colorway</th>
                <th style="padding:8px 4px;">Size</th>
                <th style="padding:8px 4px; text-align:right;">Actions</th>
            </tr></thead><tbody></tbody></table>`);
            
        const tbody = table.find('tbody');
        variants.forEach(v => {
            const hasImage = v.VariantImage 
                ? `<img src="${v.VariantImage.image_path}" style="width:28px; height:28px; object-fit:cover; border-radius:2px;">` 
                : '<span style="color:#555;">None</span>';
                
            tbody.append(`
                <tr style="border-bottom:1px solid #1a1a1a;" data-variant-id="${v.id}">
                    <td style="padding:8px 4px;">${hasImage}</td>
                    <td style="padding:8px 4px;">${v.Colorway ? v.Colorway.name : '—'}</td>
                    <td style="padding:8px 4px;">${v.ShoeSize ? v.ShoeSize.label : '—'}</td>
                    <td style="padding:8px 4px; text-align:right;">
                        <button type="button" class="btn btn-dark edit-variant-btn" data-id="${v.id}" style="padding:4px 10px; font-size:10px; color:#9cf; margin-right:6px;">Edit</button>
                        <button type="button" class="btn btn-dark delete-variant-btn" data-id="${v.id}" style="padding:4px 10px; font-size:10px; color:#ff4444;">Delete</button>
                    </td>
                </tr>`);
        });
        wrap.append(table);
        wrap.data('productId', productId);
    }

    $(document).on('click', '#addVariantBtn', function () {
        const productId = $('#product_id_field').val();
        if (!productId) { showToast('Save the product details first.', 'error'); return; }

        const colorway_id = $('#new_variant_colorway_id').val();
        const size_id = $('#new_variant_size_id').val();
        const image_id = $('#new_variant_image_id').val() || null;
        const editingId = $('#editing_variant_id').val();

        if (!colorway_id || !size_id) { showToast('Colorway and size are required.', 'error'); return; }

        const isEditing = !!editingId;
        $.ajax({
            url: isEditing ? `/api/variants/${editingId}` : `/api/products/${productId}/variants`,
            method: isEditing ? 'PUT' : 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ colorway_id, size_id, image_id }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                showToast(isEditing ? 'Variant updated.' : 'Variant added.', 'success');
                resetVariantForm();
                loadVariantsForProduct(productId);
            },
            error: function (xhr) { 
                showToast(xhr.responseJSON?.message || (isEditing ? 'Could not update variant.' : 'Could not add variant.'), 'error'); 
            }
        });
    });

    function resetVariantForm() {
        $('#editing_variant_id').val('');
        $('#new_variant_colorway_id').val('');
        $('#new_variant_size_id').val('');
        $('#new_variant_image_id').val('');
        $('#variantFormLabel').text('Add a new variant');
        $('#addVariantBtn').text('+ Add');
        $('#cancelVariantEditBtn').hide();
        updateVariantImageThumb();
    }

    // Keeps the little thumbnail next to the "Assign Picture" dropdown in sync with the current selection.
    function updateVariantImageThumb() {
        const imageId = $('#new_variant_image_id').val();
        const thumb = $('#variantImageThumbPreview');
        const img = imageId ? currentProductImages.find(i => String(i.id) === String(imageId)) : null;
        if (img) {
            thumb.attr('src', img.image_path).show();
        } else {
            thumb.hide().attr('src', '');
        }
    }

    $(document).on('change', '#new_variant_image_id', updateVariantImageThumb);

    $(document).on('click', '.edit-variant-btn', function () {
        const id = $(this).data('id');
        const v = currentVariantsCache.find(x => x.id === id);
        if (!v) return;

        $('#editing_variant_id').val(id);
        $('#new_variant_colorway_id').val(v.colorway_id || (v.Colorway ? v.Colorway.id : ''));
        $('#new_variant_size_id').val(v.size_id || (v.ShoeSize ? v.ShoeSize.id : ''));
        $('#variantFormLabel').text(`Editing variant #${id} — change colorway, size, or picture below`);
        $('#addVariantBtn').text('Save Changes');
        $('#cancelVariantEditBtn').show();

        // Re-render the image dropdown so it excludes this variant's own picture from the "already used" warning,
        // then select its current picture (if any).
        renderVariantsList($('#product_id_field').val(), currentVariantsCache);
        $('#new_variant_image_id').val(v.image_id || '');
        updateVariantImageThumb();

        $('html, body').animate({ scrollTop: $('#variantsListWrapper').offset().top - 100 }, 200);
    });

    $(document).on('click', '#cancelVariantEditBtn', function () {
        resetVariantForm();
    });

    $(document).on('click', '.delete-variant-btn', function () {
        const id = $(this).data('id');
        const productId = $('#product_id_field').val();
        showConfirm('Remove this variant? All stock logic mapped to it will be permanently deleted.', function () {
            $.ajax({
                url: `/api/variants/${id}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function () {
                    showToast('Variant removed.', 'success');
                    if (String($('#editing_variant_id').val()) === String(id)) resetVariantForm();
                    loadVariantsForProduct(productId);
                }
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
       USER CRUD (CREATE)
    ================================================================= */
    $('#userCrudForm').on('submit', function (e) {
        e.preventDefault();
        
        // 1. Clear previous errors
        clearErrors();
        let valid = true;
        
        // 2. Gather values
        const name = $('#user_name').val().trim();
        const email = $('#user_email').val().trim();
        const password = $('#user_password').val();
        const role = $('#user_role').val();

        // 3. Inline Validation
        if (!name) { 
            setError('user_name', 'Name is required.'); 
            valid = false; 
        }
        if (!email) { 
            setError('user_email', 'Email is required.'); 
            valid = false; 
        }
        if (!password || password.length < 6) { 
            setError('user_password', 'Password must be at least 6 characters.'); 
            valid = false; 
        }

        if (!valid) return;

        // 4. Construct Payload
        const payload = { name, email, password, role };

        // 5. Send POST request to backend
        $.ajax({
            url: '/api/admin/users', // Make sure this matches your Express route for createUser
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#crudModal').hide();
                showToast('User created successfully.', 'success');
                usersTable.ajax.reload(null, false);
                resetFormStates();
            },
            error: function (xhr) { 
                showToast(xhr.responseJSON?.message || 'Failed to create user.', 'error'); 
            }
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
        if ($('#addDiscountCodeForm').length) $('#addDiscountCodeForm')[0].reset();
        $('#product_id_field, #category_id_field, #announcement_id_field').val('');
        $('#prod_image_preview, #prod_existing_images, #variantsListWrapper').empty();
        $('#prod_is_hidden').prop('checked', false);
        $('#prod_image_urls').val('');
        resetVariantForm();
        $('#productCrudTabs').hide();
        $('#productVariantsTab').hide();
        $('#productImagesTab').hide();
        currentProductImages = [];
        imagesMarkedForRemoval = [];
        pendingImageFiles = [];
        $('#product_id_field').val(''); // Clear the ID so it doesn't think we are editing
        $('#variants-container').empty(); // Clear dynamic variant content
        $('#prod_image_preview').empty(); // Clear image previews
        clearErrors();
    }

/* =================================================================
       STOCK MANAGER (REWRITTEN FOR NATIVE DATATABLES INTEGRATION)
    ================================================================= */
    let stockTable;
    let stockData = [];
    let selectedVarIds = new Set();

    function loadStockTable() {
        if (!stockTable) {
            stockTable = $('#stockTable').DataTable({
                ajax: {
                    url: '/api/admin/stock', method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    dataSrc: function (json) { stockData = json; return json; }
                },
                columns: [
                    {
                        data: 'id', orderable: false,
                        render: function(d) {
                            const isChecked = selectedVarIds.has(d);
                            return `<input type="checkbox" class="stock-row-cb" data-id="${d}" ${isChecked ? 'checked' : ''}>`;
                        }
                    },
                    { data: 'Product', render: d => d ? d.name : '—' },
                    { data: 'Product', render: d => `<span style="color:#aaa; font-size:11px;">${d ? d.style_code : '—'}</span>` },
                    { data: 'Colorway', render: d => d ? d.name : '—' },
                    { data: 'ShoeSize', render: d => d ? d.label : '—' },
                    {
                        data: 'stock_level',
                        render: function(d) {
                            const col = d === 0 ? '#ff4444' : d <= 5 ? '#ff9800' : '#4caf50';
                            return `<span style="color:${col}; font-weight:700;">${d}</span>`;
                        }
                    }
                ],
                dom: 'lrtip', // Hides default search box to use our custom ones seamlessly
                responsive: true
            });
        } else {
            stockTable.ajax.reload(null, false);
        }
        selectedVarIds.clear();
        updateSelectedCount();
    }

    // Fix: Custom search routing through DataTables API so sorting and pagination remain intact
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex, rowData, counter) {
        if (settings.nTable.id !== 'stockTable') return true;

        const prod = $('#stock-filter-product').val().toLowerCase();
        const cw = $('#stock-filter-colorway').val().toLowerCase();
        const level = $('#stock-filter-level').val();

        const name = (rowData.Product?.name || '').toLowerCase();
        const style = (rowData.Product?.style_code || '').toLowerCase();
        const color = (rowData.Colorway?.name || '').toLowerCase();
        const stock = rowData.stock_level;

        const prodMatch = !prod || name.includes(prod) || style.includes(prod);
        const cwMatch = !cw || color.includes(cw);
        const levelMatch = level === '' ? true : level === 'out' ? stock === 0 : level === 'low' ? (stock > 0 && stock <= 5) : stock > 5;

        return prodMatch && cwMatch && levelMatch;
    });

    $('#stock-filter-product, #stock-filter-colorway').on('keyup input', function() { stockTable.draw(); });
    $('#stock-filter-level').on('change', function() { stockTable.draw(); });

    $(document).on('change', '.stock-row-cb', function () {
        const id = parseInt($(this).data('id'));
        if ($(this).is(':checked')) selectedVarIds.add(id);
        else selectedVarIds.delete(id);
        updateSelectedCount();
    });

    $('#stock-header-checkbox').on('change', function () {
        const check = $(this).is(':checked');
        $('.stock-row-cb').prop('checked', check);
        stockTable.rows({ search: 'applied' }).every(function () {
            const id = this.data().id;
            check ? selectedVarIds.add(id) : selectedVarIds.delete(id);
        });
        updateSelectedCount();
    });

    $('#stock-select-all').on('click', function () {
        stockTable.rows({ search: 'applied' }).every(function () { selectedVarIds.add(this.data().id); });
        $('.stock-row-cb').prop('checked', true);
        updateSelectedCount();
    });

    $('#stock-deselect-all').on('click', function () {
        selectedVarIds.clear();
        $('.stock-row-cb').prop('checked', false);
        $('#stock-header-checkbox').prop('checked', false);
        updateSelectedCount();
    });

    // Fix: Show selected pills above datatable
    function updateSelectedCount() {
        const n = selectedVarIds.size;
        $('#stock-selected-count').text(n > 0 ? `${n} variants selected` : '');
        
        const pillsWrap = $('#stock-selected-pills').empty();
        if (n > 0) {
            stockData.filter(v => selectedVarIds.has(v.id)).forEach(v => {
                pillsWrap.append(`<span style="background:#222; border: 1px solid #444; padding:4px 8px; border-radius:4px; font-size:11px; margin-right:6px; margin-bottom:6px; display:inline-block; color:#fff;">${v.Product?.name} (${v.Colorway?.name}, Sz ${v.ShoeSize?.label})</span>`);
            });
        }
    }

    $('#openStockAdjustBtn').on('click', function () {
        if (selectedVarIds.size === 0) {
            showToast('Please select at least one item using the checkboxes.', 'error');
            return;
        }

        const selected = stockData.filter(v => selectedVarIds.has(v.id));
        const list = $('#stockAdjustList').empty();

        selected.forEach(v => {
            const colorway = v.Colorway?.name || '—';
            const size = v.ShoeSize?.label || '—';
            const product = v.Product?.name || '—';
            const style = v.Product?.style_code || '';

            list.append(`
                <div class="stock-adjust-row" data-id="${v.id}" data-current="${v.stock_level}"
                     style="display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center; padding:14px 0; border-bottom:1px solid #1a1a1a;">
                    <div>
                        <div style="font-weight:700; font-size:13px;">${product}</div>
                        <div style="color:#aaa; font-size:11px; margin-top:2px;">${style} · ${colorway} · Size ${size}</div>
                        <div style="margin-top:4px; font-size:12px;">Current stock: <span class="stock-current-badge" style="color:#fff; font-weight:700;">${v.stock_level}</span></div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="stock-decrement btn btn-dark" style="width:32px; height:32px; padding:0; font-size:16px; line-height:1;">−</button>
                        <input type="number" class="stock-delta-input" value="0" style="width:72px; text-align:center; padding:8px; background:#0a0a0a; border:1px solid #333; color:#fff; font-size:14px; font-weight:700;">
                        <button class="stock-increment btn btn-dark" style="width:32px; height:32px; padding:0; font-size:16px; line-height:1;">+</button>
                        <div style="min-width:60px; text-align:center; font-size:13px; color:#aaa;">→ <span class="stock-preview-val" style="font-weight:700; color:#fff;">${v.stock_level}</span></div>
                    </div>
                </div>`);
        });

        $('#stockAdjustStep1').show();
        $('#stockAdjustStep2').hide();
        $('#stockAdjustNextBtn').show();
        $('#stockAdjustBackBtn').hide();
        $('#stockAdjustAcceptBtn').hide();
        $('#stockAdjustModal').css('display', 'flex');
    });

    $(document).on('click', '.stock-increment', function () {
        const inp = $(this).siblings('.stock-delta-input');
        inp.val(parseInt(inp.val() || 0) + 1).trigger('input');
    });
    
    $(document).on('click', '.stock-decrement', function () {
        const inp = $(this).siblings('.stock-delta-input');
        inp.val(parseInt(inp.val() || 0) - 1).trigger('input');
    });

    $(document).on('input', '.stock-delta-input', function () {
        const row = $(this).closest('.stock-adjust-row');
        const current = parseInt(row.data('current'));
        const delta = parseInt($(this).val()) || 0;
        const after = Math.max(0, current + delta);
        row.find('.stock-preview-val').text(after).css('color', after === 0 ? '#ff4444' : after <= 5 ? '#ff9800' : '#4caf50');
    });

    $('#stockAdjustNextBtn').on('click', function () {
        const adjustments = buildAdjustments();
        if (!adjustments.length) {
            showToast('No changes entered — adjust at least one delta value.', 'error');
            return;
        }

        const confirmList = $('#stockConfirmList').empty();
        adjustments.forEach(a => {
            const v = stockData.find(x => x.id === a.variant_id);
            const current = v.stock_level; // FIX: Prevents NaN by looking at local API cache instead of DOM strings
            const after = Math.max(0, current + a.delta);
            const arrow = a.delta > 0 ? `<span style="color:#4caf50">+${a.delta}</span>` : `<span style="color:#ff4444">${a.delta}</span>`;

            confirmList.append(`
                <div style="padding:12px 0; border-bottom:1px solid #1a1a1a; font-size:13px;">
                    <span style="font-weight:700;">${v?.Product?.name || `Variant #${a.variant_id}`}</span>
                    <span style="color:#666; font-size:11px; margin-left:6px;">${v?.Product?.style_code || ''}</span><br>
                    <span style="color:#aaa;">${v?.Colorway?.name || ''} · Size ${v?.ShoeSize?.label || ''}</span><br>
                    <span style="margin-top:4px; display:inline-block;">Stock: <strong>${current}</strong> ${arrow} → <strong>${after}</strong></span>
                </div>`);
        });

        $('#stockAdjustStep1').hide();
        $('#stockAdjustStep2').show();
        $('#stockAdjustNextBtn').hide();
        $('#stockAdjustBackBtn').show();
        $('#stockAdjustAcceptBtn').show();
    });

    $('#stockAdjustBackBtn').on('click', function () {
        $('#stockAdjustStep2').hide();
        $('#stockAdjustStep1').show();
        $('#stockAdjustNextBtn').show();
        $('#stockAdjustBackBtn').hide();
        $('#stockAdjustAcceptBtn').hide();
    });

    $('#stockAdjustAcceptBtn').on('click', function () {
        const adjustments = buildAdjustments();
        $.ajax({
            url: '/api/admin/stock', method: 'PATCH',
            contentType: 'application/json', data: JSON.stringify({ adjustments }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (res) {
                $('#stockAdjustModal').hide();
                showToast(`${res.results.length} variant(s) updated.`, 'success');
                loadStockTable(); // FIX: Will perfectly reload the table data from the server automatically
            },
            error: function (xhr) { showToast(xhr.responseJSON?.message || 'Stock update failed.', 'error'); }
        });
    });

    $('#closeStockAdjustModalBtn, #stockAdjustCancelBtn').on('click', function () { $('#stockAdjustModal').hide(); });

    function buildAdjustments() {
        const adjustments = [];
        $('.stock-adjust-row').each(function () {
            const delta = parseInt($(this).find('.stock-delta-input').val()) || 0;
            if (delta !== 0) adjustments.push({ variant_id: parseInt($(this).data('id')), delta });
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

    // Toggle input state based on type
    $('#prod_sale_type, #bulk_sale_type').on('change', function() {
        const isBulk = this.id === 'bulk_sale_type';
        const type = $(this).val();
        const $valInput = isBulk ? $('#bulk_sale_value') : $('#prod_sale_value');
        
        if (type === 'none') {
            $valInput.val('').prop('disabled', true);
        } else {
            $valInput.prop('disabled', false);
        }
        if (!isBulk) calculateLiveSalePreview();
    });

    $('#prod_sale_value, #prod_price').on('input', calculateLiveSalePreview);
    function initDiscountsTable() {
        discountsTable = $('#discountsSecureTable').DataTable({
            ajax: {
                url: '/api/admin/discounts',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                dataSrc: ''
            },
            columns: [
                { 
                    data: 'code',
                    render: data => `<strong style="letter-spacing:1px; color:#fff;">${data}</strong>`
                },
                { 
                    data: 'percent_off',
                    render: data => `${parseFloat(data)}%`
                },
                {
                    data: null,
                    render: row => {
                        const max = row.max_uses;
                        return max === null ? `${row.times_used} / ∞` : `${row.times_used} / ${max}`;
                    }
                },
                { 
                    data: 'expires_at',
                    render: (data, type) => data ? renderDataTableDate(data, type) : '<span style="color:#555;">Never</span>'
                },
                { 
                    data: 'active',
                    render: data => data 
                        ? '<span class="badge badge-success" style="background:#1c7a3c; padding:4px 8px; border-radius:4px; font-size:11px;">Active</span>' 
                        : '<span class="badge badge-danger" style="background:#900; padding:4px 8px; border-radius:4px; font-size:11px;">Disabled</span>'
                },
                {
                    data: 'id',
                    orderable: false,
                    render: (data, type, row) => `
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-dark toggle-discount-status-btn" data-id="${data}" data-active="${row.active}" style="padding:6px 12px; font-size:11px;">
                                ${row.active ? 'Disable' : 'Enable'}
                            </button>
                            <button class="btn btn-danger delete-discount-btn" data-id="${data}" style="padding:6px 12px; font-size:11px; background:#900; border:none;">
                                Purge
                            </button>
                        </div>
                    `
                }
            ],
            order: [[3, 'desc']],
            responsive: true,
            backgroundColor: '#111'
        });
    }

    // Toggle active status
    $(document).on('click', '.toggle-discount-status-btn', function() {
        const id = $(this).data('id');
        const currentActive = $(this).data('active');
        
        $.ajax({
            url: `/api/admin/discounts/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            headers: { 'Authorization': `Bearer ${token}` },
            data: JSON.stringify({ active: !currentActive }),
            success: function() {
                showToast('Discount code status updated.', 'success');
                discountsTable.ajax.reload(null, false);
            },
            error: function(xhr) {
                showToast(xhr.responseJSON?.message || 'Failed to update status.', 'error');
            }
        });
    });

    // Purge/Delete records
    $(document).on('click', '.delete-discount-btn', function() {
        const id = $(this).data('id');
        showConfirm('Are you sure you want to permanently purge this discount code record?', function() {
            $.ajax({
                url: `/api/admin/discounts/${id}`,
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function() {
                    showToast('Discount code permanently deleted.', 'success');
                    discountsTable.ajax.reload(null, false);
                },
                error: function(xhr) {
                    showToast(xhr.responseJSON?.message || 'Failed to delete discount code.', 'error');
                }
            });
        });
    });

    // Handle single or bulk creation form submission
    $('#addDiscountCodeForm').on('submit', function(e) {
        e.preventDefault();

        const isBulk = $('#bulk_generate_toggle').is(':checked');
        
        // Read directly from the actual input IDs in dashboard.html
        const payload = {
            code: $('#code').val() ? $('#code').val().trim() : '',
            percent_off: parseFloat($('#percent_off').val()),
            max_uses: $('#max_uses').val() ? parseInt($('#max_uses').val(), 10) : null,
            expires_at: $('#expires_at').val() || null,
            active: true
        };

        if (isBulk) {
            payload.generate_count = parseInt($('#generate_count').val(), 10) || 1;
            payload.prefix = $('#prefix').val() ? $('#prefix').val().trim() : '';
        }

        // Validation guard checks
        if (isNaN(payload.percent_off) || payload.percent_off <= 0 || payload.percent_off > 100) {
            showToast('Please specify a valid discount percentage between 1 and 100.', 'error');
            return;
        }

        if (!isBulk && !payload.code) {
            showToast('Please provide a specific discount code name or toggle bulk generation.', 'error');
            return;
        }

        $.ajax({
            url: '/api/admin/discounts',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': `Bearer ${token}` },
            data: JSON.stringify(payload),
            success: function() {
                showToast(isBulk ? 'Bulk discount codes generated.' : 'Discount code added.', 'success');
                $('#addDiscountCodeForm')[0].reset();
                
                // Sync visible bulk view states
                $('#single_code_group').show();
                $('#bulk_code_group').hide();
                
                discountsTable.ajax.reload(null, false);
                $('#crudModal').hide(); // Close the modal if it's open
            },
            error: function(xhr) {
                showToast(xhr.responseJSON?.message || 'Failed to create discount code configuration.', 'error');
            }
        });
    });

    function calculateLiveSalePreview() {
        const price = parseFloat($('#prod_price').val()) || 0;
        const type = $('#prod_sale_type').val();
        const val = parseFloat($('#prod_sale_value').val()) || 0;
        const $preview = $('#prod_sale_preview');

        if (type === 'none' || price === 0) {
            $preview.text(''); return;
        }

        let result = price;
        if (type === 'percent' && val > 0 && val < 100) result = price * (1 - val / 100);
        else if (type === 'amount' && val > 0) result = price - val;
        else if (type === 'fixed' && val > 0 && val < price) result = val;

        $preview.text(`Derived Sale Price: ₱${Math.max(0, result).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    }

    

    // Add some CSS for toast and field errors inline
    $('<style>.field-error{color:#ff4444;font-size:11px;margin-top:4px;min-height:14px;} .audit-filter-btn.active{background:#fff;color:#000;}</style>').appendTo('head');
});