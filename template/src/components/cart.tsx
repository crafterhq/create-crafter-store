'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MAX_LINES, MAX_QUANTITY, type CartLine } from '@/lib/cart-types';

const STORAGE_KEY = 'crafter-store:cart';

interface CartContextValue {
  lines: CartLine[];
  /** false until the cart was read from localStorage (always false on the server) */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)));
}

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line): line is CartLine =>
          !!line && typeof line.productId === 'string' && typeof line.name === 'string' && typeof line.quantity === 'number',
      )
      .map((line) => ({
        productId: line.productId,
        name: line.name,
        unitPrice: Number(line.unitPrice) || 0,
        image: typeof line.image === 'string' ? line.image : null,
        quantity: clampQuantity(line.quantity),
      }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

function writeStorage(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage can be full or blocked (private mode); the cart still works for this page view
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage only exists in the browser, so the cart is loaded after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(readStorage());
    setReady(true);
    // Keep several tabs in sync
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: (current: CartLine[]) => CartLine[]) => {
    setLines((current) => {
      const result = next(current);
      writeStorage(result);
      return result;
    });
  }, []);

  const actions = useMemo(
    () => ({
      add: (line: Omit<CartLine, 'quantity'>, quantity = 1) =>
        update((current) => {
          const existing = current.find((item) => item.productId === line.productId);
          if (existing) {
            return current.map((item) =>
              item.productId === line.productId
                ? { ...item, ...line, quantity: clampQuantity(item.quantity + quantity) }
                : item,
            );
          }
          if (current.length >= MAX_LINES) return current;
          return [...current, { ...line, quantity: clampQuantity(quantity) }];
        }),
      setQuantity: (productId: string, quantity: number) =>
        update((current) =>
          current.map((item) => (item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item)),
        ),
      remove: (productId: string) => update((current) => current.filter((item) => item.productId !== productId)),
      clear: () => update(() => []),
    }),
    [update],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
      ...actions,
    }),
    [lines, ready, actions],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
