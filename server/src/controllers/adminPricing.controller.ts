import type { Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { logAdminAction } from '../utils/auditLogger.js';
import { getEffectiveProductPrice } from '../utils/pricingHelper.js';

/**
 * GET /api/v1/admin/pricing
 * List all products with their authoritative pricing and promotional parameters
 */
export async function listAdminPricing(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, category, onSaleOnly } = req.query;

    const filter: Record<string, any> = { isArchived: { $ne: true } };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { origin: searchRegex }, { slug: searchRegex }];
    }

    const products = await Product.find(filter).sort({ name: 1 });

    const pricingItems = products.map((product) => {
      const effective = getEffectiveProductPrice(product);
      const json = product.toJSON();
      return {
        ...json,
        effectivePrice: effective.effectivePrice,
        isSaleActive: effective.promotionActive,
        saleDiscount: effective.promotionActive ? Math.round(product.price - effective.effectivePrice) : 0,
      };
    });

    const filtered = onSaleOnly === 'true'
      ? pricingItems.filter((p) => p.isSaleActive)
      : pricingItems;

    return res.status(200).json({
      success: true,
      count: filtered.length,
      products: filtered,
    });
  } catch (error) {
    console.error('[Admin Pricing] Error listing pricing:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve pricing data' });
  }
}

/**
 * PUT /api/v1/admin/pricing/:id
 * Update product retail price and optional scheduled promotional sale price
 */
export async function updateAdminPricing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const {
      price,
      originalPrice,
      promotionPrice,
      promotionStartDate,
      promotionEndDate,
      isSale,
      saleLabel,
    } = req.body;

    // Validate regular retail price (or default to existing product price)
    if (price !== undefined && (typeof price !== 'number' || isNaN(price) || price < 0)) {
      return res.status(400).json({
        success: false,
        error: 'Regular retail price must be a valid non-negative number in INR.',
      });
    }

    const cleanPrice = price !== undefined ? Math.round(Number(price)) : product.price;

    // Validate sale/promotion price if provided
    let cleanPromoPrice: number | undefined = undefined;
    if (promotionPrice !== undefined && promotionPrice !== null && promotionPrice !== '') {
      const promoNum = Number(promotionPrice);
      if (isNaN(promoNum) || promoNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Sale price must be a valid positive number.',
        });
      }
      if (promoNum > 0) {
        if (promoNum >= cleanPrice) {
          return res.status(400).json({
            success: false,
            error: `Sale price (₹${promoNum}) must be strictly lower than regular retail price (₹${cleanPrice}).`,
          });
        }
        cleanPromoPrice = Math.round(promoNum);
      }
    }

    // Validate date ranges
    let cleanStart: Date | undefined = undefined;
    let cleanEnd: Date | undefined = undefined;

    if (promotionStartDate) {
      const start = new Date(promotionStartDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid promotion start date.' });
      }
      cleanStart = start;
    }

    if (promotionEndDate) {
      const end = new Date(promotionEndDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid promotion end date.' });
      }
      cleanEnd = end;
    }

    if (cleanStart && cleanEnd && cleanEnd.getTime() < cleanStart.getTime()) {
      return res.status(400).json({
        success: false,
        error: 'Promotion end date cannot be earlier than start date.',
      });
    }

    const previousPricing = {
      price: product.price,
      originalPrice: product.originalPrice,
      promotionPrice: product.promotionPrice,
      promotionStartDate: product.promotionStartDate,
      promotionEndDate: product.promotionEndDate,
      isSale: product.isSale,
    };

    // Apply updates
    product.price = cleanPrice;
    product.originalPrice = originalPrice && Number(originalPrice) > 0 ? Math.round(Number(originalPrice)) : undefined;
    product.promotionPrice = cleanPromoPrice;
    product.promotionStartDate = cleanStart;
    product.promotionEndDate = cleanEnd;
    if (isSale !== undefined) product.isSale = Boolean(isSale);
    if (saleLabel !== undefined) product.saleLabel = saleLabel ? String(saleLabel).trim() : 'Sale';

    await product.save();

    const effective = getEffectiveProductPrice(product);

    // Audit log
    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'product_pricing_updated',
      resource: 'product',
      resourceId: product._id.toString(),
      details: {
        productName: product.name,
        previous: previousPricing,
        updated: {
          price: product.price,
          originalPrice: product.originalPrice,
          promotionPrice: product.promotionPrice,
          promotionStartDate: product.promotionStartDate,
          promotionEndDate: product.promotionEndDate,
          effectivePrice: effective.effectivePrice,
          isSaleActive: effective.promotionActive,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Pricing for "${product.name}" updated successfully.`,
      product: {
        ...product.toJSON(),
        effectivePrice: effective.effectivePrice,
        isSaleActive: effective.promotionActive,
      },
    });
  } catch (error) {
    console.error('[Admin Pricing] Error updating pricing:', error);
    return res.status(500).json({ success: false, error: 'Failed to update pricing' });
  }
}

