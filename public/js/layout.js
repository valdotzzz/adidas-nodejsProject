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
                        <a href="cart.html" class="icon-link" title="Cart">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 01-8 0"></path>
                            </svg>
                            <span id="cart-count" class="cart-badge" style="display:none;">0</span>
                        </a>
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
                        <a href="#">Order Tracker</a>
                        <a href="#">Returns & Exchanges</a>
                        <a href="#">Help Center</a>
                    </div>
                    <div class="footer-col">
                        <h4>Company Info</h4>
                        <a href="#">About Adidas</a>
                        <a href="#">Careers</a>
                        <a href="#">Press</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Adidas E-Commerce Project. BSIT Section S-2A.</p>
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
    }

    $(document).on('click', '#logoutBtn', function() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Header search — redirects to shop.html with a ?search= query
    $(document).on('submit', '#headerSearchForm', function(e) {
        e.preventDefault();
        const query = $('#headerSearchInput').val().trim();
        if (query) {
            window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
    });
}

function loadCartCount(token) {
    $.ajax({
        url: '/api/cart',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(cartItems) {
            const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQty > 0) {
                $('#cart-count').text(totalQty).show();
            }
        },
        error: function() {}
    });
}

function loadCartCount(token) {
    $.ajax({
        url: '/api/cart',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(cartItems) {
            const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQty > 0) {
                $('#cart-count').text(`(${totalQty})`);
            }
        },
        error: function() {
            // Silently ignore — don't break the whole page if this fails
        }
    });
}