const { createConnection, json, requireGet } = require('../lib/db');

exports.handler = async (event) => {
    const methodError = requireGet(event);
    if (methodError) return methodError;
    
    let connection;
    
    try {
        connection = await createConnection();
        
        const [rows] = await connection.execute(
            'SELECT product_id, product_name, category, price, stock_quantity FROM products WHERE status = ?',
            ['Active']
        );
        
        return json(200, rows);
    } catch (error) {
        console.error('Database error:', error);
        return json(500, { error: 'Database request failed' });
    } finally {
        if (connection) await connection.end();
    }
};
