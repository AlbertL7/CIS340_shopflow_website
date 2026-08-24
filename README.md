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
