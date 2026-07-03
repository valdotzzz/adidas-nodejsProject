$(document).ready(function() {
    renderHeader();
    renderFooter();
    setupAuthStates();
});

function renderHeader() {
    const headerHtml = `
        <header class="adidas-header">
            <div class="header-container">
                <a href="index.html" class="logo">
                    <svg height="28" viewBox="0 0 24 24" width="28" fill="currentColor">
                        <path d="M24 19.33H17.74L14.12 12.35L20.38 5.37H24L16.48 13.8L20.38 21.32M15.42 19.33H9.16L6.46 14.12L11.83 8.08H15.41L9.16 15.11L11.83 20.32M6.84 19.33H0.58L3.25 14.28H6.84L4.17 19.33Z"/>
                    </svg>
                </a>
                <nav class="main-nav">
                    <a href="shop.html" class="nav-link">All Shoes</a>
                    <a href="shop.html?category=running" class="nav-link">Running</a>
                    <a href="shop.html?category=lifestyle" class="nav-link">Lifestyle</a>
                    <a href="shop.html?category=basketball" class="nav-link">Basketball</a>
                </nav>

                <form class="header-search" id="headerSearchForm">
                    <input type="text" id="headerSearchInput" placeholder="Search">
                    <button type="submit" aria-label="Search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </form>

                <div class="user-actions">
                    <div id="guest-menu" class="auth-group">
                        <a href="login.html" class="btn-link">Sign In</a>
                    </div>
                    <div id="user-menu" class="auth-group" style="display: none;">
                        <a href="profile.html" class="icon-link" title="My Profile">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <circle cx="12" cy="8" r="4"></circle>
                                <path d="M4 21c0-4 4-7 8-7s8 3 8 7"></path>
                            </svg>
                        </a>
                        <div class="mini-notif-wrapper" id="miniNotifWrapper">
                            <a href="#" class="icon-link" title="Notifications" id="notifIconLink">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 01-3.46 0"></path>
                                </svg>
                                <span id="notif-count" class="cart-badge" style="display:none;">0</span>
                            </a>
                            <div class="mini-notif-dropdown" id="miniNotifDropdown">
                                <div class="mini-cart-header">
                                    <span class="mini-cart-title">NOTIFICATIONS</span>
                                    <button type="button" id="markAllReadBtn" class="mini-notif-mark-all">Mark all read</button>
                                </div>
                                <div class="mini-cart-items" id="miniNotifItems">
                                    <div class="mini-cart-loading">Loading...</div>
                                </div>
                            </div>
                        </div>
                        <div class="mini-wishlist-wrapper" id="miniWishlistWrapper">
                            <a href="wishlist.html" class="icon-link" title="Wishlist" id="wishlistIconLink">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4a5.4 5.4 0 016.5 3 5.4 5.4 0 016.5-3C22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z"></path>
                                </svg>
                                <span id="wishlist-count" class="cart-badge" style="display:none;">0</span>
                            </a>
                        </div>
                        <div class="mini-cart-wrapper" id="miniCartWrapper">
                            <a href="cart.html" class="icon-link" title="Cart" id="cartIconLink">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <path d="M16 10a4 4 0 01-8 0"></path>
                                </svg>
                                <span id="cart-count" class="cart-badge" style="display:none;">0</span>
                            </a>
                            <div class="mini-cart-dropdown" id="miniCartDropdown">
                                <div class="mini-cart-header">
                                    <span class="mini-cart-title">YOUR BAG</span>
                                    <span class="mini-cart-count" id="miniCartCount">0 items</span>
                                </div>
                                <div class="mini-cart-items" id="miniCartItems">
                                    <div class="mini-cart-loading">Loading...</div>
                                </div>
                                <div class="mini-cart-footer" id="miniCartFooter" style="display:none;">
                                    <div class="mini-cart-total">
                                        <span>Total</span>
                                        <span id="miniCartTotal">₱0.00</span>
                                    </div>
                                    <a href="cart.html" class="mini-cart-btn">View Bag →</a>
                                    <a href="checkout.html" class="mini-cart-btn mini-cart-btn--checkout">Checkout →</a>
                                </div>
                                <div class="mini-cart-empty" id="miniCartEmpty" style="display:none;">
                                    <p>Your bag is empty.</p>
                                    <a href="shop.html">Start Shopping →</a>
                                </div>
                            </div>
                        </div>
                        <button id="logoutBtn" class="logout-link">Sign Out</button>
                    </div>
                </div>
            </div>
        </header>
    `;
    $('body').prepend(headerHtml);
}

