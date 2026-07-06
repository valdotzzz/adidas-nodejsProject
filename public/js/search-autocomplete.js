/**
 * search-autocomplete.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Adds a live AJAX autocomplete dropdown to the header search bar.
 *
 * HOW IT WORKS:
 *   - Fetches /api/products once per page load and caches the results.
 *   - On every keyup (debounced 250ms), filters by name/style_code and renders
 *     up to 6 suggestions in a dropdown beneath the search bar.
 *   - Each suggestion shows a thumbnail, product name, category, and price.
 *   - Clicking a suggestion navigates to shop.html?search=<name>.
 *   - Pressing Enter or clicking the search button still does the existing
 *     full-page redirect (no changes to that behaviour).
 *
 * HOW TO INSTALL:
 *   Add this ONE script tag to every HTML file that includes layout.js,
 *   placed AFTER the layout.js script tag:
 *
 *     <script src="js/search-autocomplete.js"></script>
 *
 *   That's it — no other files need to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function ($) {
    'use strict';

    // ── Config ────────────────────────────────────────────────────────────────
    const MAX_SUGGESTIONS  = 6;
    const DEBOUNCE_DELAY   = 250;   // ms
    const MIN_QUERY_LENGTH = 2;     // don't fire until at least 2 chars typed
    const FALLBACK_IMG     = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

    // ── State ─────────────────────────────────────────────────────────────────
    let productCache  = null;   // populated once on first keyup
    let debounceTimer = null;
    let activeIndex   = -1;     // keyboard nav: which row is highlighted

    // ── Wait for layout.js to finish rendering the header ────────────────────
    // layout.js calls renderHeader() synchronously inside $(document).ready(),
    // so by the time our own ready() fires the header DOM is already in place.
    $(document).ready(function () {
        injectDropdownContainer();
        bindEvents();
    });

    // ── Inject the dropdown container right after the search input ────────────
    function injectDropdownContainer() {
        // Guard: only inject once (useful if layout.js is ever called again)
        if ($('#searchAutocompleteDropdown').length) return;

        // Wrap the form in a relative-positioned shell so the dropdown
        // can be positioned absolutely beneath it without CSS edits.
        $('#headerSearchForm').css('position', 'relative');

        $('#headerSearchForm').append(`
            <div id="searchAutocompleteDropdown" style="
                display:none;
                position:absolute;
                top:calc(100% + 6px);
                left:0;
                right:0;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                box-shadow:0 8px 24px rgba(0,0,0,0.12);
                z-index:9999;
                overflow:hidden;
                min-width:320px;
            "></div>
        `);
    }

    // ── Bind all event listeners ──────────────────────────────────────────────
    function bindEvents() {
        // Keyup → debounced search
        $(document).on('keyup', '#headerSearchInput', function (e) {
            const key = e.key;

            // Arrow navigation — don't retrigger search
            if (key === 'ArrowDown') { navigateDropdown(1);  return; }
            if (key === 'ArrowUp')   { navigateDropdown(-1); return; }
            if (key === 'Enter')     { selectActive();        return; }
            if (key === 'Escape')    { closeDropdown();       return; }

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                const query = $('#headerSearchInput').val().trim();
                if (query.length < MIN_QUERY_LENGTH) {
                    closeDropdown();
                    return;
                }
                runSearch(query);
            }, DEBOUNCE_DELAY);
        });

        // Close dropdown when clicking outside
        $(document).on('click', function (e) {
            if (!$(e.target).closest('#headerSearchForm').length) {
                closeDropdown();
            }
        });

        // Re-open dropdown on focus if there's already a query
        $(document).on('focus', '#headerSearchInput', function () {
            const query = $(this).val().trim();
            if (query.length >= MIN_QUERY_LENGTH && productCache) {
                runSearch(query);
            }
        });
    }

    // ── Fetch (with cache) + filter + render ──────────────────────────────────
    function runSearch(query) {
        if (productCache) {
            renderSuggestions(filterProducts(productCache, query), query);
        } else {
            // Show a subtle loading state while fetching
            showDropdown();
            $('#searchAutocompleteDropdown').html(`
                <div style="padding:14px 16px; color:#888; font-size:13px;">Searching…</div>
            `);

            $.ajax({
                url    : '/api/products',
                method : 'GET',
                success: function (products) {
                    productCache = products;
                    renderSuggestions(filterProducts(productCache, query), query);
                },
                error: function () {
                    closeDropdown();
                }
            });
        }
    }

    function filterProducts(products, query) {
        const q = query.toLowerCase();
        return products
            .filter(function (p) {
                return (
                    (p.name       && p.name.toLowerCase().includes(q))       ||
                    (p.style_code && p.style_code.toLowerCase().includes(q)) ||
                    (p.Category   && p.Category.name && p.Category.name.toLowerCase().includes(q))
                );
            })
            .slice(0, MAX_SUGGESTIONS);
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function renderSuggestions(products, query) {
        const $dropdown = $('#searchAutocompleteDropdown');
        activeIndex = -1;

        if (products.length === 0) {
            $dropdown.html(`
                <div style="padding:14px 16px; color:#888; font-size:13px;">
                    No results for "<strong>${escapeHtml(query)}</strong>"
                </div>
            `);
            showDropdown();
            return;
        }

        const rows = products.map(function (p, i) {
            const img      = getThumb(p);
            const name     = escapeHtml(p.name);
            const category = p.Category ? escapeHtml(p.Category.name) : '';
            const price    = formatPrice(p);
            const encoded  = encodeURIComponent(p.name);

            return `
                <a  href="shop.html?search=${encoded}"
                    class="ac-row"
                    data-index="${i}"
                    style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                        padding:10px 14px;
                        text-decoration:none;
                        color:#111;
                        border-bottom:1px solid #f0f0f0;
                        transition:background 0.12s;
                    "
                    onmouseover="this.style.background='#f7f7f7'"
                    onmouseout="this.style.background=''"
                >
                    <!-- Thumbnail -->
                    <div style="
                        width:52px; height:52px;
                        flex-shrink:0;
                        border-radius:6px;
                        overflow:hidden;
                        background:#f0f0f0;
                        display:flex; align-items:center; justify-content:center;
                    ">
                        <img
                            src="${img}"
                            alt="${name}"
                            style="width:100%; height:100%; object-fit:cover;"
                            onerror="this.src='${FALLBACK_IMG}'"
                        >
                    </div>

                    <!-- Text info -->
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${highlightMatch(name, query)}
                        </div>
                        ${category ? `<div style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">${category}</div>` : ''}
                    </div>

                    <!-- Price -->
                    <div style="font-size:13px; font-weight:700; white-space:nowrap; flex-shrink:0;">
                        ${price}
                    </div>
                </a>
            `;
        });

        // "See all results" footer row
        rows.push(`
            <a  href="shop.html?search=${encodeURIComponent(query)}"
                style="
                    display:block;
                    padding:10px 14px;
                    font-size:12px;
                    color:#555;
                    text-decoration:none;
                    text-align:center;
                    background:#fafafa;
                    font-weight:600;
                    letter-spacing:0.5px;
                    text-transform:uppercase;
                "
                onmouseover="this.style.background='#f0f0f0'"
                onmouseout="this.style.background='#fafafa'"
            >
                See all results for "${escapeHtml(query)}" →
            </a>
        `);

        $dropdown.html(rows.join(''));
        showDropdown();
    }

    // ── Keyboard navigation ───────────────────────────────────────────────────
    function navigateDropdown(direction) {
        const $rows = $('#searchAutocompleteDropdown .ac-row');
        if (!$rows.length) return;

        $rows.css('background', '');

        activeIndex = Math.max(-1, Math.min(activeIndex + direction, $rows.length - 1));

        if (activeIndex >= 0) {
            $rows.eq(activeIndex).css('background', '#f0f0f0');
        }
    }

    function selectActive() {
        const $rows = $('#searchAutocompleteDropdown .ac-row');
        if (activeIndex >= 0 && $rows.length > activeIndex) {
            window.location.href = $rows.eq(activeIndex).attr('href');
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getThumb(product) {
        const images = product.ProductImages || product.product_images || [];
        if (images.length > 0) {
            const path = images[0].image_path;
            // Uploaded files use a relative path; external URLs are already absolute
            return path.startsWith('http') ? path : path;
        }
        return FALLBACK_IMG;
    }

    function formatPrice(product) {
        const price     = parseFloat(product.price);
        const salePrice = product.sale_price !== null && product.sale_price !== undefined
            ? parseFloat(product.sale_price) : null;

        if (salePrice !== null && salePrice < price) {
            return `<span style="color:#e53e3e; font-weight:700;">₱${salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span style="color:#aaa; font-size:11px; text-decoration:line-through; margin-left:4px;">₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`;
        }
        return `₱${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    // Wraps the matched substring in a <strong> so it's visually highlighted
    function highlightMatch(name, query) {
        const idx = name.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return name;
        return (
            name.slice(0, idx) +
            '<strong>' + name.slice(idx, idx + query.length) + '</strong>' +
            name.slice(idx + query.length)
        );
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showDropdown() {
        $('#searchAutocompleteDropdown').show();
    }

    function closeDropdown() {
        $('#searchAutocompleteDropdown').hide();
        activeIndex = -1;
    }

}(jQuery));
