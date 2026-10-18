import type { Response } from 'express';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { logAdminAction } from '../utils/auditLogger.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * GET /api/v1/admin/settings
 * Retrieve roastery business settings (singleton).
 */
export async function getBusinessSettings(_req: AuthenticatedRequest, res: Response) {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }

    return res.status(200).json({
      success: true,
      settings: settings.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Settings] Error retrieving settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve business settings' });
  }
}

/**
 * PUT /api/v1/admin/settings
 * Update roastery business settings with audit log.
 */
export async function updateBusinessSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      businessName,
      tagline,
      gstin,
      contactEmail,
      contactPhone,
      roasteryAddress,
      currency,
      freeShippingThreshold,
      standardShippingFee,
      wholesaleMoqKg,
      orderPrefix,
      wholesaleOrderPrefix,
      taxPercent,
      roasteryCapacityKgPerDay,
    } = req.body;

    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = new BusinessSettings({});
    }

    if (businessName) settings.businessName = String(businessName).trim();
    if (tagline !== undefined) settings.tagline = String(tagline).trim();
    if (gstin) settings.gstin = String(gstin).trim();
    if (contactEmail) settings.contactEmail = String(contactEmail).trim();
    if (contactPhone) settings.contactPhone = String(contactPhone).trim();
    if (roasteryAddress) settings.roasteryAddress = roasteryAddress;
    if (currency) settings.currency = String(currency).trim();
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = Number(freeShippingThreshold);
    if (standardShippingFee !== undefined) settings.standardShippingFee = Number(standardShippingFee);
    if (wholesaleMoqKg !== undefined) settings.wholesaleMoqKg = Number(wholesaleMoqKg);
    if (orderPrefix) settings.orderPrefix = String(orderPrefix).trim();
    if (wholesaleOrderPrefix) settings.wholesaleOrderPrefix = String(wholesaleOrderPrefix).trim();
    if (taxPercent !== undefined) settings.taxPercent = Number(taxPercent);
    if (roasteryCapacityKgPerDay !== undefined) settings.roasteryCapacityKgPerDay = Number(roasteryCapacityKgPerDay);

    await settings.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'BUSINESS_SETTINGS_UPDATED',
      resource: 'BusinessSettings',
      resourceId: settings._id.toString(),
      details: {
        businessName: settings.businessName,
        gstin: settings.gstin,
        freeShippingThreshold: settings.freeShippingThreshold,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Business settings updated successfully',
      settings: settings.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Settings] Error updating settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to update business settings' });
  }
}

/**
 * GET /api/v1/admin/notifications
 * Compute actionable operational notifications from genuine database records.
 */
export async function getAdminNotifications(_req: AuthenticatedRequest, res: Response) {
  try {
    const notifications: Array<{
      id: string;
      type: 'warning' | 'info' | 'urgent';
      category: 'staff' | 'wholesale' | 'order' | 'inventory' | 'finance';
      title: string;
      message: string;
      link: string;
      timestamp: Date;
    }> = [];

    // 1. Pending staff applications
    const pendingStaff = await User.find({ role: 'staff', staffStatus: 'pending' }).limit(5);
    for (const staff of pendingStaff) {
      notifications.push({
        id: `staff-${staff._id}`,
        type: 'urgent',
        category: 'staff',
        title: 'Pending Staff Application',
        message: `${staff.name} applied for roastery onboarding (${staff.email})`,
        link: '/admin?tab=staff-approvals',
        timestamp: staff.createdAt,
      });
    }

    // 2. Pending wholesale applications
    const pendingWholesale = await User.find({
      role: 'wholesale',
      'wholesaleDetails.status': 'pending',
    }).limit(5);
    for (const ws of pendingWholesale) {
      notifications.push({
        id: `ws-${ws._id}`,
        type: 'warning',
        category: 'wholesale',
        title: 'Pending Wholesale Partner',
        message: `${ws.wholesaleDetails?.businessName || ws.name} submitted B2B registration`,
        link: '/admin?tab=wholesale-orders',
        timestamp: ws.wholesaleDetails?.submittedAt || ws.createdAt,
      });
    }

    // 3. Pending cancellation requests
    const pendingCancellations = await Order.find({
      cancellationStatus: 'requested',
    }).limit(5);
    for (const ord of pendingCancellations) {
      notifications.push({
        id: `cancel-${ord._id}`,
        type: 'urgent',
        category: 'order',
        title: 'Order Cancellation Request',
        message: `Order #${ord.orderNumber} (₹${ord.totalAmount}): ${ord.cancellationReason || 'Customer requested cancellation'}`,
        link: '/admin?tab=cancellations',
        timestamp: ord.cancellationRequestedAt || ord.updatedAt,
      });
    }

    // 4. Pending returns
    const pendingReturns = await Order.find({
      returnStatus: 'requested',
    }).limit(5);
    for (const ord of pendingReturns) {
      notifications.push({
        id: `return-${ord._id}`,
        type: 'warning',
        category: 'order',
        title: 'Order Return Request',
        message: `Order #${ord.orderNumber} return requested: ${ord.returnReason || 'Awaiting review'}`,
        link: '/admin?tab=cancellations',
        timestamp: ord.returnRequestedAt || ord.updatedAt,
      });
    }

    // 5. Low stock alerts
    const lowStockProducts = await Product.find({
      isArchived: { $ne: true },
      isPublished: true,
      $expr: { $lte: ['$stockAvailable', '$lowStockThreshold'] },
    }).limit(5);
    for (const prod of lowStockProducts) {
      notifications.push({
        id: `stock-${prod._id}`,
        type: 'warning',
        category: 'inventory',
        title: 'Low Inventory Alert',
        message: `${prod.name} has only ${prod.stockAvailable} bags remaining (threshold: ${prod.lowStockThreshold})`,
        link: '/admin?tab=inventory',
        timestamp: prod.updatedAt,
      });
    }

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications: notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    });
  } catch (error: any) {
    console.error('[Admin Settings] Error retrieving notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
}
