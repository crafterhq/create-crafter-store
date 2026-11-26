import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyReturnSignature, type CheckoutSession } from '@crafterpayments/node';
import { optionalEnv } from '@/lib/env';
import { formatMoney } from '@/lib/money';
import { payments } from '@/lib/payments';
import { ReturnHandler } from '@/components/return-handler';

export const metadata: Metadata = { title: 'Order status', robots: { index: false } };

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{22,40}$/;

interface SuccessProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export default async function SuccessPage({ searchParams }: SuccessProps) {
  const params = toSearchParams(await searchParams);
  const sessionId = params.get('session_id') ?? '';

  // After a same-tab redirect the URL carries a signed result (cp_sig). It proves the buyer was sent here by
  // Crafter; it is NOT proof of payment. The popup flow lands here without a signature, from our own tab.
  let signature: 'valid' | 'invalid' | 'absent' = 'absent';
  if (params.has('cp_sig')) {
    const secret = optionalEnv('CRAFTER_RETURN_SECRET');
    const verified = secret ? verifyReturnSignature(params, secret) : null;
    signature = verified && verified.sessionId === sessionId ? 'valid' : 'invalid';
  }

  // The source of truth is the session read with the secret key (and the checkout.completed webhook)
  let session: CheckoutSession | null = null;
  if (SESSION_ID.test(sessionId) && signature !== 'invalid') {
    try {
      session = await payments().checkoutSessions.retrieve(sessionId);
    } catch (error) {
      console.error('Could not retrieve the checkout session', error);
    }
  }

  const complete = session?.status === 'complete';
  const processing = session?.status === 'processing';

  return (
    <section className="status-page">
      <ReturnHandler clearCart={(complete || processing) && session?.metadata?.source === 'cart'} />
      {complete ? (
        <>
          <h1>Thank you!</h1>
          <p>Your payment was received and your order is on its way.</p>
        </>
      ) : processing ? (
        <>
          <h1>Payment processing</h1>
          <p>Your payment is being confirmed. We will deliver your order as soon as it clears.</p>
        </>
      ) : session ? (
        <>
          <h1>Payment not completed</h1>
          <p>This checkout was not paid. Your cart is still saved.</p>
        </>
      ) : (
        <>
          <h1>Order status unavailable</h1>
          <p>We could not confirm this checkout. If you paid, you will receive a confirmation email.</p>
        </>
      )}

      {session && (complete || processing) ? (
        <div className="summary">
          <ul className="receipt">
            {session.lineItems.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{formatMoney(item.unitAmount * item.quantity, item.currency)}</span>
              </li>
            ))}
          </ul>
          {session.amountTotal != null && session.currency ? (
            <div className="summary-row">
              <span>Total paid</span>
              <strong>{formatMoney(session.amountTotal, session.currency)}</strong>
            </div>
          ) : null}
          {session.orderId ? <p className="muted small">Order {session.orderId}</p> : null}
          {!session.livemode ? <p className="muted small">Test mode: no real money was charged.</p> : null}
        </div>
      ) : null}

      <div className="actions">
        <Link href="/" className="button">
          Continue shopping
        </Link>
        {!complete && !processing ? (
          <Link href="/cart" className="button secondary">
            Back to cart
          </Link>
        ) : null}
      </div>
    </section>
  );
}
