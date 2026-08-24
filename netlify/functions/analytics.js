const { createConnection, json, requireGet } = require('../lib/db');

exports.handler = async (event) => {
    const methodError = requireGet(event);
    if (methodError) return methodError;
    
    const queryType = event.queryStringParameters?.query;
    let connection;
    
    try {
        connection = await createConnection();
        
        let query = '';
        
        switch(queryType) {
            case 'top-products':
                query = `
                    SELECT 
                        p.product_name,
                        p.category,
                        COUNT(DISTINCT oi.order_id) as times_ordered,
                        SUM(oi.quantity) as total_quantity_sold,
                        ROUND(SUM(oi.line_total), 2) as total_revenue
                    FROM products p
                    INNER JOIN order_items oi ON p.product_id = oi.product_id
                    INNER JOIN orders o ON oi.order_id = o.order_id
                    WHERE o.order_status = 'Delivered'
                    GROUP BY p.product_id, p.product_name, p.category
                    ORDER BY total_revenue DESC
                    LIMIT 10
                `;
                break;
                
            case 'segments':
                query = `
                    SELECT 
                        c.customer_segment,
                        COUNT(DISTINCT c.customer_id) as customer_count,
                        COUNT(DISTINCT o.order_id) as total_orders,
                        ROUND(AVG(c.lifetime_value), 2) as avg_ltv,
                        ROUND(SUM(o.total_amount), 2) as actual_revenue
                    FROM customers c
                    LEFT JOIN orders o
                        ON c.customer_id = o.customer_id
                       AND o.order_status = 'Delivered'
                    WHERE c.status = 'Active'
                    GROUP BY c.customer_segment
                    ORDER BY actual_revenue DESC
                `;
                break;
                
            case 'revenue':
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
                query = `
                    SELECT 
                        CASE 
                            WHEN sales.total_sold IS NULL THEN 'Never Sold'
                            WHEN sales.total_sold >= 3 THEN 'Bestseller'
                            ELSE 'Regular'
                        END as performance_category,
                        COUNT(DISTINCT p.product_id) as product_count,
                        ROUND(AVG(p.stock_quantity), 0) as avg_stock
                    FROM products p
                    LEFT JOIN (
                        SELECT 
                            oi.product_id,
                            COUNT(*) as total_sold
                        FROM order_items oi
                        INNER JOIN orders o ON oi.order_id = o.order_id
                        WHERE o.order_status = 'Delivered'
                        GROUP BY oi.product_id
                    ) sales ON p.product_id = sales.product_id
                    GROUP BY performance_category
                    ORDER BY 
                        CASE performance_category
                            WHEN 'Bestseller' THEN 1
                            WHEN 'Regular' THEN 2
                            WHEN 'Never Sold' THEN 3
                        END
                `;
                break;
                
            default:
                return json(400, { error: 'Invalid query type' });
        }
        
        const [rows] = await connection.execute(query);
        
        return json(200, rows);
    } catch (error) {
        console.error('Analytics error:', error);
        return json(500, { error: 'Analytics query failed' });
    } finally {
        if (connection) await connection.end();
    }
};
