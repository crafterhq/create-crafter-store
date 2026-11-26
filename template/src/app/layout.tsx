import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { getStore, type StoreInfo } from '@/lib/catalog';
import { crafterEnvironment, missingEnv } from '@/lib/env';
import { Providers } from '@/components/providers';
import { CartLink } from '@/components/cart-link';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  try {
    const store = await getStore();
    return { title: { default: store.name, template: `%s · ${store.name}` }, description: store.description ?? undefined };
  } catch {
    return { title: 'Crafter store' };
  }
}

function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="container notice">
      <h1>Almost there</h1>
      <p>Add these variables to <code>.env.local</code> (see <code>.env.example</code>) and restart the server:</p>
      <ul>
        {missing.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Prices and stock change, so pages are rendered per request instead of at build time
  await connection();

  const missing = missingEnv();
  let store: StoreInfo | null = null;
  let loadError = false;
  if (missing.length === 0) {
    try {
      store = await getStore();
    } catch (error) {
      console.error('Could not load the store', error);
      loadError = true;
    }
  }

  return (
    <html lang="en">
      <body>
        {missing.length > 0 ? (
          <SetupNotice missing={missing} />
        ) : !store || loadError ? (
          <main className="container notice">
            <h1>Store unavailable</h1>
            <p>The store could not be loaded. Check <code>CRAFTER_STORE_ID</code> and <code>CRAFTER_ENV</code>, then reload.</p>
          </main>
        ) : (
          <Providers
            publishableKey={process.env.NEXT_PUBLIC_CRAFTER_PUBLISHABLE_KEY!}
            environment={crafterEnvironment()}
            store={{ name: store.name, currency: store.currency }}
          >
            <header className="site-header">
              <div className="container header-inner">
                <Link href="/" className="brand">
                  {store.image ? <img src={store.image} alt="" width={28} height={28} /> : null}
                  <span>{store.name}</span>
                </Link>
                <nav aria-label="Main">
                  <CartLink />
                </nav>
              </div>
            </header>
            <main className="container page">{children}</main>
            <footer className="site-footer">
              <div className="container">
                <span className="muted small">Payments by CrafterPayments</span>
              </div>
            </footer>
          </Providers>
        )}
      </body>
    </html>
  );
}
