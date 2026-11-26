import type { Metadata } from 'next';
import Link from 'next/link';
import { ReturnHandler } from '@/components/return-handler';

export const metadata: Metadata = { title: 'Checkout canceled', robots: { index: false } };

export default function CancelPage() {
  return (
    <section className="status-page">
      <ReturnHandler />
      <h1>Checkout canceled</h1>
      <p>No payment was made. Your cart is still saved.</p>
      <div className="actions">
        <Link href="/cart" className="button">
          Back to cart
        </Link>
        <Link href="/" className="button secondary">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
