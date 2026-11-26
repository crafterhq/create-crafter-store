'use client';

import Link from 'next/link';
import { useCart } from './cart';
import { useMoney } from './store-context';
import { QuantityInput } from './quantity-input';
import { StoreCheckoutButton } from './checkout-button';

export function CartView() {
  const cart = useCart();
  const money = useMoney();

  if (!cart.ready) {
    return <p className="muted">Loading your cart…</p>;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/" className="button">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <ul className="cart-lines">
        {cart.lines.map((line) => (
          <li key={line.productId} className="cart-line">
            <Link href={`/products/${encodeURIComponent(line.productId)}`} className="cart-thumb">
              {line.image ? <img src={line.image} alt="" /> : <span aria-hidden="true" />}
            </Link>
            <div className="cart-line-info">
              <Link href={`/products/${encodeURIComponent(line.productId)}`} className="cart-line-name">
                {line.name}
              </Link>
              <span className="muted small">{money(line.unitPrice)} each</span>
            </div>
            <QuantityInput
              value={line.quantity}
              onChange={(quantity) => cart.setQuantity(line.productId, quantity)}
              label={`Quantity of ${line.name}`}
            />
            <span className="cart-line-total">{money(line.unitPrice * line.quantity)}</span>
            <button type="button" className="link-button" onClick={() => cart.remove(line.productId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <aside className="summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{money(cart.subtotal)}</strong>
        </div>
        <p className="muted small">Taxes and coupons are calculated at checkout.</p>
        <StoreCheckoutButton
          items={cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))}
          clearCartOnComplete
        >
          Checkout
        </StoreCheckoutButton>
      </aside>
    </div>
  );
}
