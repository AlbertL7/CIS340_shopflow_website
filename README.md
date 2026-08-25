# ShopFlow E-Commerce Database Website

This CISS 340 guided prototype publishes realistic instructor-provided fictional data through a read-only server-side API:

`Browser -> Netlify page -> Netlify Function -> Aiven for MySQL 8.4 -> JSON -> Browser`

The browser never receives database credentials and never connects directly to MySQL.

## Setup Instructions

### Prerequisites
- Node.js 22.13 or newer
- Git installed
- GitHub account
- Netlify account
- Aiven for MySQL 8.4 database named `shopflow`
- SELECT-only `shopflow_reader` database account
- Aiven CA certificate

### Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and enter the local values. Never commit `.env`.
4. Run locally: `npm run dev`
5. Open http://localhost:8888

### Deployment

1. Push to GitHub
2. Connect GitHub repo to Netlify
3. Add the six environment variables shown in `.env.example` to Netlify. Store the full CA certificate in `DB_CA_CERT`.
4. Deploy and wait until Netlify reports the production deploy as published.
5. Test `/.netlify/functions/products`, one search, and one analytics request before testing the page.

## Production recovery checklist

Use this order when the page loads but database features fail. Repair and retest one handoff at a time.

1. **Contain exposed secrets.** Rotate any credential that appeared in notebook code, GitHub, logs, screenshots, or a prompt. Move notebook values into Colab Secrets. Never record actual values in this README or an issue.
2. **Confirm Aiven is running.** Verify the intended MySQL 8.4 service and `shopflow` schema without sharing the host, port, password, certificate, or connection string.
3. **Prove the data load.** Run `SHOW TABLES` and read-only row counts for all seven tables. Re-run an incomplete loader from the secret-backed notebook, then compare persisted table counts with the cleaned CSV counts. Treat old cell output as stale until the database confirms it.
4. **Verify least privilege.** Create or restore `shopflow_reader` outside source control and grant only `SELECT` on `shopflow.*`. Never deploy `avnadmin`. Use `SHOW GRANTS` while connected as the reader to confirm the scope.
5. **Check the six exact Netlify keys.** Confirm `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_CA_CERT`. Names are case-sensitive. Mark only `DB_PASSWORD` and `DB_CA_CERT` as secret values; marking ordinary values such as `shopflow` as secrets can make Netlify's scanner stop a build when that expected text appears in documentation or tests. Store the full CA certificate with its line breaks and keep TLS verification enabled.
6. **Redeploy the corrected configuration.** Wait for the current production deploy to publish; do not test an older deploy.
7. **Test from the inside out.** Check the Function log, then `/.netlify/functions/products`, one search, one customer lookup using fictional data, one analytics response, and finally the rendered page. Expect same-origin `GET` requests and JSON responses.

The public [student troubleshooting guide](public/troubleshooting.html) explains the request flow, HTTP status codes, CSV validation, logs, and safe evidence collection without exposing credentials.

## Features
- Product catalog with search and filters
- Fictional customer lookup with selected fields only
- Business analytics dashboard
- Delivered-revenue metrics that sum `order_items.quantity * order_items.unit_price` at the order-item grain

## Security expectations

- Use `avnadmin` only for setup; deploy only `shopflow_reader`.
- Grant `shopflow_reader` only `SELECT` on `shopflow.*`.
- Keep TLS certificate validation enabled.
- Never place passwords, connection strings, tokens, or real customer data in GitHub, screenshots, or AI prompts.
- The public site must contain only the instructor-provided fictional ShopFlow records.
