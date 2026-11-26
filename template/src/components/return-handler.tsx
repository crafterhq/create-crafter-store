'use client';

import { useEffect } from 'react';
import { useCheckoutReturn } from '@crafterpayments/react';
import { useCart } from './cart';

/**
 * Runs on /success and /cancel. When checkout ran in a popup, it hands the result to the original tab (which
 * continues there) and closes the popup. After a same-tab redirect it simply stays on this page.
 */
export function ReturnHandler({ clearCart = false }: { clearCart?: boolean }) {
  const { result, loading } = useCheckoutReturn();
  const { clear } = useCart();

  useEffect(() => {
    if (clearCart) clear();
  }, [clearCart, clear]);

  if (!loading && result?.openedByCheckout) {
    return <p className="muted small">You can close this window.</p>;
  }
  return null;
}
