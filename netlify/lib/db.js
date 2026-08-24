const mysql = require('mysql2/promise');

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
};

function requiredEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not configured`);
    return value;
}

function json(statusCode, body) {
    return {
        statusCode,
        headers: JSON_HEADERS,
        body: JSON.stringify(body)
    };
}

function requireGet(event) {
    return event.httpMethod === 'GET'
        ? null
        : json(405, { error: 'Method not allowed' });
}

async function createConnection() {
    const ca = requiredEnv('DB_CA_CERT').replace(/\\n/g, '\n');

    return mysql.createConnection({
        host: requiredEnv('DB_HOST'),
        port: Number.parseInt(requiredEnv('DB_PORT'), 10),
        user: requiredEnv('DB_USER'),
        password: requiredEnv('DB_PASSWORD'),
        database: requiredEnv('DB_NAME'),
        ssl: { ca, rejectUnauthorized: true }
    });
}

module.exports = { createConnection, json, requireGet };
