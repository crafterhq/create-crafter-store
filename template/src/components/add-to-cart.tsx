'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MAX_QUANTITY } from '@/lib/cart-types';
import { useCart } from './cart';
import { QuantityInput } from './quantity-input';
import { StoreCheckoutButton } from './checkout-button';

interface AddToCartProps {
  product: { id: string; name: string; unitPrice: number; image: string | null };
  /** -1 means unlimited */
  stock: number;
}

export function AddToCart({ product, stock }: AddToCartProps) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const max = stock > 0 ? Math.min(stock, MAX_QUANTITY) : MAX_QUANTITY;

  if (stock === 0) {
    return <p className="muted">Out of stock</p>;
  }

  return (
    <div className="buy-box">
      <QuantityInput value={quantity} max={max} onChange={setQuantity} label={`Quantity of ${product.name}`} />
      <div className="buy-actions">
        <button
          type="button"
          className="button"
          onClick={() => {
            cart.add({ productId: product.id, name: product.name, unitPrice: product.unitPrice, image: product.image }, quantity);
            setAdded(true);
          }}
        >
          Add to cart
        </button>
        <StoreCheckoutButton items={[{ productId: product.id, quantity }]} variant="secondary">
          Buy now
        </StoreCheckoutButton>
      </div>
      <p className="muted small" role="status">
        {added ? (
          <>
            Added to your cart. <Link href="/cart">View cart</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
