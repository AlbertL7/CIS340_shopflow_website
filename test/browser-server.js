const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.SHOPFLOW_TEST_PORT || 8095);
const publicDir = path.join(__dirname, '../public');

const products = [
    { product_id: 1, product_name: 'Trail Camera', category: 'Electronics', price: 89.95, stock_quantity: 12 },
    { product_id: 2, product_name: 'Everyday Backpack', category: 'Sports', price: 49.5, stock_quantity: 23 }
];

function sendJson(response, value) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(value));
}

http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/.netlify/functions/products') return sendJson(response, products);
    if (url.pathname === '/.netlify/functions/search') {
        const query = (url.searchParams.get('q') || '').toLowerCase();
        return sendJson(response, products.filter((product) => product.product_name.toLowerCase().includes(query)));
    }
    if (url.pathname === '/.netlify/functions/customer') {
        return sendJson(response, {
            first_name: 'Jordan', last_name: 'Lee', email: 'jordan@example.test',
            customer_segment: 'VIP', lifetime_value: 1250.5, status: 'Active', registration_date: '2024-09-15'
        });
    }
    if (url.pathname === '/.netlify/functions/analytics') {
        const query = url.searchParams.get('query');
        const rows = {
            'top-products': [{ product_name: 'Trail Camera', category: 'Electronics', times_ordered: 4, total_revenue: 519.94 }],
            segments: [{ customer_segment: 'VIP', customer_count: 8, total_orders: 12, actual_revenue: 6274.56 }],
            revenue: [{ category: 'Electronics', order_count: 9, units_sold: 14, revenue: 2849.45 }],
            orders: [{ order_status: 'Delivered', order_count: 12, percentage: 60, total_value: 6274.56 }],
            'monthly-sales': [{ month: '2024-10', orders: 5, unique_customers: 4, revenue: 1420.75 }],
            'product-performance': [{ performance_category: 'Bestseller', product_count: 4, avg_stock: 18 }]
        };
        return sendJson(response, rows[query] || []);
    }

    const files = {
        '/': ['index.html', 'text/html; charset=utf-8'],
        '/index.html': ['index.html', 'text/html; charset=utf-8'],
        '/css/style.css': ['css/style.css', 'text/css; charset=utf-8'],
        '/js/app.js': ['js/app.js', 'text/javascript; charset=utf-8']
    };
    const selected = files[url.pathname];
    if (!selected) {
        response.writeHead(404);
        return response.end('Not found');
    }
    response.writeHead(200, { 'Content-Type': selected[1] });
    return fs.createReadStream(path.join(publicDir, selected[0])).pipe(response);
}).listen(port, '127.0.0.1', () => {
    console.log(`ShopFlow browser test server: http://127.0.0.1:${port}`);
});
