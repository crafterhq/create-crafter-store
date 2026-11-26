import 'server-only';

import { cache } from 'react';
import { Crafter, CrafterError, lexicalToHtml, type Category, type Product, type WebsiteInfo } from '@crafter-cms/sdk';
import { crafterEnvironment, optionalEnv, requireEnv } from './env';
import { unitPrice } from './price';

/**
 * Catalog reads go through the official Crafter SDK in direct (headless) mode. These are the store's public
 * storefront endpoints: GET /website/:storeId, /website/:storeId/products and /website/:storeId/categories.
 * No API key is needed; hidden products are never returned to anonymous requests.
 */
const API_BASES = {
  production: 'https://api.crafter.net.tr',
  development: 'https://dev-api.crafter.net.tr',
} as const;

function client(): Crafter {
  return new Crafter({
    mode: 'direct',
    websiteId: requireEnv('CRAFTER_STORE_ID'),
    apiBase: optionalEnv('CRAFTER_STORE_API_URL') ?? API_BASES[crafterEnvironment()],
  });
}

/** Some endpoints wrap their payload in `{ data }`; accept both shapes. */
function unwrap<T>(value: unknown): T {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'data' in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export interface StoreInfo {
  id: string;
  name: string;
  /** ISO 4217 code of the catalog prices */
  currency: string;
  description: string | null;
  image: string | null;
}

export interface CatalogProduct {
  id: string;
  name: string;
  categoryId: string | null;
  /** Catalog price before the product discount */
  price: number;
  /** Price after the product discount; the final amount (coupon, tax) is calculated at checkout */
  unitPrice: number;
  image: string | null;
  images: string[];
  /** -1 means unlimited */
  stock: number;
  descriptionHtml: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
}

export const getStore = cache(async (): Promise<StoreInfo> => {
  const info = unwrap<WebsiteInfo>(await client().website.getInfo());
  return {
    id: info.id,
    name: info.name || 'Store',
    currency: (info.currency || 'USD').toUpperCase(),
    description: typeof info.description === 'string' ? info.description : null,
    image: typeof info.image === 'string' && info.image ? info.image : null,
  };
});

/** Only http(s), mailto, relative and anchor URLs survive in links and images from rich text. */
function safeUrls(html: string): string {
  return html.replace(/\b(href|src)="([^"]*)"/gi, (match, attr: string, url: string) => {
    // Browsers ignore tabs, newlines and control characters inside a URL scheme
    const value = url.replace(/&amp;/g, '&').replace(/[\u0000-\u0020]/g, '').toLowerCase();
    const safe = /^(https?:|mailto:|\/|#)/.test(value) || !/^[a-z][a-z0-9+.-]*:/.test(value);
    return safe ? match : `${attr}="#"`;
  });
}

function toHtml(description: Product['description']): string {
  return safeUrls(rawHtml(description));
}

function rawHtml(description: Product['description']): string {
  if (!description) return '';
  if (typeof description === 'string') {
    try {
      // Descriptions are stored as Lexical JSON; plain strings are rendered as text
      return lexicalToHtml(JSON.parse(description));
    } catch {
      return description
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }
  }
  return lexicalToHtml(description);
}

function toProduct(product: Product): CatalogProduct {
  const images = Array.isArray(product.images) ? product.images.filter((src) => typeof src === 'string' && src) : [];
  const stock = Number(product.stock);
  return {
    id: product.id,
    name: product.name,
    categoryId: product.category || null,
    price: Number(product.price) || 0,
    unitPrice: unitPrice(product),
    image: images[0] ?? null,
    images,
    stock: Number.isFinite(stock) ? stock : -1,
    descriptionHtml: toHtml(product.description),
  };
}

export const getProducts = cache(async (categoryId?: string): Promise<CatalogProduct[]> => {
  const products = unwrap<Product[]>(
    await client().store.getProducts(categoryId ? { category: categoryId } : undefined),
  );
  return (Array.isArray(products) ? products : []).map(toProduct);
});

export const getProduct = cache(async (productId: string): Promise<CatalogProduct | null> => {
  try {
    return toProduct(unwrap<Product>(await client().store.getProduct(productId)));
  } catch (error) {
    if (error instanceof CrafterError && (error.statusCode === 404 || error.statusCode === 400)) return null;
    throw error;
  }
});

export const getCategories = cache(async (): Promise<CatalogCategory[]> => {
  const categories = unwrap<Category[]>(await client().store.getCategories());
  return (Array.isArray(categories) ? categories : []).map((category) => ({
    id: category.id,
    name: category.name,
  }));
});