function renderFooter() {
    const footerHtml = `
        <footer class="adidas-footer">
            <div class="footer-container">
                <div class="footer-brand">
                    <svg height="48" viewBox="0 0 24 24" width="48" fill="currentColor">
                        <path d="M24 19.33H17.74L14.12 12.35L20.38 5.37H24L16.48 13.8L20.38 21.32M15.42 19.33H9.16L6.46 14.12L11.83 8.08H15.41L9.16 15.11L11.83 20.32M6.84 19.33H0.58L3.25 14.28H6.84L4.17 19.33Z"/>
                    </svg>
                </div>
                <div class="footer-links">
                    <div class="footer-col">
                        <h4>Products</h4>
                        <a href="shop.html?category=running">Running Shoes</a>
                        <a href="shop.html?category=basketball">Basketball Shoes</a>
                        <a href="shop.html?category=lifestyle">Lifestyle Sneakers</a>
                    </div>
                    <div class="footer-col">
                        <h4>Support</h4>
                        <a href="my-orders.html">Order Tracker</a>
                        <a href="my-orders.html">Returns & Exchanges</a>
                        <a href="mailto:support@adidas-project.com">Help Center</a>
                    </div>
                    <div class="footer-col">
                        <h4>Project Info</h4>
                        <a href="https://github.com/valdotzzzzz/adidas-nodejsProject" target="_blank" rel="noopener">Source Code</a>
                        <a href="index.html">About This Project</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Adidas E-Commerce Project — BSIT Section S-2A.</p>
                <p style="margin-top:6px; font-size:12px; color:#888;">
                    Developed by: CALVO, YBRAHIM ALEXANDER R., VALDEZ, GEAN CLYDE H., — BSIT-S2A ADVANCE WEB APP PROJECT
                </p>
            </div>
        </footer>
    `;
    $('body').append(footerHtml);
}

function setupAuthStates() {
    const token = localStorage.getItem('token');
    if (token) {
        $('#guest-menu').hide();
        $('#user-menu').show();
        loadCartCount(token);
        loadWishlistCount(token);
        loadNotifications(token);

        // Show admin dashboard link if user has admin or staff role
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'admin' || payload.role === 'staff') {
                $('#user-menu').prepend('<a href="admin/dashboard.html" class="btn-link" style="color:#ff4444; font-weight:700;">Admin</a>');
            }
        } catch(e) {}
    }

    $(document).on('click', '#logoutBtn', function() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    $(document).on('submit', '#headerSearchForm', function(e) {
        e.preventDefault();
        const query = $('#headerSearchInput').val().trim();
        if (query) {
            window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
    });

    // Toggle mini cart on click instead of relying only on :hover
    $(document).on('click', '#cartIconLink', function(e) {
        e.preventDefault();
        $('#miniCartDropdown').toggleClass('is-open');
    });

    // Close it when clicking anywhere outside the cart wrapper
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#miniCartWrapper').length) {
            $('#miniCartDropdown').removeClass('is-open');
        }
    });

    // Toggle notification dropdown on click
    $(document).on('click', '#notifIconLink', function(e) {
        e.preventDefault();
        $('#miniNotifDropdown').toggleClass('is-open');
    });

    // Close it when clicking anywhere outside the notification wrapper
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#miniNotifWrapper').length) {
            $('#miniNotifDropdown').removeClass('is-open');
        }
    });

    // Mark a single notification as read when clicked
    $(document).on('click', '.mini-notif-item', function() {
        const id = $(this).data('id');
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        $(this).removeClass('mini-notif-item--unread');

        $.ajax({
            url: `/api/notifications/${id}/read`,
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() { updateNotifBadge(); },
            error: function() {}
        });
    });

    // Mark every notification as read
    $(document).on('click', '#markAllReadBtn', function() {
        const token = localStorage.getItem('token');
        if (!token) return;

        $.ajax({
            url: '/api/notifications/read-all',
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                $('.mini-notif-item').removeClass('mini-notif-item--unread');
                updateNotifBadge();
            },
            error: function() {}
        });
    });
}

