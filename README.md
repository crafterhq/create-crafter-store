# create-crafter-store

Create a Next.js storefront for your headless [Crafter](https://crafter.net.tr) store in one command:

```bash
npx create-crafter-store my-store
```

You get a small, readable Next.js (App Router, TypeScript) app with:

- **Product list and product pages** from your store's public catalog, with category filters
- **Cart** in the browser (`localStorage`) with quantities, prices shown in your store currency
- **Checkout** with CrafterPayments: a server route creates the checkout session with your secret key, the browser
  opens it with `<CheckoutButton>` (popup on desktop, same-tab redirect on phones)
- **Return pages**: `/success` (signed return verified on the server, order read with the secret key) and `/cancel`
- **Webhook route** with signature verification on the raw body
- Plain CSS with light and dark mode, no UI kit to fight

> Status: Preview (0.1.0). `@crafterpayments/node` and `@crafterpayments/react` are not on npm yet. Until they are
> published, install them from the [crafterpayments](https://github.com/crafterhq/crafterpayments) repository as
> described in [Installing the preview packages](#installing-the-preview-packages).

## Quick start

```bash
npx create-crafter-store my-store
cd my-store
cp .env.example .env.local   # fill in the values below
npm install
npm run dev
```

The CLI only copies the bundled template; it does not download anything else. Pass `--force` to write into a
directory that is not empty.

## Configuration

All values come from the Crafter dashboard (**Headless and API**). Put them in `.env.local` for local development and
in your host's environment settings in production.

| Variable | Where it is used | |
|---|---|---|
| `CRAFTER_STORE_ID` | server | Your store id. Used to read products, categories and the store currency. |
| `CRAFTER_ENV` | server | `production` (default) or `development`. Picks the Crafter API hosts. |
| `NEXT_PUBLIC_CRAFTER_PUBLISHABLE_KEY` | browser | `cp_pk_test_…` / `cp_pk_live_…`. Safe to expose. |
| `CRAFTER_SECRET_KEY` | server | `cp_sk_test_…` / `cp_sk_live_…`. Never prefix it with `NEXT_PUBLIC_`. |
| `CRAFTER_RETURN_SECRET` | server | `crs_…`. Verifies the signed return (`cp_sig`) on `/success`. |
| `CRAFTER_WEBHOOK_SECRET` | server | `whsec_…`, shown when you add the webhook endpoint. |
| `APP_URL` | server | Optional. Public URL of the site, used for return URLs. Defaults to the request origin. |
| `CRAFTER_STORE_API_URL` | server | Optional. Overrides the catalog API base URL. |

In the dashboard, also:

1. Add your site origin (for example `https://shop.example.com`, and `http://localhost:3000` for development) to the
   store's **allowed origins**. Return URLs are checked against this list.
2. Add a webhook endpoint `https://<your-site>/api/webhooks/crafter` and copy its secret into `CRAFTER_WEBHOOK_SECRET`.

## How it works

```
Browser                         Your Next.js server                    Crafter
───────                         ───────────────────                    ───────
product list / product page  ←  catalog via @crafter-cms/sdk        ←  public store catalog
cart (localStorage)
<CheckoutButton> click  ─────→  POST /api/checkout
                                checkoutSessions.create()  ─────────→  session (prices from the catalog)
popup / redirect  ←──────────── { sessionId, clientSecret, url }
pay on the CrafterPayments page ───────────────────────────────────→  payment
/success?session_id&cp_sig  ──→ verifyReturnSignature + retrieve()  ←  session status
                                POST /api/webhooks/crafter  ←───────  checkout.completed (signed)
```

- **Prices always come from your catalog.** The browser sends only product ids and quantities; the cart's prices are
  for display. Product discounts are shown; coupons, bulk discounts and tax are applied on the payment page.
- **Fulfil on the webhook**, not on the success page. Crafter already delivers the products (in-game, Discord,
  digital); use `checkout.completed` for anything extra, such as your own records or emails. Deliveries are retried
  with the same `event.id`, so deduplicate on it.
- **The success page** reads the session with your secret key, so the status it shows is trustworthy. A valid
  `cp_sig` only proves the buyer was sent there by Crafter.
- **Popups:** on desktop checkout opens in a popup. When it finishes, `/success` (inside the popup) hands the result to
  your tab with `useCheckoutReturn()` and closes itself; your tab then shows the order. If the browser blocks the
  popup, checkout continues in the same tab.

### Project layout

```
src/
  app/
    page.tsx                     product list with category filter
    products/[id]/page.tsx       product page (add to cart, buy now)
    cart/page.tsx                cart
    success/page.tsx             order status after checkout
    cancel/page.tsx              checkout canceled
    api/checkout/route.ts        creates the checkout session (secret key)
    api/webhooks/crafter/route.ts webhook handler (raw body, signature check)
  components/                    cart state, checkout button, UI pieces
  lib/
    catalog.ts                   store, products, categories (server only)
    payments.ts                  CrafterPayments server client
```

To change the checkout window, pass `mode` (`auto`, `popup`, `redirect`) to `<CheckoutButton>` in
`src/components/checkout-button.tsx`. Embedded checkout (`mode="modal"` or `<EmbeddedCheckout>`) is available on Pro
plans and above and needs `uiMode: 'embedded'` in `api/checkout/route.ts`.

## Test mode

Use test keys (`cp_pk_test_…` in the browser, `cp_sk_test_…` on the server) while you build. Test sessions
(`cs_test_…`) never move money and their webhooks have `livemode: false`. On the payment page, pay with the test card
**4242 4242 4242 4242**, any future expiry date and any CVC. Switch both keys to `cp_pk_live_…` / `cp_sk_live_…` to go
live; test and live keys cannot be mixed.

## Deploy

### Vercel

1. Push your project to a Git repository and import it in Vercel (framework preset: Next.js).
2. Add the environment variables from `.env.example` in **Project Settings → Environment Variables**.
3. Deploy, then add the production origin to the store's allowed origins and point the webhook endpoint at
   `https://<your-domain>/api/webhooks/crafter`.

### Any Node.js host

Node.js 20.9 or newer is required.

```bash
npm ci
npm run build
npm start            # listens on PORT (default 3000)
```

Set the environment variables in your host or process manager, and put the app behind HTTPS (a reverse proxy such as
Nginx or Caddy works well). Set `APP_URL` to the public URL if the proxy does not forward the original host.

## Installing the preview packages

Until `@crafterpayments/node`, `@crafterpayments/react` and `@crafterpayments/js` are published to npm, build them from
the repository and install the tarballs:

```bash
git clone https://github.com/crafterhq/crafterpayments.git
cd crafterpayments
npm install && npm run build
for p in js react node; do (cd packages/$p && npm pack --pack-destination ../../tarballs); done

cd ../my-store
npm install ../crafterpayments/tarballs/crafterpayments-js-0.1.0.tgz \
  ../crafterpayments/tarballs/crafterpayments-react-0.1.0.tgz \
  ../crafterpayments/tarballs/crafterpayments-node-0.1.0.tgz
```

This points the three dependencies at the local files. Once the packages are on npm, set them back to `^0.1.0` in
`package.json` and run `npm install` again.

## Developing this repository

```bash
npm test             # CLI tests
cd template && npm install   # see "Installing the preview packages"
npm run build        # from the repository root: next build of the template
npm run lint
npm run typecheck
```

## Security

Report vulnerabilities to support@crafterpayments.com. Never commit `.env.local` or a secret key; if a secret key
leaks, roll it in the dashboard right away.

## License

[MIT](LICENSE) © Crafter Technologies LLC
