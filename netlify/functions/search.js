const { createConnection, json, requireGet } = require('../lib/db');

exports.handler = async (event) => {
    const methodError = requireGet(event);
    if (methodError) return methodError;
    
    const searchTerm = event.queryStringParameters?.q;
    
    if (!searchTerm || searchTerm.trim().length > 100) {
        return json(400, { error: 'Enter a search term of 1 to 100 characters' });
    }
    
    let connection;
    
    try {
        connection = await createConnection();
        
        // Search with partial matching - case insensitive
        const searchPattern = `%${searchTerm.trim()}%`;
        
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
        
        return json(200, rows);
    } catch (error) {
        console.error('Search error:', error);
        return json(500, { error: 'Search failed' });
    } finally {
        if (connection) await connection.end();
    }
};