function loadCartCount(token) {
    // Cart lives in localStorage now (see cart-store.js). This just resolves
    // it against live product data for the count badge + mini cart preview.
    CartStore.resolve(token)
        .done(function(cartItems) {
            const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQty > 0) {
                $('#cart-count').text(totalQty).show();
            } else {
                $('#cart-count').hide();
            }
            renderMiniCart(cartItems);
        })
        .fail(function() {});
}

function renderMiniCart(cartItems) {
    const $items   = $('#miniCartItems');
    const $footer  = $('#miniCartFooter');
    const $empty   = $('#miniCartEmpty');
    const $count   = $('#miniCartCount');

    $items.empty();

    if (!cartItems || cartItems.length === 0) {
        $empty.show();
        $footer.hide();
        $count.text('0 items');
        return;
    }

    const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    $count.text(`${totalQty} ${totalQty === 1 ? 'item' : 'items'}`);
    $empty.hide();

    let subtotal = 0;

    cartItems.forEach(item => {
        const variant  = item.Variant || {};
        const product  = variant.Product || {};
        const price    = item.unit_price;
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;

        const images   = product.ProductImages || product.product_images || [];
        const imgSrc   = images.length > 0 ? images[0].image_path : 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

        $items.append(`
            <div class="mini-cart-item">
                <div class="mini-cart-item__img">
                    <img src="${imgSrc}" alt="${product.name || ''}">
                </div>
                <div class="mini-cart-item__info">
                    <div class="mini-cart-item__name">${product.name || 'Product'}</div>
                    <div class="mini-cart-item__meta">${variant.colorway || ''} · ${variant.size_type || ''} ${variant.size_value || ''}</div>
                    <div class="mini-cart-item__price">₱${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span class="mini-cart-item__qty">× ${item.quantity}</span></div>
                </div>
            </div>
        `);
    });

    const shipping = subtotal >= 3000 ? 0 : 150;
    const total    = subtotal + shipping;
    $('#miniCartTotal').text('₱' + total.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    $footer.show();
}

function loadWishlistCount(token) {
    $.ajax({
        url: '/api/wishlist/ids',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(ids) {
            if (ids && ids.length > 0) {
                $('#wishlist-count').text(ids.length).show();
            } else {
                $('#wishlist-count').hide();
            }
        },
        error: function() {}
    });
}

function loadNotifications(token) {
    $.ajax({
        url: '/api/notifications',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(notifications) {
            renderMiniNotifications(notifications);
        },
        error: function() {}
    });
}

function updateNotifBadge() {
    const unread = $('.mini-notif-item--unread').length;
    if (unread > 0) {
        $('#notif-count').text(unread).show();
    } else {
        $('#notif-count').hide();
    }
}

function renderMiniNotifications(notifications) {
    const $items = $('#miniNotifItems');
    $items.empty();

    if (!notifications || notifications.length === 0) {
        $items.html('<div class="mini-notif-empty">You have no notifications yet.</div>');
        $('#notif-count').hide();
        return;
    }

    notifications.forEach(n => {
        const date = new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const unreadClass = n.is_read ? '' : 'mini-notif-item--unread';
        const link = n.Product ? `product-details.html?id=${n.Product.id}` : '#';

        $items.append(`
            <a href="${link}" class="mini-notif-item ${unreadClass}" data-id="${n.id}">
                <div class="mini-notif-item__msg">${n.message}</div>
                <div class="mini-notif-item__date">${date}</div>
            </a>
        `);
    });

    updateNotifBadge();
}

