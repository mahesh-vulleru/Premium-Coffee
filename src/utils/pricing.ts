import type { CartItem } from '../types/coffee';

export const BAG_SIZE_MULTIPLIERS: Record<CartItem['size'], number> = {
  '250g': 1.0,
  '500g': 1.85,
  '1kg': 3.4,
};

export const FREE_SHIPPING_THRESHOLD = 75;
export const STANDARD_SHIPPING_FEE = 9;
export const SUBSCRIPTION_DISCOUNT_PERCENT = 15;

/**
 * Calculates unit price for a given coffee product and bag size.
 * Uses consistent integer rounding policy across product cards, modals, and cart.
 */
export function calculateProductPrice(basePrice: number, size: CartItem['size'] = '250g'): number {
  const multiplier = BAG_SIZE_MULTIPLIERS[size] ?? 1.0;
  return Math.round(basePrice * multiplier);
}

/**
 * Calculates unit price with original price comparison for discounts.
 */
export function calculateOriginalProductPrice(
  originalPrice: number | undefined,
  size: CartItem['size'] = '250g'
): number | null {
  if (!originalPrice) return null;
  const multiplier = BAG_SIZE_MULTIPLIERS[size] ?? 1.0;
  return Math.round(originalPrice * multiplier);
}

/**
 * Formats a numeric price into standard USD currency string ($XX.XX or $XX).
 */
export function formatCurrency(amount: number, forceDecimals = false): string {
  if (forceDecimals || amount % 1 !== 0) {
    return `$${amount.toFixed(2)}`;
  }
  return `$${amount}`;
}

export interface CartCalculationResult {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  finalTotal: number;
  freeShippingQualified: boolean;
  amountNeededForFreeShipping: number;
}

/**
 * Unified cart and checkout calculation used across CartContext and CartDrawer.
 */
export function calculateCartSummary(
  items: CartItem[],
  discountPercent = 0
): CartCalculationResult {
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = calculateProductPrice(item.product.price, item.size);
    return sum + unitPrice * item.quantity;
  }, 0);

  const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const freeShippingQualified = subtotal >= FREE_SHIPPING_THRESHOLD && subtotal > 0;
  const shippingAmount = subtotal === 0 || freeShippingQualified ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingAmount);
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return {
    subtotal,
    discountAmount,
    shippingAmount,
    finalTotal,
    freeShippingQualified,
    amountNeededForFreeShipping,
  };
}
