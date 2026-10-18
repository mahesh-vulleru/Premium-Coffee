import type { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AdminToken } from '../models/AdminToken.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { logAdminAction } from '../utils/auditLogger.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// GET /api/v1/admin/users
export async function listAllUsers(_req: AuthenticatedRequest, res: Response) {
  const users = await User.find().sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((u) => u.toJSON()),
  });
}

// GET /api/v1/admin/wholesale/applications
export async function listWholesaleApplications(req: AuthenticatedRequest, res: Response) {
  try {
    const { status } = req.query;

    const filter: Record<string, any> = { role: 'wholesale' };
    if (status && status !== 'all') {
      filter['wholesaleDetails.status'] = status;
    }

    const applications = await User.find(filter).sort({ 'wholesaleDetails.submittedAt': -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map((u) => u.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Controller] Error listing wholesale applications:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve applications' });
  }
}

// GET /api/v1/admin/wholesale/applications/:userId
export async function getWholesaleApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'wholesale') {
      return res.status(404).json({ success: false, error: 'Wholesale application not found' });
    }

    return res.status(200).json({
      success: true,
      application: user.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Controller] Error retrieving application:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve application details' });
  }
}

// PATCH /api/v1/admin/wholesale/:userId/approve
export async function approveWholesale(req: AuthenticatedRequest, res: Response) {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (user.role !== 'wholesale' || !user.wholesaleDetails) {
    return res.status(400).json({
      success: false,
      error: 'User is not a wholesale applicant',
    });
  }

  user.wholesaleDetails.status = 'approved';
  user.wholesaleDetails.reviewedAt = new Date();
  user.wholesaleDetails.rejectionReason = undefined;

  await user.save();

  console.log(
    `[Admin Action] Wholesale partner "${user.wholesaleDetails.businessName}" (${user.email}) approved by admin: ${req.user?.email}`
  );

  return res.status(200).json({
    success: true,
    message: `Wholesale privileges granted to ${user.wholesaleDetails.businessName}`,
    user: user.toJSON(),
  });
}

// PATCH /api/v1/admin/wholesale/:userId/reject
export async function rejectWholesale(req: AuthenticatedRequest, res: Response) {
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (user.role !== 'wholesale' || !user.wholesaleDetails) {
    return res.status(400).json({
      success: false,
      error: 'User is not a wholesale applicant',
    });
  }

  user.wholesaleDetails.status = 'rejected';
  user.wholesaleDetails.reviewedAt = new Date();
  user.wholesaleDetails.rejectionReason =
    reason || 'Application did not meet wholesale commercial volume requirements.';

  await user.save();

  console.log(
    `[Admin Action] Wholesale partner "${user.wholesaleDetails.businessName}" (${user.email}) declined by admin: ${req.user?.email}`
  );

  return res.status(200).json({
    success: true,
    message: `Wholesale application declined.`,
    user: user.toJSON(),
  });
}

// GET /api/v1/admin/orders
export async function listAllOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderType, status, cancellationStatus, search } = req.query;

    const filter: Record<string, any> = {};
    if (orderType && orderType !== 'all') {
      filter.orderType = orderType;
    }
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (cancellationStatus && cancellationStatus !== 'all') {
      filter.cancellationStatus = cancellationStatus;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'shippingAddress.contactName': { $regex: q, $options: 'i' } },
        { 'shippingAddress.businessName': { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => o.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Controller] Error listing orders:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
  }
}

