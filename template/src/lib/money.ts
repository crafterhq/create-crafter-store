/** Formats an amount in the store currency, e.g. `$12.50` or `€12,50` depending on the locale. */
export function formatMoney(amount: number, currency: string, locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
