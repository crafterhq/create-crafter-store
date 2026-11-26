'use client';

import type { ReactNode } from 'react';
import { CrafterPaymentsProvider } from '@crafterpayments/react';
import { CartProvider } from './cart';
import { StoreProvider } from './store-context';

interface ProvidersProps {
  publishableKey: string;
  environment: 'production' | 'development';
  store: { name: string; currency: string };
  children: ReactNode;
}

export function Providers({ publishableKey, environment, store, children }: ProvidersProps) {
  return (
    <CrafterPaymentsProvider
      publishableKey={publishableKey}
      options={{ environment, locale: 'en', appearance: { theme: 'auto' } }}
    >
      <StoreProvider value={store}>
        <CartProvider>{children}</CartProvider>
      </StoreProvider>
    </CrafterPaymentsProvider>
  );
}
