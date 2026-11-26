'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutButton } from '@crafterpayments/react';
import type { CheckoutRequestBody } from '@/lib/cart-types';
import { useCart } from './cart';

interface StoreCheckoutButtonProps {
  items: CheckoutRequestBody['items'];
  /** Empty the cart after a successful payment (true for the cart page) */
  clearCartOnComplete?: boolean;
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

/**
 * Creates the session on our server (/api/checkout, secret key stays there) and opens CrafterPayments checkout:
 * a popup on desktop, a same-tab redirect on phones. Only product ids and quantities are sent.
 */
export function StoreCheckoutButton({ items, clearCartOnComplete = false, variant = 'primary', children }: StoreCheckoutButtonProps) {
  const router = useRouter();
  const cart = useCart();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <CheckoutButton
        className={variant === 'primary' ? 'button' : 'button secondary'}
        disabled={items.length === 0}
        createSession={async () => {
          setError(null);
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, source: clearCartOnComplete ? 'cart' : 'buy_now' } satisfies CheckoutRequestBody),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? 'Could not start checkout. Please try again.');
          return data; // { sessionId, clientSecret, url }
        }}
        onComplete={(result) => {
          // A browser event is a hint for the screen only; orders are fulfilled from the webhook
          if (clearCartOnComplete) cart.clear();
          router.push(`/success?session_id=${encodeURIComponent(result.sessionId)}`);
        }}
        onExpired={() => setError('The checkout session expired. Please try again.')}
        onError={(err) => setError(err.message || 'Something went wrong. Please try again.')}
      >
        {children}
      </CheckoutButton>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
