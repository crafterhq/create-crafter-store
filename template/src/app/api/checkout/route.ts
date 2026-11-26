import { CrafterPaymentsError } from '@crafterpayments/node';
import { MAX_LINES, MAX_QUANTITY, type CheckoutRequestBody } from '@/lib/cart-types';
import { optionalEnv } from '@/lib/env';
import { payments } from '@/lib/payments';

export const runtime = 'nodejs';

const PRODUCT_ID = /^[A-Za-z0-9_-]{1,64}$/;

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Validates the cart and merges duplicate lines. Only ids and quantities: prices come from the catalog. */
function parseItems(body: unknown): CheckoutRequestBody['items'] | null {
  const items = (body as Partial<CheckoutRequestBody> | null)?.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const merged = new Map<string, number>();
  for (const item of items) {
    const productId = item?.productId;
    const quantity = item?.quantity;
    if (typeof productId !== 'string' || !PRODUCT_ID.test(productId)) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
    merged.set(productId, Math.min(MAX_QUANTITY, (merged.get(productId) ?? 0) + quantity));
  }
  if (merged.size > MAX_LINES) return null;
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON body.');
  }
  const items = parseItems(body);
  if (!items) return bad('The cart is empty or invalid.');
  const source = (body as Partial<CheckoutRequestBody>).source === 'cart' ? 'cart' : 'buy_now';

  // Return URLs must be in the store's allowed origins (dashboard -> Headless and API)
  const origin = (optionalEnv('APP_URL') ?? new URL(request.url).origin).replace(/\/+$/, '');

  try {
    const session = await payments().checkoutSessions.create({
      lineItems: items,
      uiMode: 'hosted',
      locale: 'en',
      successUrl: `${origin}/success`,
      cancelUrl: `${origin}/cancel`,
      // Echoed back on the session and in webhooks; the success page uses it to decide whether to empty the cart
      metadata: { source },
    });
    // Only these fields go to the browser
    return Response.json({ sessionId: session.id, clientSecret: session.clientSecret, url: session.url });
  } catch (error) {
    if (error instanceof CrafterPaymentsError) {
      console.error(`Checkout session failed: ${error.type} (request ${error.requestId ?? 'n/a'})`);
      if (error.status === 400 || error.status === 409 || error.status === 422) {
        // e.g. checkout_line_items_invalid: a product was removed, hidden or is out of stock
        return bad('Some items in your cart are no longer available. Please review your cart.', 409);
      }
    } else {
      console.error('Checkout session failed', error);
    }
    return bad('Checkout is unavailable right now. Please try again.', 502);
  }
}
