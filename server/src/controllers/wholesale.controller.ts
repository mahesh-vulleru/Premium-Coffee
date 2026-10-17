import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { Product } from '../models/Product.js';

/**
 * GET /api/v1/wholesale/status
 * Returns current wholesale application and approval status for the authenticated user.
 */
export async function getWholesaleStatus(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  return res.status(200).json({
    success: true,
    role: req.user.role,
    status: req.user.wholesaleDetails?.status || 'none',
    wholesaleDetails: req.user.wholesaleDetails || null,
  });
}

/**
 * GET /api/v1/wholesale/catalog
 * Server-protected wholesale catalog and pricing tier rules.
 * Strictly requires approved wholesale partner status.
 */
export async function getWholesaleCatalog(req: AuthenticatedRequest, res: Response) {
  try {
    const products = await Product.find({ stockAvailable: { $gt: 0 } }).sort({ price: 1 });

    const wholesaleProducts = products.map((p) => {
      const basePrice = p.price;
      // 35% standard wholesale discount for approved commercial partners
      const wholesalePricePerKg = Math.round(basePrice * 3.4 * 0.65);

      return {
        _id: p._id.toString(),
        name: p.name,
        origin: p.origin,
        roastLevel: p.roastLevel,
        tastingNotes: p.tastingNotes,
        retailBasePrice: basePrice,
        wholesalePricePerKg,
        commercialDiscountPercent: 35,
        minOrderKg: 5,
        stockAvailableKg: Math.floor(p.stockAvailable * 0.75),
      };
    });

    return res.status(200).json({
      success: true,
      partner: req.user?.wholesaleDetails?.businessName,
      status: 'approved',
      pricingPolicy: {
        commercialDiscountPercent: 35,
        minimumOrderQuantityKg: 5,
        freeFreightThresholdKg: 25,
        paymentTerms: 'Net 15 upon dispatch',
      },
      items: wholesaleProducts,
    });
  } catch (error: any) {
    console.error('[Wholesale Controller] Error loading wholesale catalog:', error);
    return res.status(500).json({ success: false, error: 'Failed to load wholesale catalog' });
  }
}

/**
 * GET /api/v1/wholesale/price-sheet
 * Returns official approved price sheet data for commercial partners.
 * Strictly requires approved wholesale partner status.
 */
export async function getWholesalePriceSheet(req: AuthenticatedRequest, res: Response) {
  return res.status(200).json({
    success: true,
    title: 'Firedup Specialty Coffee Commercial Roastery 2026 Price Sheet',
    issuedTo: req.user?.wholesaleDetails?.businessName || req.user?.name,
    validUntil: '2026-12-31',
    currency: 'INR',
    tiers: [
      { tier: 'Micro-Cafe (5 - 20 kg/mo)', discountPercent: 25, dispatchWindowHours: 48 },
      { tier: 'Commercial Cafe Partner (20 - 50 kg/mo)', discountPercent: 35, dispatchWindowHours: 24 },
      { tier: 'Roastery Distributor (50+ kg/mo)', discountPercent: 42, dispatchWindowHours: 24 },
    ],
  });
}

