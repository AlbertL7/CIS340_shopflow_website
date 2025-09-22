const mysql = require('mysql2/promise');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    const queryType = event.queryStringParameters?.query;
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });
        
        let query = '';
        
        switch(queryType) {
            case 'top-products':
                // Products that were actually sold
                query = `
                    SELECT 
                        p.product_name,
                        p.category,
                        COUNT(DISTINCT oi.order_id) as times_ordered,
                        SUM(oi.quantity) as total_quantity_sold,
                        ROUND(SUM(oi.line_total), 2) as total_revenue,
                        ROUND(AVG(r.rating), 1) as avg_rating
                    FROM products p
                    INNER JOIN order_items oi ON p.product_id = oi.product_id
                    INNER JOIN orders o ON oi.order_id = o.order_id
                    LEFT JOIN reviews r ON p.product_id = r.product_id
                    WHERE o.order_status = 'Delivered'
                    GROUP BY p.product_id, p.product_name, p.category
                    ORDER BY total_revenue DESC
                    LIMIT 10
                `;
                break;
                
            case 'segments':
                // Real customer purchase behavior
                query = `
                    SELECT 
                        c.customer_segment,
                        COUNT(DISTINCT c.customer_id) as customer_count,
                        COUNT(DISTINCT o.order_id) as total_orders,
                        ROUND(AVG(c.lifetime_value), 2) as avg_ltv,
                        ROUND(SUM(o.total_amount), 2) as actual_revenue
                    FROM customers c
                    LEFT JOIN orders o ON c.customer_id = o.customer_id
                    WHERE c.status = 'Active'
                    GROUP BY c.customer_segment
                    ORDER BY actual_revenue DESC
                `;
                break;
                
            case 'revenue':
                // Actual revenue by category from completed orders
                query = `
                    SELECT 
                        p.category,
                        COUNT(DISTINCT o.order_id) as order_count,
                        SUM(oi.quantity) as units_sold,
                        ROUND(SUM(oi.line_total), 2) as revenue,
                        ROUND(AVG(oi.unit_price), 2) as avg_price
                    FROM products p
                    INNER JOIN order_items oi ON p.product_id = oi.product_id
                    INNER JOIN orders o ON oi.order_id = o.order_id
                    WHERE o.order_status = 'Delivered'
                    GROUP BY p.category
                    ORDER BY revenue DESC
                `;
                break;
                
            case 'orders':
                // Order fulfillment analysis
                query = `
                    SELECT 
                        order_status,
                        COUNT(*) as order_count,
                        ROUND(SUM(total_amount), 2) as total_value,
                        ROUND(AVG(total_amount), 2) as avg_order_value,
                        ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) as percentage
                    FROM orders
                    GROUP BY order_status
                    ORDER BY order_count DESC
                `;
                break;
                
            case 'monthly-sales':
                // Sales trend over time
                query = `
                    SELECT 
                        DATE_FORMAT(order_date, '%Y-%m') as month,
                        COUNT(DISTINCT order_id) as orders,
                        COUNT(DISTINCT customer_id) as unique_customers,
                        ROUND(SUM(total_amount), 2) as revenue
                    FROM orders
                    WHERE order_status = 'Delivered'
                    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
                    ORDER BY month DESC
                    LIMIT 12
                `;
                break;
                
            case 'product-performance':
                // Products never sold vs bestsellers
                query = `
                    SELECT 
                        CASE 
                            WHEN oi.order_id IS NULL THEN 'Never Sold'
                            WHEN order_count >= 3 THEN 'Bestseller'
                            ELSE 'Regular'
                        END as performance_category,
                        COUNT(DISTINCT p.product_id) as product_count,
                        AVG(p.stock_quantity) as avg_stock
                    FROM products p
                    LEFT JOIN (
                        SELECT product_id, COUNT(*) as order_count, order_id
                        FROM order_items
                        GROUP BY product_id
                    ) oi ON p.product_id = oi.product_id
                    GROUP BY performance_category
                `;
                break;
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid query type' })
                };
        }
        
        const [rows] = await connection.execute(query);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Analytics error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Analytics query failed', details: error.message })
        };
    } finally {
        if (connection) await connection.end();
    }
};
