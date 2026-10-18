import type { Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Expense } from '../models/Expense.js';
import { AuditLog } from '../models/AuditLog.js';
import { logAdminAction } from '../utils/auditLogger.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Protect against CSV injection
  if (/^[=+@\-]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * GET /api/v1/admin/reports/analytics
 * Comprehensive aggregated business intelligence analytics.
 */
export async function getReportsAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const { days = '30' } = req.query;
    const daysNum = Math.min(365, Math.max(7, parseInt(String(days), 10) || 30));

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysNum);

    const orders = await Order.find({ createdAt: { $gte: sinceDate } }).sort({ createdAt: 1 });
    const expenses = await Expense.find({ date: { $gte: sinceDate } });
    const products = await Product.find({ isArchived: { $ne: true } });

    // 1. Time-series daily aggregation
    const dailyMap: Record<string, { date: string; retail: number; wholesale: number; total: number; orders: number }> = {};
    for (let i = 0; i < daysNum; i++) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { date: key, retail: 0, wholesale: 0, total: 0, orders: 0 };
    }

    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; totalKg: number }> = {};
    const fulfillmentStagesCount: Record<string, number> = {
      received: 0,
      processing: 0,
      roasting: 0,
      packed: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0,
    };

    let totalCancellations = 0;
    let totalReturns = 0;

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].orders++;
        dailyMap[key].total += order.totalAmount || 0;
        if (order.orderType === 'wholesale') {
          dailyMap[key].wholesale += order.totalAmount || 0;
        } else {
          dailyMap[key].retail += order.totalAmount || 0;
        }
      }

      if (order.orderStatus && fulfillmentStagesCount[order.orderStatus] !== undefined) {
        fulfillmentStagesCount[order.orderStatus]++;
      }

      if (order.orderStatus === 'cancelled' || order.cancellationStatus === 'approved') {
        totalCancellations++;
      }

      if (order.returnStatus === 'approved' || order.returnStatus === 'completed') {
        totalReturns++;
      }

      // Aggregate line items
      for (const item of order.items) {
        const pKey = item.productName || 'Unknown Coffee';
        if (!productSalesMap[pKey]) {
          productSalesMap[pKey] = { name: pKey, quantity: 0, revenue: 0, totalKg: 0 };
        }
        productSalesMap[pKey].quantity += item.quantity;
        productSalesMap[pKey].revenue += item.lineTotal;

        // Weight estimation
        const weightMatch = item.size.match(/(\d+(\.\d+)?)\s*(kg|g)/i);
        if (weightMatch) {
          const val = parseFloat(weightMatch[1]);
          const unit = weightMatch[3].toLowerCase();
          const kgPerItem = unit === 'kg' ? val : val / 1000;
          productSalesMap[pKey].totalKg += kgPerItem * item.quantity;
        }
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const totalOrdersCount = orders.length;
    const cancellationRate = totalOrdersCount > 0 ? (totalCancellations / totalOrdersCount) * 100 : 0;
    const returnRate = totalOrdersCount > 0 ? (totalReturns / totalOrdersCount) * 100 : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        days: daysNum,
        dailySeries: Object.values(dailyMap),
        fulfillmentStages: fulfillmentStagesCount,
        topProducts,
        rates: {
          totalOrders: totalOrdersCount,
          totalCancellations,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
          totalReturns,
          returnRate: Math.round(returnRate * 10) / 10,
        },
        inventorySummary: {
          totalCatalogSkus: products.length,
          totalAvailableStockBags: products.reduce((acc, p) => acc + (p.stockAvailable || 0), 0),
          lowStockSkus: products.filter((p) => p.stockAvailable <= (p.lowStockThreshold || 10)).length,
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Reports] Error fetching analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to calculate analytics' });
  }
}

/**
 * GET /api/v1/admin/reports/export
 * Generate and stream CSV export for business reporting.
 */
