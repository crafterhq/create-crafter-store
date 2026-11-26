import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getStore } from '@/lib/catalog';
import { formatMoney } from '@/lib/money';
import { AddToCart } from '@/components/add-to-cart';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct((await params).id);
  return product ? { title: product.name, openGraph: { images: product.image ? [product.image] : [] } } : {};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [store, product] = await Promise.all([getStore(), getProduct(id)]);
  if (!product) notFound();

  return (
    <article className="product">
      <div className="product-media">
        <div className="product-image">
          {product.image ? <img src={product.image} alt={product.name} /> : <span aria-hidden="true" />}
        </div>
        {product.images.length > 1 ? (
          <ul className="thumbs">
            {product.images.slice(1, 5).map((src) => (
              <li key={src}>
                <img src={src} alt="" loading="lazy" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="product-info">
        <Link href="/" className="muted small">
          ← All products
        </Link>
        <h1>{product.name}</h1>
        <p className="price large">
          {formatMoney(product.unitPrice, store.currency)}
          {product.unitPrice < product.price ? <s className="muted">{formatMoney(product.price, store.currency)}</s> : null}
        </p>
        <AddToCart
          product={{ id: product.id, name: product.name, unitPrice: product.unitPrice, image: product.image }}
          stock={product.stock}
        />
        {product.descriptionHtml ? (
          // HTML produced by the Crafter SDK from the product's rich text description
          <div className="prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        ) : null}
      </div>
    </article>
  );
}
