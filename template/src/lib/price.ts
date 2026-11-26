/**
 * Display price after the product discount, the same rule the checkout uses for catalog prices.
 * Coupons, bulk discounts and tax are applied by CrafterPayments at checkout, so the charged
 * amount can differ: never send prices to the server, only product ids and quantities.
 */
export function unitPrice(product: { price: unknown; discountType?: unknown; discountValue?: unknown }): number {
  const price = Number(product.price) || 0;
  const value = product.discountValue != null ? Number(product.discountValue) : NaN;
  if (!product.discountType || !Number.isFinite(value) || value <= 0) return price;
  if (product.discountType === 'percentage') return Math.max(0, price - (price * value) / 100);
  if (product.discountType === 'fixed') return Math.max(0, price - value);
  return price;
}
