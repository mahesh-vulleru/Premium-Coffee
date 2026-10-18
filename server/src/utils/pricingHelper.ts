export interface EffectivePriceResult {
  regularPrice: number;
  effectivePrice: number;
  isSale: boolean;
  salePrice?: number;
  promotionActive: boolean;
}

/**
 * Authoritatively calculates the effective retail price for a product.
 * Sale price is applied ONLY IF:
 * 1. promotionPrice is set, positive, and strictly less than regular price.
 * 2. Current date falls within [promotionStartDate, promotionEndDate] (if configured).
 */
export function getEffectiveProductPrice(product: {
  price: number;
  promotionPrice?: number;
  promotionStartDate?: Date | string;
  promotionEndDate?: Date | string;
}, now: Date = new Date()): EffectivePriceResult {
  const regularPrice = Number(product.price);

  if (
    product.promotionPrice != null &&
    Number(product.promotionPrice) > 0 &&
    Number(product.promotionPrice) < regularPrice
  ) {
    const start = product.promotionStartDate ? new Date(product.promotionStartDate) : null;
    const end = product.promotionEndDate ? new Date(product.promotionEndDate) : null;

    const hasStarted = !start || start.getTime() <= now.getTime();
    const hasNotEnded = !end || end.getTime() >= now.getTime();

    if (hasStarted && hasNotEnded) {
      return {
        regularPrice,
        effectivePrice: Number(product.promotionPrice),
        isSale: true,
        salePrice: Number(product.promotionPrice),
        promotionActive: true,
      };
    }
  }

  return {
    regularPrice,
    effectivePrice: regularPrice,
    isSale: false,
    promotionActive: false,
  };
}

