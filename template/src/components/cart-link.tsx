'use client';

import Link from 'next/link';
import { useCart } from './cart';

export function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="cart-link" aria-label={ready ? `Cart, ${count} items` : 'Cart'}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 7h12l-1.2 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" strokeLinejoin="round" />
        <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
      </svg>
      <span>Cart</span>
      {ready && count > 0 ? <span className="badge">{count}</span> : null}
    </Link>
  );
}
