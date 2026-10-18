import type { Response } from 'express';
import { Order } from '../models/Order.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * GET /api/v1/staff/orders
 * Returns orders in the roastery fulfillment queue
 */
export async function listStaffFulfillmentOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, search } = req.query;

    const filter: Record<string, any> = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'shippingAddress.contactName': { $regex: q, $options: 'i' } },
        { 'shippingAddress.businessName': { $regex: q, $options: 'i' } },
      ];
    }

    // Default to active fulfillment orders sorted by priority/date
    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => o.toJSON()),
    });
  } catch (error: any) {
    console.error('[Staff Controller] Error fetching fulfillment orders:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve fulfillment orders' });
  }
}

/**
 * PATCH /api/v1/staff/orders/:orderId/fulfillment
 * Staff advances an order through the roastery fulfillment workflow
 */
export async function updateStaffFulfillment(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const {
      orderStatus: directOrderStatus,
      status,
      trackingNumber,
      courierName,
      trackingUrl,
      estimatedDeliveryDate,
      note,
    } = req.body;
    const orderStatus = directOrderStatus || status;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Staff cannot cancel orders or approve cancellations
    if (orderStatus === 'cancelled') {
      return res.status(403).json({
        success: false,
        error: 'Order cancellation requires roastery administrator authorization.',
      });
    }

    const allowedStaffStatuses = ['received', 'processing', 'roasting', 'packed', 'dispatched', 'delivered'];
    if (orderStatus && !allowedStaffStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid fulfillment status "${orderStatus}". Staff can update to: ${allowedStaffStatuses.join(', ')}.`,
      });
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

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

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    const historyNote = note || `Fulfillment advanced to ${order.orderStatus}${order.trackingNumber ? ` (Tracking: ${order.trackingNumber})` : ''}`;
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: historyNote,
      updatedBy: req.user?.name || 'Roastery Staff',
    });

    await order.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Roastery Staff',
        email: req.user?.email || 'staff@firedupcoffee.com',
        role: req.user?.role || 'staff',
      },
      action: 'order_fulfillment_updated',
      resource: 'order',
      resourceId: order._id.toString(),
      details: {
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
      },
    });

    console.log(
      `[Staff Fulfillment] Order ${order.orderNumber} updated to ${order.orderStatus} by ${req.user?.email}`
    );

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} fulfillment status updated to ${order.orderStatus}`,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Staff Controller] Error updating fulfillment:', error);
    return res.status(500).json({ success: false, error: 'Failed to update order fulfillment' });
  }
}

/**
 * GET /api/v1/staff/metrics
 * Quick stats for the floor staff dashboard
 */
export async function getStaffFulfillmentMetrics(_req: AuthenticatedRequest, res: Response) {
  try {
    const [
      receivedCount,
      processingCount,
      roastingCount,
      packedCount,
      dispatchedCount,
      pendingCancellations,
    ] = await Promise.all([
      Order.countDocuments({ orderStatus: 'received' }),
      Order.countDocuments({ orderStatus: 'processing' }),
      Order.countDocuments({ orderStatus: 'roasting' }),
      Order.countDocuments({ orderStatus: 'packed' }),
      Order.countDocuments({ orderStatus: 'dispatched' }),
      Order.countDocuments({ cancellationStatus: 'requested' }),
    ]);

    return res.status(200).json({
      success: true,
      metrics: {
        received: receivedCount,
        processing: processingCount,
        roasting: roastingCount,
        packed: packedCount,
        dispatched: dispatchedCount,
        pendingCancellations,
        totalActiveTasks: receivedCount + processingCount + roastingCount + packedCount,
      },
    });
  } catch (error: any) {
    console.error('[Staff Controller] Error getting metrics:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve staff metrics' });
  }
}