// PATCH /api/v1/admin/orders/:orderId/status
export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const {
      orderStatus: directOrderStatus,
      status,
      paymentStatus,
      transitionReason,
      trackingNumber,
      courierName,
      trackingUrl,
      estimatedDeliveryDate,
    } = req.body;
    const orderStatus = directOrderStatus || status;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const userRole = req.user?.role || 'staff';

    // Role restrictions for staff: staff cannot cancel or issue refunds
    if (userRole === 'staff') {
      if (orderStatus === 'cancelled') {
        return res.status(403).json({
          success: false,
          error: 'Order cancellation requires administrator authorization.',
        });
      }
      if (paymentStatus === 'refunded' || paymentStatus === 'refund_pending') {
        return res.status(403).json({
          success: false,
          error: 'Processing refunds requires administrator authorization.',
        });
      }
    }

    const previousStatus = order.orderStatus;
    const previousPayment = order.paymentStatus;

    // Fulfillment Status Progression Guard
    const validOrderStatuses = [
      'received',
      'processing',
      'roasting',
      'packed',
      'dispatched',
      'delivered',
      'cancelled',
    ];

    if (orderStatus) {
      if (!validOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({ success: false, error: `Invalid fulfillment status: "${orderStatus}"` });
      }

      // Terminal states guard: delivered or cancelled orders cannot be reopened arbitrarily without reason
      if (
        (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') &&
        orderStatus !== order.orderStatus
      ) {
        if (!transitionReason) {
          return res.status(400).json({
            success: false,
            error: `Order ${order.orderNumber} is in terminal status "${order.orderStatus}". Reopening requires an administrative transitionReason.`,
          });
        }
      }

      // If status is changed to cancelled directly by admin
      if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
        order.cancellationStatus = 'cancelled';
        order.cancellationDecidedAt = new Date();
        order.cancellationDecisionReason = transitionReason || 'Cancelled directly by administrator';
        order.cancellationDecidedBy = {
          userId: req.user?._id,
          name: req.user?.name || 'Administrator',
          email: req.user?.email || 'admin@firedupcoffee.com',
        };

        // Restore inventory exactly once
        if (order.inventoryRestored !== true) {
          for (const item of order.items) {
            const prod = await Product.findById(item.product);
            if (prod) {
              const previousStock = prod.stockAvailable;
              const newStock = previousStock + item.quantity;
              prod.stockAvailable = newStock;
              await prod.save();

              await InventoryLog.create({
                productId: item.product,
                productName: item.productName,
                previousStock,
                newStock,
                quantityChange: item.quantity,
                type: 'restock',
                reason: `Stock restored from direct cancellation of order #${order.orderNumber}`,
                orderId: order._id,
                orderNumber: order.orderNumber,
                actor: {
                  userId: req.user?._id,
                  name: req.user?.name || 'Administrator',
                  email: req.user?.email || 'admin@firedupcoffee.com',
                  role: req.user?.role || 'admin',
                },
                timestamp: new Date(),
              });
            }
          }
          order.inventoryRestored = true;
        }

        // Do not automatically mark payment as refunded without confirmed refund
        if (order.paymentStatus === 'paid') {
          order.paymentStatus = 'refund_pending';
        }
      }

      order.orderStatus = orderStatus;
    }

    // Payment Status Progression Guard
    const validPaymentStatuses = ['pending', 'terms_approved', 'paid', 'failed', 'refund_pending', 'refunded'];
    if (paymentStatus) {
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ success: false, error: `Invalid payment status: "${paymentStatus}"` });
      }

      // Guard reverting confirmed paid status
      if (order.paymentStatus === 'paid' && paymentStatus !== 'paid' && !transitionReason) {
        return res.status(400).json({
          success: false,
          error: 'Reverting a verified "paid" order requires an administrative transitionReason.',
        });
      }
      order.paymentStatus = paymentStatus;
    }

    // Tracking details update (if provided)
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber ? String(trackingNumber).trim() : undefined;
    }
    if (courierName !== undefined) {
      order.courierName = courierName ? String(courierName).trim() : undefined;
    }
    if (trackingUrl !== undefined) {
      order.trackingUrl = trackingUrl ? String(trackingUrl).trim() : undefined;
    }
    if (estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined;
    }

    // Add status history entry
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    const note = transitionReason || `Status updated to ${order.orderStatus}${order.trackingNumber ? ` (Tracking: ${order.trackingNumber})` : ''}`;
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note,
      updatedBy: req.user?.name || req.user?.email || 'Staff',
    });

    await order.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Staff Member',
        email: req.user?.email || 'staff@firedupcoffee.com',
        role: req.user?.role || 'staff',
      },
      action: 'order_status_updated',
      resource: 'order',
      resourceId: order._id.toString(),
      details: {
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus: order.orderStatus,
        previousPayment,
        newPayment: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        transitionReason,
      },
    });

    console.log(
      `[Order Workflow] Order ${order.orderNumber} updated: fulfillment="${order.orderStatus}", payment="${order.paymentStatus}" by ${req.user?.email}`
    );

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} updated successfully`,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Controller] Error updating order status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
}

/**
 * POST /api/v1/admin/orders/:orderId/cancellation
 * Admin approves or rejects customer cancellation request
 */
export async function decideOrderCancellation(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const { decision, reason } = req.body;

    // Staff cannot approve/reject cancellations
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators are authorized to approve or reject order cancellations.',
      });
    }

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Decision must be either "approve" or "reject".',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Order is already cancelled.' });
    }

    if (order.cancellationStatus !== 'requested' && decision === 'reject') {
      return res.status(400).json({
        success: false,
        error: 'No active cancellation request to reject for this order.',
      });
    }

    const decisionReason =
      reason && typeof reason === 'string' && reason.trim()
        ? reason.trim()
        : decision === 'approve'
          ? 'Approved by roastery administrator'
          : 'Declined by roastery administrator';

    const actorInfo = {
      userId: req.user._id,
      name: req.user.name || 'Administrator',
      email: req.user.email || 'admin@firedupcoffee.com',
    };

    if (decision === 'approve') {
      order.orderStatus = 'cancelled';
      order.cancellationStatus = 'approved';
      order.cancellationDecidedAt = new Date();
      order.cancellationDecisionReason = decisionReason;
      order.cancellationDecidedBy = actorInfo;

      // Restore inventory exactly once
      if (order.inventoryRestored !== true) {
        for (const item of order.items) {
          const prod = await Product.findById(item.product);
          if (prod) {
            const previousStock = prod.stockAvailable;
            const newStock = previousStock + item.quantity;
            prod.stockAvailable = newStock;
            await prod.save();

            await InventoryLog.create({
              productId: item.product,
              productName: item.productName,
              previousStock,
              newStock,
              quantityChange: item.quantity,
              type: 'restock',
              reason: `Stock restored from approved cancellation of order #${order.orderNumber}`,
              orderId: order._id,
              orderNumber: order.orderNumber,
              actor: {
                userId: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: 'admin',
              },
              timestamp: new Date(),
            });
          }
        }
        order.inventoryRestored = true;
      }

      // Do not automatically mark payment as refunded without confirmed refund
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refund_pending';
      }

      if (!Array.isArray(order.statusHistory)) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Cancellation approved: "${decisionReason}"`,
        updatedBy: req.user.name || 'Administrator',
      });

      await order.save();

      await logAdminAction({
        actor: {
          userId: req.user._id,
          name: req.user.name || 'Administrator',
          email: req.user.email || 'admin@firedupcoffee.com',
          role: req.user.role || 'admin',
        },
        action: 'order_cancellation_approved',
        resource: 'order',
        resourceId: order._id.toString(),
        details: {
          orderNumber: order.orderNumber,
          decisionReason,
          inventoryRestored: true,
          paymentStatus: order.paymentStatus,
        },
      });

      console.log(`[Admin Action] Cancellation APPROVED for order ${order.orderNumber} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: `Cancellation for order ${order.orderNumber} approved. Inventory restored to warehouse.`,
        order: order.toJSON(),
      });
    } else {
      // Reject cancellation request
      order.cancellationStatus = 'rejected';
      order.cancellationDecidedAt = new Date();
      order.cancellationDecisionReason = decisionReason;
      order.cancellationDecidedBy = actorInfo;

      if (!Array.isArray(order.statusHistory)) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date(),
        note: `Cancellation declined: "${decisionReason}"`,
        updatedBy: req.user.name || 'Administrator',
      });

      await order.save();

      await logAdminAction({
        actor: {
          userId: req.user._id,
          name: req.user.name || 'Administrator',
          email: req.user.email || 'admin@firedupcoffee.com',
          role: req.user.role || 'admin',
        },
        action: 'order_cancellation_rejected',
        resource: 'order',
        resourceId: order._id.toString(),
        details: {
          orderNumber: order.orderNumber,
          decisionReason,
        },
      });

      console.log(`[Admin Action] Cancellation REJECTED for order ${order.orderNumber} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: `Cancellation request for order ${order.orderNumber} rejected. Order remains in fulfillment pipeline.`,
        order: order.toJSON(),
      });
    }
  } catch (error: any) {
    console.error('[Admin Controller] Error deciding cancellation:', error);
    return res.status(500).json({ success: false, error: 'Failed to process cancellation decision' });
  }
}

// GET /api/v1/admin/metrics
export async function getAdminMetrics(_req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Applications & Accounts
    const [
      pendingWholesaleCount,
      approvedWholesaleCount,
      rejectedWholesaleCount,
      totalRetailCount,
      totalAdminCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'wholesale', 'wholesaleDetails.status': 'pending' }),
      User.countDocuments({ role: 'wholesale', 'wholesaleDetails.status': 'approved' }),
      User.countDocuments({ role: 'wholesale', 'wholesaleDetails.status': 'rejected' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    // 2. Orders & Financial Aggregates
    const [
      totalOrdersCount,
      wholesaleOrdersCount,
      retailOrdersCount,
      orderAggregates,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderType: 'wholesale' }),
      Order.countDocuments({ orderType: 'retail' }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalKg: { $sum: '$totalKg' },
          },
        },
      ]),
    ]);

    const totalRevenue = orderAggregates[0]?.totalRevenue || 0;
    const totalKg = orderAggregates[0]?.totalKg || 0;

    // 3. Orders by Fulfillment Status
    const ordersByStatusRaw = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);
    const ordersByStatus: Record<string, number> = {
      received: 0,
      processing: 0,
      roasting: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const item of ordersByStatusRaw) {
      if (item._id && ordersByStatus[item._id] !== undefined) {
        ordersByStatus[item._id] = item.count;
      }
    }

    // 4. Warehouse & Inventory Metrics
    const [
      totalProductsCount,
      inStockProductsCount,
      lowStockProductsCount,
      inventoryBagsAggregate,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stockAvailable: { $gt: 0 } }),
      Product.countDocuments({ stockAvailable: { $gt: 0, $lte: 15 } }),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalStockBags: { $sum: '$stockAvailable' },
          },
        },
      ]),
    ]);

    const totalStockBags = inventoryBagsAggregate[0]?.totalStockBags || 0;

    return res.status(200).json({
      success: true,
      metrics: {
        applications: {
          pending: pendingWholesaleCount,
          approved: approvedWholesaleCount,
          rejected: rejectedWholesaleCount,
          total: pendingWholesaleCount + approvedWholesaleCount + rejectedWholesaleCount,
        },
        users: {
          retail: totalRetailCount,
          wholesale: approvedWholesaleCount + pendingWholesaleCount + rejectedWholesaleCount,
          wholesaleApproved: approvedWholesaleCount,
          admin: totalAdminCount,
          total: totalRetailCount + approvedWholesaleCount + pendingWholesaleCount + rejectedWholesaleCount + totalAdminCount,
        },
        orders: {
          total: totalOrdersCount,
          wholesale: wholesaleOrdersCount,
          retail: retailOrdersCount,
          totalRevenue,
          totalKg,
          byStatus: ordersByStatus,
        },
        inventory: {
          totalProducts: totalProductsCount,
          inStockProducts: inStockProductsCount,
          lowStockProducts: lowStockProductsCount,
          totalStockBags,
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Controller] Error calculating metrics:', error);
    return res.status(500).json({ success: false, error: 'Failed to calculate administrative metrics' });
  }
}

// POST /api/v1/admin/tokens/generate
export async function generateToken(req: AuthenticatedRequest, res: Response) {
  const { department, expiresInDays } = req.body;

  const rawRandom = crypto.randomBytes(8).toString('hex').toUpperCase();
  const tokenString = `FIREDUP-STAFF-${rawRandom}`;
  const days = expiresInDays ? parseInt(expiresInDays, 10) : 7;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const doc = await AdminToken.create({
    token: tokenString,
    department: department || 'Operations',
    expiresAt,
  });

  console.log(
    `[Admin Action] New staff invitation token generated by ${req.user?.email}: ${tokenString}`
  );

  return res.status(201).json({
    success: true,
    token: doc.token,
    department: doc.department,
    expiresAt: doc.expiresAt,
  });
}

// GET /api/v1/admin/tokens
export async function listTokens(_req: AuthenticatedRequest, res: Response) {
  const tokens = await AdminToken.find().sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    tokens: tokens.map((t) => ({
      _id: t._id,
      token: `FIREDUP-STAFF-****${t.token.slice(-4)}`,
      department: t.department,
      isUsed: t.isUsed,
      usedAt: t.usedAt,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    })),
  });
}
