export const MAX_LINES = 50;
export const MAX_QUANTITY = 99;

/** What the browser stores. Name, price and image are for display only; checkout sends id + quantity. */
export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  image: string | null;
  quantity: number;
}

export interface CheckoutRequestBody {
  items: Array<{ productId: string; quantity: number }>;
  /** `cart` checkouts empty the cart after payment; `buy_now` leaves it alone */
  source?: 'cart' | 'buy_now';
}