export async function exportReportCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const { type = 'sales' } = req.query;

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `firedup-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'sales') {
      headers = [
        'Order Number',
        'Date',
        'Type',
        'Customer / Business',
        'Email',
        'Phone',
        'City',
        'State',
        'Subtotal (INR)',
        'Discount (INR)',
        'Tax (INR)',
        'Shipping (INR)',
        'Total (INR)',
        'Payment Method',
        'Payment Status',
        'Fulfillment Status',
      ];

      const orders = await Order.find().sort({ createdAt: -1 });
      rows = orders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.orderType,
        o.shippingAddress?.businessName || o.shippingAddress?.contactName || 'Retail Customer',
        o.shippingAddress?.phone || 'N/A',
        o.shippingAddress?.city || 'N/A',
        o.shippingAddress?.state || 'N/A',
        String(o.subtotal || 0),
        String(o.discountAmount || 0),
        String(o.taxAmount || 0),
        String(o.shippingFee || 0),
        String(o.totalAmount || 0),
        o.paymentMethod || 'N/A',
        o.paymentStatus || 'pending',
        o.orderStatus || 'received',
      ]);
    } else if (type === 'inventory') {
      headers = [
        'Product Name',
        'Category',
        'Roast Level',
        'Retail Price (INR)',
        'Cost Price (INR)',
        'Stock Available (Bags)',
        'Low Stock Threshold',
        'Reserved Stock',
        'Published',
        'Archived',
      ];

      const prods = await Product.find().sort({ name: 1 });
      rows = prods.map((p) => [
        p.name,
        p.category,
        p.roastLevel,
        String(p.price || 0),
        String(p.costPrice || 0),
        String(p.stockAvailable || 0),
        String(p.lowStockThreshold || 10),
        String(p.reservedStock || 0),
        p.isPublished ? 'Yes' : 'No',
        p.isArchived ? 'Yes' : 'No',
      ]);
    } else if (type === 'expenses') {
      headers = [
        'Date',
        'Category',
        'Description',
        'Amount (INR)',
        'Payment Method',
        'Vendor',
        'Invoice Number',
        'Recorded By',
      ];

      const exps = await Expense.find().sort({ date: -1 });
      rows = exps.map((e) => [
        e.date.toISOString().split('T')[0],
        e.category,
        e.description,
        String(e.amount || 0),
        e.paymentMethod,
        e.vendor || 'N/A',
        e.invoiceNumber || 'N/A',
        e.recordedBy?.name || 'Staff',
      ]);
    } else if (type === 'cancellations') {
      headers = [
        'Order Number',
        'Date Placed',
        'Cancellation Status',
        'Customer Reason',
        'Decision Reason',
        'Decided By',
        'Decided At',
        'Inventory Restored',
        'Order Total (INR)',
      ];

      const cancelOrders = await Order.find({
        cancellationStatus: { $ne: 'none' },
      }).sort({ createdAt: -1 });

      rows = cancelOrders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.cancellationStatus,
        o.cancellationReason || 'N/A',
        o.cancellationDecisionReason || 'N/A',
        o.cancellationDecidedBy?.name || 'N/A',
        o.cancellationDecidedAt ? o.cancellationDecidedAt.toISOString() : 'N/A',
        o.inventoryRestored ? 'Yes' : 'No',
        String(o.totalAmount || 0),
      ]);
    } else if (type === 'audit_logs') {
      headers = [
        'Timestamp',
        'Actor Name',
        'Actor Email',
        'Actor Role',
        'Action',
        'Resource',
        'Resource ID',
        'IP Address',
      ];

      const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000);
      rows = logs.map((l) => [
        l.timestamp.toISOString(),
        l.actor?.name || 'System',
        l.actor?.email || 'N/A',
        l.actor?.role || 'admin',
        l.action,
        l.resource,
        l.resourceId || 'N/A',
        l.ipAddress || 'Internal',
      ]);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Supported: sales, inventory, expenses, cancellations, audit_logs',
      });
    }

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\r\n');

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'REPORT_EXPORTED',
      resource: 'Report',
      resourceId: type.toString(),
      details: {
        reportType: type,
        rowCount: rows.length,
      },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('[Admin Reports] Error exporting CSV:', error);
    return res.status(500).json({ success: false, error: 'Failed to export CSV report' });
  }
}
