// Client-side cart store -- replaces the old cart_items DB table.
// The cart is just [{ variant_id, quantity }] in localStorage. Every page
// that needs full product/price/stock data resolves it against the server
// via POST /api/cart/resolve instead of storing that data locally (so
// prices/stock shown are always live, not stale copies).
const CartStore = (function () {
    const KEY = 'adidas_cart';

    function read() {
        try {
            const raw = localStorage.getItem(KEY);
            const items = raw ? JSON.parse(raw) : [];
            return Array.isArray(items) ? items : [];
        } catch (e) {
            return [];
        }
    }

    function write(items) {
        localStorage.setItem(KEY, JSON.stringify(items));
        $(document).trigger('cart:changed', [items]);
    }

    function add(variantId, quantity) {
        variantId = parseInt(variantId, 10);
        quantity = parseInt(quantity, 10) || 1;

        const items = read();
        const existing = items.find(i => i.variant_id === variantId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({ variant_id: variantId, quantity });
        }
        write(items);
        return items;
    }

    function updateQuantity(variantId, quantity) {
        variantId = parseInt(variantId, 10);
        quantity = parseInt(quantity, 10) || 1;

        const items = read().map(i =>
            i.variant_id === variantId ? { ...i, quantity } : i
        );
        write(items);
        return items;
    }

    function remove(variantId) {
        variantId = parseInt(variantId, 10);
        const items = read().filter(i => i.variant_id !== variantId);
        write(items);
        return items;
    }

    function clear() {
        localStorage.removeItem(KEY);
        $(document).trigger('cart:changed', [[]]);
    }

    function count() {
        return read().reduce((sum, i) => sum + i.quantity, 0);
    }

    // Hits the one remaining server route to hydrate the stored variant_ids
    // with live product/price/stock data. Returns a jQuery promise.
    function resolve(token) {
        const items = read();
        if (items.length === 0) {
            return $.Deferred().resolve([]).promise();
        }
        return $.ajax({
            url: '/api/cart/resolve',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ items })
        });
    }

    return { read, write, add, updateQuantity, remove, clear, count, resolve };
})();
