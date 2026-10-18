import type { Response } from 'express';
import mongoose from 'mongoose';
import { Promotion } from '../models/Promotion.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * GET /api/v1/admin/promotions
 * List all promotional campaigns and coupons
 */
export async function listAdminPromotions(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, status } = req.query;

    const filter: Record<string, any> = { isArchived: { $ne: true } };

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    } else if (status === 'archived') {
      delete filter.isArchived;
      filter.isArchived = true;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ code: searchRegex }, { description: searchRegex }];
    }

    const promotions = await Promotion.find(filter).sort({ createdAt: -1 });

    const now = new Date();
    const mapped = promotions.map((p) => {
      const json = p.toJSON();
      const isExpired = p.endDate ? now > new Date(p.endDate) : false;
      const isPending = p.startDate ? now < new Date(p.startDate) : false;
      return {
        ...json,
        isExpired,
        isPending,
        isCurrentlyValid: p.isActive && !isExpired && !isPending && (!p.usageLimit || p.usageCount < p.usageLimit),
      };
    });

    return res.status(200).json({
      success: true,
      count: mapped.length,
      promotions: mapped,
    });
  } catch (error) {
    console.error('[Admin Promotions] Error listing promotions:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve promotions' });
  }
}

/**
 * POST /api/v1/admin/promotions
 * Create a new promotion campaign or coupon
 */
export async function createAdminPromotion(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      code,
      description,
      discountType = 'percentage',
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      isActive = true,
      applicableCategories,
    } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Promotion code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code
    const existing = await Promotion.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `A promotion with code "${cleanCode}" already exists.`,
      });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Promotion description is required' });
    }

    if (discountValue === undefined || typeof discountValue !== 'number' || discountValue <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be greater than 0' });
    }

    if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Percentage discount must be between 1% and 100%',
      });
    }

    if (minOrderAmount < 0) {
      return res.status(400).json({ success: false, error: 'Minimum order amount cannot be negative' });
    }

    let cleanStart: Date | undefined;
    let cleanEnd: Date | undefined;

    if (startDate) {
      const s = new Date(startDate);
      if (isNaN(s.getTime())) return res.status(400).json({ success: false, error: 'Invalid start date' });
      cleanStart = s;
    }

    if (endDate) {
      const e = new Date(endDate);
      if (isNaN(e.getTime())) return res.status(400).json({ success: false, error: 'Invalid end date' });
      cleanEnd = e;
    }

    if (cleanStart && cleanEnd && cleanEnd.getTime() < cleanStart.getTime()) {
      return res.status(400).json({ success: false, error: 'End date cannot be earlier than start date' });
    }

    const promo = await Promotion.create({
      code: cleanCode,
      description: description.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount && Number(maxDiscountAmount) > 0 ? Number(maxDiscountAmount) : undefined,
      startDate: cleanStart,
      endDate: cleanEnd,
      usageLimit: usageLimit && Number(usageLimit) > 0 ? Math.floor(Number(usageLimit)) : undefined,
      usageCount: 0,
      isActive: Boolean(isActive),
      isArchived: false,
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : undefined,
    });

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'promotion_created',
      resource: 'promotion',
      resourceId: promo._id.toString(),
      details: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: promo.minOrderAmount,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Promotion code "${promo.code}" created successfully.`,
      promotion: promo.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Promotions] Error creating promotion:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Promotion code must be unique' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create promotion' });
  }
}

/**
 * PUT /api/v1/admin/promotions/:id
 * Update an existing promotion
 */
export async function updateAdminPromotion(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid promotion ID' });
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const {
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      isActive,
      applicableCategories,
    } = req.body;

    if (description !== undefined) {
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, error: 'Description cannot be empty' });
      }
      promo.description = description.trim();
    }

    if (discountType !== undefined) {
      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ success: false, error: 'Discount type must be percentage or fixed' });
      }
      promo.discountType = discountType;
    }

    if (discountValue !== undefined) {
      const val = Number(discountValue);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ success: false, error: 'Discount value must be greater than 0' });
      }
      if (promo.discountType === 'percentage' && (val < 1 || val > 100)) {
        return res.status(400).json({ success: false, error: 'Percentage discount must be between 1% and 100%' });
      }
      promo.discountValue = val;
    }

    if (minOrderAmount !== undefined) {
      promo.minOrderAmount = Math.max(0, Number(minOrderAmount) || 0);
    }

    if (maxDiscountAmount !== undefined) {
      promo.maxDiscountAmount = maxDiscountAmount && Number(maxDiscountAmount) > 0 ? Number(maxDiscountAmount) : undefined;
    }

    if (startDate !== undefined) {
      promo.startDate = startDate ? new Date(startDate) : undefined;
    }

    if (endDate !== undefined) {
      promo.endDate = endDate ? new Date(endDate) : undefined;
    }

    if (promo.startDate && promo.endDate && promo.endDate.getTime() < promo.startDate.getTime()) {
      return res.status(400).json({ success: false, error: 'End date cannot be earlier than start date' });
    }

    if (usageLimit !== undefined) {
      promo.usageLimit = usageLimit && Number(usageLimit) > 0 ? Math.floor(Number(usageLimit)) : undefined;
    }

    if (isActive !== undefined) {
      promo.isActive = Boolean(isActive);
    }

    if (applicableCategories !== undefined) {
      promo.applicableCategories = Array.isArray(applicableCategories) ? applicableCategories : undefined;
    }

    await promo.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'promotion_updated',
      resource: 'promotion',
      resourceId: promo._id.toString(),
      details: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        isActive: promo.isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Promotion "${promo.code}" updated successfully.`,
      promotion: promo.toJSON(),
    });
  } catch (error) {
    console.error('[Admin Promotions] Error updating promotion:', error);
    return res.status(500).json({ success: false, error: 'Failed to update promotion' });
  }
}

/**
 * PATCH /api/v1/admin/promotions/:id/status
 * Toggle promotion active/inactive status
 */
export async function togglePromotionStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid promotion ID' });
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    promo.isActive = typeof isActive === 'boolean' ? isActive : !promo.isActive;
    await promo.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'promotion_status_toggled',
      resource: 'promotion',
      resourceId: promo._id.toString(),
      details: { code: promo.code, isActive: promo.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Promotion "${promo.code}" is now ${promo.isActive ? 'active' : 'inactive'}.`,
      promotion: promo.toJSON(),
    });
  } catch (error) {
    console.error('[Admin Promotions] Error toggling status:', error);
    return res.status(500).json({ success: false, error: 'Failed to toggle status' });
  }
}

/**
 * DELETE /api/v1/admin/promotions/:id
 * Safe archive of promotion
 */
export async function archiveAdminPromotion(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid promotion ID' });
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    promo.isArchived = true;
    promo.isActive = false;
    await promo.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'promotion_archived',
      resource: 'promotion',
      resourceId: promo._id.toString(),
      details: { code: promo.code },
    });

    return res.status(200).json({
      success: true,
      message: `Promotion "${promo.code}" archived successfully.`,
    });
  } catch (error) {
    console.error('[Admin Promotions] Error archiving promotion:', error);
    return res.status(500).json({ success: false, error: 'Failed to archive promotion' });
  }
}

