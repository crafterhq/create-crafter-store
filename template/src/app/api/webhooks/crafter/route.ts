import { CrafterPayments, type WebhookEvent } from '@crafterpayments/node';
import { optionalEnv } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Webhook endpoint: add https://<your-site>/api/webhooks/crafter in the dashboard and put its
 * secret (whsec_...) in CRAFTER_WEBHOOK_SECRET. This is where you fulfil orders, not on the success page.
 */
export async function POST(request: Request) {
  const secret = optionalEnv('CRAFTER_WEBHOOK_SECRET');
  if (!secret) {
    console.error('CRAFTER_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // The signature covers the exact bytes: read the raw body, never a parsed and re-serialized object
  const body = await request.text();
  let event: WebhookEvent;
  try {
    event = CrafterPayments.webhooks.constructEvent(body, request.headers.get('x-crafter-signature'), secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  // Deliveries are retried with the same event.id: store processed ids and skip duplicates.
  switch (event.event) {
    case 'checkout.completed': {
      const { checkoutSession, orderId, amount, currency } = event.data;
      console.log(`Checkout ${checkoutSession.id} completed: order ${orderId}, ${amount} ${currency}`);
      // Crafter delivers the products itself (in-game, Discord, digital). Add your own logic here,
      // e.g. send a receipt or record the order in your database.
      break;
    }
    case 'checkout.expired':
      console.log(`Checkout ${event.data.checkoutSession.id} expired`);
      break;
    default:
      console.log(`Unhandled webhook event ${event.event}`);
  }

  // Respond quickly with 2xx; do slow work in a queue or background job
  return new Response(null, { status: 200 });
}
