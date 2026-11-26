'use client';

import { MAX_QUANTITY } from '@/lib/cart-types';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label: string;
}

export function QuantityInput({ value, onChange, max = MAX_QUANTITY, label }: QuantityInputProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(1, Math.floor(next) || 1)));
  return (
    <div className="quantity" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        aria-label="Quantity"
        onChange={(event) => set(Number(event.target.value))}
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
