const API_BASE_URL = '/.netlify/functions';

let allProducts = [];

const byId = (id) => document.getElementById(id);
const displayValue = (value, fallback = '—') =>
    value === null || value === undefined || value === '' ? fallback : String(value);
const money = (value) => `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})}`;

function makeElement(tagName, text, className) {
    const element = document.createElement(tagName);
    if (text !== undefined) element.textContent = displayValue(text, '');
    if (className) element.className = className;
    return element;
}

function showMessage(container, message, isError = false) {
    container.replaceChildren(makeElement('p', message, isError ? 'error' : 'status-message'));
}

async function requestJson(path) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'The database request failed');
    return payload;
}

function renderTable(title, columns, rows) {
    const wrapper = document.createElement('div');
    const heading = makeElement('h3', title);
    const scroll = makeElement('div', undefined, 'table-scroll');
    const table = document.createElement('table');
    const caption = makeElement('caption', title, 'visually-hidden');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const tbody = document.createElement('tbody');

    columns.forEach((column) => {
        const header = makeElement('th', column.label);
        header.scope = 'col';
        headerRow.appendChild(header);
    });

    rows.forEach((row) => {
        const tableRow = document.createElement('tr');
        columns.forEach((column) => {
            const rawValue = typeof column.value === 'function'
                ? column.value(row)
                : row[column.value];
            const value = column.format ? column.format(rawValue, row) : displayValue(rawValue);
            tableRow.appendChild(makeElement('td', value));
        });
        tbody.appendChild(tableRow);
    });

    thead.appendChild(headerRow);
    table.append(caption, thead, tbody);
    scroll.appendChild(table);
    wrapper.append(heading, scroll);
    return wrapper;
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    byId('search-input')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') searchProducts();
    });
    byId('customer-email')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') lookupCustomer();
    });
});

async function loadProducts() {
    const container = byId('product-list');
    showMessage(container, 'Loading fictional ShopFlow products…');
    try {
        allProducts = await requestJson('/products');
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage(container, error.message, true);
    }
}

function displayProducts(products) {
    const container = byId('product-list');
    if (!Array.isArray(products) || products.length === 0) {
        showMessage(container, 'No matching products were found.');
        return;
    }

    const cards = products.map((product) => {
        const card = makeElement('article', undefined, 'product-card');
        card.append(
            makeElement('h3', product.product_name),
            makeElement('p', product.category, 'product-category'),
            makeElement('p', money(product.price), 'product-price'),
            makeElement('p', `Stock: ${displayValue(product.stock_quantity, '0')}`, 'product-stock')
        );
        return card;
    });
    container.replaceChildren(...cards);
}

async function searchProducts() {
    const searchTerm = byId('search-input').value.trim();
    if (!searchTerm) {
        displayProducts(allProducts);
        return;
    }

    const container = byId('product-list');
    showMessage(container, 'Searching the fictional product catalog…');
    try {
        displayProducts(await requestJson(`/search?q=${encodeURIComponent(searchTerm)}`));
    } catch (error) {
        console.error('Search failed:', error);
        showMessage(container, error.message, true);
    }
}

function filterByCategory() {
    const category = byId('category-filter').value;
    displayProducts(category ? allProducts.filter((product) => product.category === category) : allProducts);
}

function filterByPrice() {
    const priceRange = byId('price-filter').value;
    const ranges = {
        '0-50': (product) => Number(product.price) < 50,
        '50-100': (product) => Number(product.price) >= 50 && Number(product.price) <= 100,
        '100+': (product) => Number(product.price) > 100
    };
    displayProducts(ranges[priceRange] ? allProducts.filter(ranges[priceRange]) : allProducts);
}

async function lookupCustomer() {
    const email = byId('customer-email').value.trim();
    const result = byId('customer-result');
    if (!email) {
        showMessage(result, 'Enter one of the fictional customer email addresses.', true);
        return;
    }

    showMessage(result, 'Looking up the fictional customer…');
    try {
        const customer = await requestJson(`/customer?email=${encodeURIComponent(email)}`);
        if (!customer) {
            showMessage(result, 'No fictional customer matched that email.');
            return;
        }

        const card = makeElement('article', undefined, 'customer-info');
        card.append(
            makeElement('h3', `${displayValue(customer.first_name, '')} ${displayValue(customer.last_name, '')}`.trim()),
            makeElement('p', `Email: ${displayValue(customer.email)}`),
            makeElement('p', `Segment: ${displayValue(customer.customer_segment)}`),
            makeElement('p', `Lifetime value: ${money(customer.lifetime_value)}`),
            makeElement('p', `Status: ${displayValue(customer.status)}`),
            makeElement('p', `Member since: ${displayValue(customer.registration_date)}`)
        );
        result.replaceChildren(card);
    } catch (error) {
        console.error('Lookup failed:', error);
        showMessage(result, error.message, true);
    }
}

async function loadAnalytics(query, title, columns) {
    const result = byId('analytics-result');
    showMessage(result, 'Running the selected database analysis…');
    try {
        const rows = await requestJson(`/analytics?query=${encodeURIComponent(query)}`);
        result.replaceChildren(renderTable(title, columns, rows));
    } catch (error) {
        console.error('Analytics failed:', error);
        showMessage(result, error.message, true);
    }
}

function getTopProducts() {
    return loadAnalytics('top-products', 'Top 10 products by delivered revenue', [
        { label: 'Product', value: 'product_name' },
        { label: 'Category', value: 'category' },
        { label: 'Orders', value: 'times_ordered' },
        { label: 'Revenue', value: 'total_revenue', format: money }
    ]);
}

function getCustomerSegments() {
    return loadAnalytics('segments', 'Active customer segments and delivered revenue', [
        { label: 'Segment', value: 'customer_segment' },
        { label: 'Customers', value: 'customer_count' },
        { label: 'Delivered orders', value: 'total_orders' },
        { label: 'Delivered revenue', value: 'actual_revenue', format: money }
    ]);
}

function getRevenueByCategory() {
    return loadAnalytics('revenue', 'Delivered revenue by category', [
        { label: 'Category', value: 'category' },
        { label: 'Orders', value: 'order_count' },
        { label: 'Units sold', value: 'units_sold' },
        { label: 'Revenue', value: 'revenue', format: money }
    ]);
}

function getOrderStatus() {
    return loadAnalytics('orders', 'Order status distribution', [
        { label: 'Status', value: 'order_status' },
        { label: 'Count', value: 'order_count' },
        { label: 'Percentage', value: 'percentage', format: (value) => `${displayValue(value, '0')}%` },
        { label: 'Order value', value: 'total_value', format: money }
    ]);
}

function getMonthlySales() {
    return loadAnalytics('monthly-sales', 'Monthly delivered sales trend', [
        { label: 'Month', value: 'month' },
        { label: 'Orders', value: 'orders' },
        { label: 'Customers', value: 'unique_customers' },
        { label: 'Revenue', value: 'revenue', format: money }
    ]);
}

function getProductPerformance() {
    return loadAnalytics('product-performance', 'Product performance categories', [
        { label: 'Performance', value: 'performance_category' },
        { label: 'Products', value: 'product_count' },
        { label: 'Average stock', value: 'avg_stock', format: (value) => Math.round(Number(value || 0)) }
    ]);
}
