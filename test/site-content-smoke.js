const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const index = read('public/index.html');
const guide = read('public/troubleshooting.html');
const guideCss = read('public/css/troubleshooting.css');
const readme = read('README.md');

assert.match(index, /href="troubleshooting\.html"/);
assert.match(index, /class="skip-link"/);

assert.match(guide, /<html lang="en">/);
assert.match(guide, /name="viewport"/);
assert.match(guide, /<main id="main-content"/);
assert.match(guide, /aria-current="page"/);
assert.match(guide, /Browser[\s\S]*Netlify page[\s\S]*Netlify Function[\s\S]*Aiven MySQL[\s\S]*JSON/);
assert.match(guide, /\/\.netlify\/functions\/products/);

for (const status of ['404', '400', '405', '500']) {
    assert.match(guide, new RegExp(`>${status}<`));
}

for (const key of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_CA_CERT']) {
    assert.match(guide, new RegExp(`<code>${key}</code>`));
}

for (const topic of ['Colab Secrets', 'shopflow_reader', 'SHOW GRANTS;', 'rejectUnauthorized', 'Function log', 'stale']) {
    assert.match(guide, new RegExp(topic, 'i'));
}

for (const table of ['customers', 'products', 'orders', 'order_items', 'reviews', 'abandoned_carts', 'support_tickets']) {
    assert.match(guide, new RegExp(`<code>${table}</code>`));
}

assert.match(guideCss, /@media \(max-width: 680px\)/);
assert.match(guideCss, /overflow-x: auto/);
assert.match(readme, /Production recovery checklist/);
assert.doesNotMatch(guide, /BEGIN (RSA )?PRIVATE KEY/);
assert.doesNotMatch(guide, /mysql-[a-z0-9-]+\.aivencloud\.com/i);

console.log('ShopFlow guide content and safety checks passed.');
