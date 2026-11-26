# Crafter store

A Next.js storefront for a headless Crafter store, created with
[create-crafter-store](https://github.com/crafterhq/create-crafter-store).

```bash
cp .env.example .env.local   # store id and API keys from the dashboard (Headless and API)
npm install
npm run dev                  # http://localhost:3000
```

- Use test keys (`cp_pk_test_…`, `cp_sk_test_…`) and the card **4242 4242 4242 4242** while you build.
- Add your site origin to the store's allowed origins, and `https://<your-site>/api/webhooks/crafter` as a webhook
  endpoint.
- Prices always come from the catalog: checkout sends only product ids and quantities.
- Fulfil extra work on the `checkout.completed` webhook (`src/app/api/webhooks/crafter/route.ts`), not on the success
  page.

Configuration, the checkout flow and deploy steps (Vercel or any Node.js host) are documented in the
[create-crafter-store README](https://github.com/crafterhq/create-crafter-store#readme).
