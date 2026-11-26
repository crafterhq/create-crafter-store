'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { formatMoney } from '@/lib/money';

interface StoreContextValue {
  name: string;
  currency: string;
}

const StoreContext = createContext<StoreContextValue>({ name: 'Store', currency: 'USD' });

export function StoreProvider({ value, children }: { value: StoreContextValue; children: ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}

/** Formats an amount in the store currency */
export function useMoney(): (amount: number) => string {
  const { currency } = useStore();
  return (amount) => formatMoney(amount, currency);
}
