const { createConnection, json, requireGet } = require('../lib/db');

exports.handler = async (event) => {
    const methodError = requireGet(event);
    if (methodError) return methodError;
    
    const email = event.queryStringParameters?.email;
    
    if (!email || email.length > 254) {
        return json(400, { error: 'Enter a valid fictional customer email' });
    }
    
    let connection;
    
    try {
        connection = await createConnection();
        
        const [rows] = await connection.execute(
            `SELECT first_name, last_name, email, customer_segment,
                    lifetime_value, status, registration_date
             FROM customers
             WHERE email = ?`,
            [email.trim().toLowerCase()]
        );
        
        return json(200, rows[0] || null);
    } catch (error) {
        console.error('Customer lookup error:', error);
        return json(500, { error: 'Lookup failed' });
    } finally {
        if (connection) await connection.end();
    }
};
