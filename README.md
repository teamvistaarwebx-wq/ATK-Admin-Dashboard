# AKT Gifting Admin

The Next.js admin for Atulya Karigari: catalogue, inventory, orders, inquiries,
banners and gift options. The UI follows Shopify's admin: a dark sidebar,
flat white cards on a grey canvas, Inter, one charcoal primary action per
screen, and Polaris-style status badges.

## Try it with dummy data (no database needed)

```bash
npm install
npm run demo         # http://localhost:3011
```

Sign in with **demo@atk.test** / **DemoPass2026**. `npm run demo` starts a
throwaway MongoDB of its own (the first run downloads it, about 100MB), fills
it with a demo store — 18 products, ~200 orders over four months, storefront
visits, live visitors and carts, inquiries — and runs the app against it.
Everything works: adding and editing products, stock, CSV import and export,
order status changes. Photos are kept in the demo database, so no R2 bucket is
needed. Changes survive a restart; `npm run demo -- --reset` starts over with
fresh dummy data. Nothing connects to a real database or the storefront.

## Run against a real database

```bash
npm install
npm run dev          # http://localhost:3011
```

`.env.local` needs at least `MONGODB_URI`, `ADMIN_SESSION_SECRET` and
`INTERNAL_API_SECRET`. Seed the categories and a first admin with
`npm run seed:catalog` and `npm run seed:admin`.

## Home (dashboard)

- **Date range**: presets (today, yesterday, 7/30/90/365 days, month, last
  month, quarter, last quarter, year to date) or a custom range from the
  calendar. All days are IST. Kept in the URL (`?range=last_30_days` or
  `?from=2026-10-01&to=2026-10-24`), so a view can be shared.
- **Comparison**: previous period (default), previous year, or none
  (`?compare=`). Calendar presets compare like with like — month to date with
  the same days of last month.
- **Metrics**: total sales, orders, average order value, visitors, sessions
  and inquiries. Each tab shows the change against the comparison period, and
  the line chart draws this period against the previous one.
- **Regions**: sessions, orders, sales and inquiries per state.
- **Live view**: visitors in the last five minutes, open carts, shoppers at
  payment, top locations and pages. Refreshes every 30 seconds.

### Storefront tracking (visitors, sessions, regions, live view)

Sessions, visitors, region-wise traffic and live carts come from the
storefront. Its server forwards each hit to the admin:

```
POST /api/analytics/track
Authorization: Bearer $INTERNAL_API_SECRET
Content-Type: application/json

{
  "visitorId": "k3j4h5g6f7d8",      // first-party cookie, 8–64 chars [A-Za-z0-9_-]
  "event": "pageview",               // "pageview" | "heartbeat" | "cart"
  "path": "/products/rust-orange-saree?utm_source=instagram",
  "referrer": "https://l.instagram.com/",
  "country": "IN",                   // x-vercel-ip-country
  "state": "KA",                     // x-vercel-ip-country-region (code or name)
  "city": "Bengaluru",               // x-vercel-ip-city
  "device": "mobile",                // optional: mobile | tablet | desktop
  "cart": { "items": 2, "value": 2899800 }   // optional, value in paise
}
```

Send a `pageview` per page, a `heartbeat` every minute while the tab is
visible (keeps the live view accurate), and a `cart` event when the cart
changes. A visit becomes a new session after 30 minutes of silence. No IP
address is stored.

Create these indexes on `sitesessions` in Atlas (`autoIndex` is off in
production — see `src/models/README.md`):

- `{ visitorId: 1, lastSeenAt: -1 }`
- `{ startedAt: -1 }`
- `{ lastSeenAt: -1 }`
- `{ lastSeenAt: 1 }` TTL, `expireAfterSeconds: 34560000` (400 days)

## Orders

- The date-range picker filters by when the order was placed, in IST. The
  figures strip (orders, items, sales, to fulfil, fulfilled, delivered)
  follows the range, so Today and Last 7 days visibly differ.
- Tabs: All, Unfulfilled, Unpaid, In transit, Delivered, Cancelled & failed.
- **Export** downloads exactly what the table shows (range + tab + search)
  as CSV, with line items, amounts and address.

## Products and inventory

- Inventory is part of the product. Adding a product sets its SKU (typed or
  generated), quantity, low-stock alert and backorder rule. Editing the
  quantity on a product logs an adjustment in stock history, so there is no
  separate inventory step.
- Each product has a search engine listing (SEO title and meta description).
- **Import** (`/products/import`): one CSV for products and their stock.
  Download the sample, fill one row per product (SKU, title, category, price,
  quantity, description, up to four images, SEO title/description, GST, HSN,
  weight…), and upload it with the photos it names. Image cells take a URL or
  the file name of a photo picked alongside the CSV. The preview flags every
  problem before anything is written. Rows with an existing SKU update that
  product (only the filled-in columns change, and `Quantity` becomes the new
  stock). Batches of 100–150 products are the expected size; up to 1,000 rows
  per file.
- **Export** writes the same columns, so the catalogue can be exported,
  edited in a spreadsheet and imported back.
