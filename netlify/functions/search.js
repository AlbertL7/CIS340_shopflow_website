const mysql = require('mysql2/promise');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    const searchTerm = event.queryStringParameters?.q;
    
    if (!searchTerm) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Search term required' })
        };
    }
    
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
        
        // Search with partial matching - case insensitive
        const searchPattern = `%${searchTerm}%`;
        
        const [rows] = await connection.execute(
            `SELECT DISTINCT 
                p.product_id, 
                p.product_name, 
                p.category, 
                p.price, 
                p.stock_quantity,
                p.description
             FROM products p
             WHERE (
                LOWER(p.product_name) LIKE LOWER(?) OR 
                LOWER(p.category) LIKE LOWER(?) OR 
                LOWER(p.description) LIKE LOWER(?) OR
                LOWER(p.sku) LIKE LOWER(?)
             ) AND p.status = 'Active'
             ORDER BY p.product_name`,
            [searchPattern, searchPattern, searchPattern, searchPattern]
        );
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Search failed', details: error.message })
        };
    } finally {
        if (connection) await connection.end();
    }
};
