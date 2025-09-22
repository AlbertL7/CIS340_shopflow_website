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
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: true }
        });
        
        let query = '';
        
        switch(queryType) {
            case 'top-products':
                query = `
                    SELECT 
                        p.product_name,
                        p.category,
                        COUNT(DISTINCT oi.order_id) as order_count,
                        ROUND(SUM(oi.line_total), 2) as revenue
                    FROM products p
                    JOIN order_items oi ON p.product_id = oi.product_id
                    GROUP BY p.product_id
                    ORDER BY revenue DESC
                    LIMIT 10
                `;
                break;
                
            case 'segments':
                query = `
                    SELECT 
                        customer_segment,
                        COUNT(*) as customer_count,
                        ROUND(AVG(lifetime_value), 2) as avg_ltv,
                        ROUND(SUM(lifetime_value), 2) as total_ltv
                    FROM customers
                    WHERE status = 'Active'
                    GROUP BY customer_segment
                    ORDER BY avg_ltv DESC
                `;
                break;
                
            case 'revenue':
                query = `
                    SELECT 
                        p.category,
                        SUM(oi.quantity) as units_sold,
                        ROUND(SUM(oi.line_total), 2) as revenue
                    FROM products p
                    JOIN order_items oi ON p.product_id = oi.product_id
                    GROUP BY p.category
                    ORDER BY revenue DESC
                `;
                break;
                
            case 'orders':
                query = `
                    SELECT 
                        order_status,
                        COUNT(*) as order_count,
                        ROUND(SUM(total_amount), 2) as total_value
                    FROM orders
                    GROUP BY order_status
                    ORDER BY order_count DESC
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
            body: JSON.stringify({ error: 'Analytics query failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
