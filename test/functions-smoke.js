const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const executed = [];
let lastConfig;

const mysqlPath = require.resolve('mysql2/promise');
require.cache[mysqlPath] = {
    id: mysqlPath,
    filename: mysqlPath,
    loaded: true,
    exports: {
        createConnection: async (config) => {
            lastConfig = config;
            return {
                execute: async (sql, params = []) => {
                    executed.push({ sql, params });
                    return [[], []];
                },
                end: async () => {}
            };
        }
    }
};

Object.assign(process.env, {
    DB_HOST: 'mysql.example.invalid',
    DB_PORT: '12345',
    DB_USER: 'shopflow_reader',
    DB_PASSWORD: 'test-only',
    DB_NAME: 'shopflow',
    DB_CA_CERT: '-----BEGIN CERTIFICATE-----\\nTEST\\n-----END CERTIFICATE-----'
});

async function run() {
    const products = require('../netlify/functions/products').handler;
    const search = require('../netlify/functions/search').handler;
    const customer = require('../netlify/functions/customer').handler;
    const analytics = require('../netlify/functions/analytics').handler;

    assert.equal((await products({ httpMethod: 'POST' })).statusCode, 405);
    assert.equal((await products({ httpMethod: 'GET' })).statusCode, 200);
    assert.equal(lastConfig.user, 'shopflow_reader');
    assert.equal(lastConfig.database, 'shopflow');
    assert.equal(lastConfig.ssl.rejectUnauthorized, true);
    assert.match(lastConfig.ssl.ca, /\nTEST\n/);

    assert.equal((await search({ httpMethod: 'GET', queryStringParameters: { q: 'book' } })).statusCode, 200);
    assert.deepEqual(executed.at(-1).params, ['%book%', '%book%', '%book%', '%book%']);
    assert.equal((await search({ httpMethod: 'GET', queryStringParameters: { q: 'x'.repeat(101) } })).statusCode, 400);

    assert.equal((await customer({ httpMethod: 'GET', queryStringParameters: { email: 'student@example.test' } })).statusCode, 200);
    assert.doesNotMatch(executed.at(-1).sql, /SELECT\s+\*/i);

    assert.equal((await analytics({ httpMethod: 'GET', queryStringParameters: { query: 'top-products' } })).statusCode, 200);
    assert.doesNotMatch(executed.at(-1).sql, /JOIN\s+reviews/i);
    assert.match(executed.at(-1).sql, /order_status\s*=\s*'Delivered'/i);

    assert.equal((await analytics({ httpMethod: 'GET', queryStringParameters: { query: 'segments' } })).statusCode, 200);
    assert.match(executed.at(-1).sql, /o\.order_status\s*=\s*'Delivered'/i);

    const clientJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
    assert.match(clientJs, /API_BASE_URL\s*=\s*'\/\.netlify\/functions'/);
    assert.doesNotMatch(clientJs, /\.innerHTML\s*=/);
    assert.doesNotMatch(clientJs, /radiant-kangaroo/i);

    console.log('ShopFlow security and metric smoke checks passed.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
