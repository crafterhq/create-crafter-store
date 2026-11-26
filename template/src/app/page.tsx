import Link from 'next/link';
import { getCategories, getProducts, getStore } from '@/lib/catalog';
import { formatMoney } from '@/lib/money';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const [store, categories, products] = await Promise.all([getStore(), getCategories(), getProducts(category)]);

  return (
    <>
      <section className="hero">
        <h1>{store.name}</h1>
        {store.description ? <p className="muted">{store.description}</p> : null}
      </section>

      {categories.length > 0 ? (
        <nav className="categories" aria-label="Categories">
          <Link href="/" className={!category ? 'chip active' : 'chip'} aria-current={!category ? 'page' : undefined}>
            All
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/?category=${encodeURIComponent(item.id)}`}
              className={category === item.id ? 'chip active' : 'chip'}
              aria-current={category === item.id ? 'page' : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {products.length === 0 ? (
        <p className="muted">No products yet.</p>
      ) : (
        <ul className="grid">
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/products/${encodeURIComponent(product.id)}`} className="card">
                <div className="card-media">
                  {product.image ? <img src={product.image} alt="" loading="lazy" /> : <span aria-hidden="true" />}
                </div>
                <div className="card-body">
                  <span className="card-title">{product.name}</span>
                  <span className="price">
                    {formatMoney(product.unitPrice, store.currency)}
                    {product.unitPrice < product.price ? (
                      <s className="muted">{formatMoney(product.price, store.currency)}</s>
                    ) : null}
                  </span>
                  {product.stock === 0 ? <span className="muted small">Out of stock</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
