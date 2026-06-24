$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    let productsTable, categoriesTable;

    // Initialize Active Tables On Boot
    initProductsTable();
    initCategoriesTable();
    preloadCategoryDropdown();

    /* ==========================================================================
       VIEW SHIFTING TOGGLE CONTROLS
       ========================================================================== */
    $('#sidebar-products-btn').on('click', function(e) {
        e.preventDefault();
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        $('.admin-view-panel').hide();
        $('#products-section').show();
        productsTable.ajax.reload(null, false);
    });

    $('#sidebar-categories-btn').on('click', function(e) {
        e.preventDefault();
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        $('.admin-view-panel').hide();
        $('#categories-section').show();
        categoriesTable.ajax.reload(null, false);
    });

    /* ==========================================================================
       PRODUCTS DATATABLE INTERACTION LAYER
       ========================================================================== */
    function initProductsTable() {
        productsTable = $('#productsSecureTable').DataTable({
            ajax: {
                url: '/api/products',
                method: 'GET',
                dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` },
                error: handleAuthFailure
            },
            columns: [
                { data: 'id' },
                { data: 'style_code', render: data => `<strong style="color: #aaaaaa;">${data}</strong>` },
                { data: 'name' },
                { data: 'Category', render: data => data ? data.name : 'Unassigned' },
                { data: 'gender', render: data => `<span style="text-transform: uppercase; font-size:11px;">${data}</span>` },
                { data: 'price', render: data => `₱${parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                {
                    data: 'id',
                    orderable: false,
                    render: data => `
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-dark edit-product-row" data-id="${data}" style="padding: 6px 12px; font-size: 11px;">Edit</button>
                            <button class="btn btn-dark delete-product-row" data-id="${data}" style="padding: 6px 12px; font-size: 11px; color: #ff4444;">Delete</button>
                        </div>`
                }
            ],
            responsive: true
        });
    }

    /* ==========================================================================
       CATEGORIES DATATABLE INTERACTION LAYER
       ========================================================================== */
    function initCategoriesTable() {
        categoriesTable = $('#categoriesSecureTable').DataTable({
            ajax: {
                url: '/api/categories',
                method: 'GET',
                dataSrc: '',
                headers: { 'Authorization': `Bearer ${token}` },
                error: handleAuthFailure
            },
            columns: [
                { data: 'id' },
                { data: 'name', render: data => `<strong style="color:#ffffff;">${data}</strong>` },
                { data: 'createdAt', render: data => new Date(data).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                {
                    data: 'id',
                    orderable: false,
                    render: data => `
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-dark edit-category-row" data-id="${data}" style="padding: 6px 12px; font-size: 11px;">Edit</button>
                            <button class="btn btn-dark delete-category-row" data-id="${data}" style="padding: 6px 12px; font-size: 11px; color: #ff4444;">Delete</button>
                        </div>`
                }
            ],
            responsive: true
        });
    }

    /* ==========================================================================
       CRUD OPERATIONAL CONTROLS & AJAX ACTIONS
       ========================================================================== */
    
    // Trigger Clean Product Modal Definition
    $('#openCreateProductBtn').on('click', function() {
        resetFormStates();
        $('#modalTargetTitle').text('Register Product Variant');
        $('#productCrudForm').show();
        $('#crudModal').css('display', 'flex');
    });

    // Trigger Clean Category Modal Definition
    $('#openCreateCategoryBtn').on('click', function() {
        resetFormStates();
        $('#modalTargetTitle').text('Define Category Segment');
        $('#categoryCrudForm').show();
        $('#crudModal').css('display', 'flex');
    });

    // Dismiss Modal Configuration Action
    $('#closeModalBtn').on('click', function() {
        $('#crudModal').hide();
        resetFormStates();
    });

    // Populate drop down arrays asynchronously
    function preloadCategoryDropdown() {
        $.ajax({
            url: '/api/categories',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(categories) {
                const select = $('#prod_category_id');
                select.empty();
                categories.forEach(c => select.append(`<option value="${c.id}">${c.name}</option>`));
            }
        });
    }

    // PRODUCT SAVE ACTION (CREATE / UPDATE EVALUATOR)
    $('#productCrudForm').on('submit', function(e) {
        e.preventDefault();
        const id = $('#product_id_field').val();
        
        const payload = {
            name: $('#prod_name').val().trim(),
            style_code: $('#prod_style_code').val().trim(),
            category_id: parseInt($('#prod_category_id').val()),
            gender: $('#prod_gender').val(),
            price: parseFloat($('#prod_price').val()),
            description: $('#prod_description').val().trim()
        };

        const url = id ? `/api/products/${id}` : '/api/products';
        const method = id ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() {
                $('#crudModal').hide();
                productsTable.ajax.reload(null, false);
                resetFormStates();
            },
            error: function(xhr) { alert(`Product persistence error: ${xhr.responseJSON?.message || xhr.statusText}`); }
        });
    });

    // EDIT ACTION: FETCH AND BIND PRODUCT INSTANCE
    $(document).on('click', '.edit-product-row', function() {
        const id = $(this).data('id');
        resetFormStates();

        $.ajax({
            url: `/api/products/${id}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(product) {
                $('#product_id_field').val(product.id);
                $('#prod_name').val(product.name);
                $('#prod_style_code').val(product.style_code);
                $('#prod_category_id').val(product.category_id);
                $('#prod_gender').val(product.gender);
                $('#prod_price').val(product.price);
                $('#prod_description').val(product.description);

                $('#modalTargetTitle').text(`Edit Product Matrix: #${product.style_code}`);
                $('#productCrudForm').show();
                $('#crudModal').css('display', 'flex');
            }
        });
    });

    // DELETE ACTION: REMOVE SELECTED PRODUCT SPECIFICATION
    $(document).on('click', '.delete-product-row', function() {
        const id = $(this).data('id');
        if (confirm('Are you certain you wish to purge this item from your records?')) {
            $.ajax({
                url: `/api/products/${id}`,
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function() { productsTable.ajax.reload(null, false); }
            });
        }
    });

    // CATEGORY SAVE ACTION (CREATE / UPDATE EVALUATOR)
    $('#categoryCrudForm').on('submit', function(e) {
        e.preventDefault();
        const id = $('#category_id_field').val();
        
        const payload = { name: $('#cat_name').val().trim() };
        const url = id ? `/api/categories/${id}` : '/api/categories';
        const method = id ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function() {
                $('#crudModal').hide();
                categoriesTable.ajax.reload(null, false);
                preloadCategoryDropdown(); // Keep selection drop downs synchronized
                resetFormStates();
            },
            error: function(xhr) { alert(`Category persistence error: ${xhr.responseJSON?.message || xhr.statusText}`); }
        });
    });

    // EDIT ACTION: FETCH AND BIND CATEGORY TYPE
    $(document).on('click', '.edit-category-row', function() {
        const id = $(this).data('id');
        resetFormStates();

        $.ajax({
            url: `/api/categories/${id}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(category) {
                $('#category_id_field').val(category.id);
                $('#cat_name').val(category.name);

                $('#modalTargetTitle').text(`Modify Category Label: ${category.name}`);
                $('#categoryCrudForm').show();
                $('#crudModal').css('display', 'flex');
            }
        });
    });

    // DELETE ACTION: REMOVE CHOSEN CATEGORY DEFINITION
    $(document).on('click', '.delete-category-row', function() {
        const id = $(this).data('id');
        if (confirm('Purging this taxonomy segment will disassociate linked items. Proceed?')) {
            $.ajax({
                url: `/api/categories/${id}`,
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function() { 
                    categoriesTable.ajax.reload(null, false);
                    preloadCategoryDropdown();
                }
            });
        }
    });

    /* ==========================================================================
       UTILITIES & AUTH FLUSH HOOKS
       ========================================================================== */
    function resetFormStates() {
        $('.modal-form-wrapper').hide();
        $('#productCrudForm')[0].reset();
        $('#categoryCrudForm')[0].reset();
        $('#product_id_field').val('');
        $('#category_id_field').val('');
    }

    function handleAuthFailure(xhr) {
        if (xhr.status === 401 || xhr.status === 403) {
            alert("Session signature expired or permissions invalid.");
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        }
    }

    $('#adminLogoutBtn').on('click', function() {
        localStorage.removeItem('token');
        window.location.href = '../shop.html';
    });
});