import type { Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Expense, type ExpenseCategory } from '../models/Expense.js';
import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { logAdminAction } from '../utils/auditLogger.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * GET /api/v1/admin/finance/summary
 * Compute authoritative financial metrics from real order, payment, refund, and expense documents.
 */
export async function getFinanceSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: Record<string, any> = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(String(startDate));
      if (endDate) dateFilter.createdAt.$lte = new Date(String(endDate));
    }

    // Orders aggregation
    const orders = await Order.find(dateFilter);

    let grossRetailSales = 0;
    let grossWholesaleSales = 0;
    let totalDiscounts = 0;
    let totalTaxCollected = 0;
    let totalShippingFees = 0;

    let collectedRevenue = 0; // paymentStatus === 'paid'
    let wholesaleReceivables = 0; // paymentStatus === 'terms_approved'
    let pendingPayments = 0; // paymentStatus === 'pending'
    let refundedAmount = 0; // paymentStatus === 'refunded'
    let refundPendingAmount = 0; // paymentStatus === 'refund_pending'
    let failedPaymentsCount = 0;

    let retailOrdersCount = 0;
    let wholesaleOrdersCount = 0;

    const paymentMethodsBreakdown: Record<string, number> = {
      credit_card: 0,
      net_terms: 0,
      bank_transfer: 0,
      cod: 0,
    };

    for (const order of orders) {
      if (order.orderType === 'wholesale') {
        wholesaleOrdersCount++;
        grossWholesaleSales += order.totalAmount || 0;
      } else {
        retailOrdersCount++;
        grossRetailSales += order.totalAmount || 0;
      }

      totalDiscounts += order.discountAmount || 0;
      totalTaxCollected += order.taxAmount || 0;
      totalShippingFees += order.shippingFee || 0;

      if (order.paymentMethod && paymentMethodsBreakdown[order.paymentMethod] !== undefined) {
        paymentMethodsBreakdown[order.paymentMethod] += order.totalAmount || 0;
      }

      if (order.paymentStatus === 'paid') {
        collectedRevenue += order.totalAmount || 0;
      } else if (order.paymentStatus === 'terms_approved') {
        wholesaleReceivables += order.totalAmount || 0;
      } else if (order.paymentStatus === 'pending') {
        pendingPayments += order.totalAmount || 0;
      } else if (order.paymentStatus === 'refunded') {
        refundedAmount += order.refundAmount || order.totalAmount || 0;
      } else if (order.paymentStatus === 'refund_pending') {
        refundPendingAmount += order.totalAmount || 0;
      } else if (order.paymentStatus === 'failed') {
        failedPaymentsCount++;
      }
    }

    // Expenses aggregation
    const expenseDateFilter: Record<string, any> = {};
    if (startDate || endDate) {
      expenseDateFilter.date = {};
      if (startDate) expenseDateFilter.date.$gte = new Date(String(startDate));
      if (endDate) expenseDateFilter.date.$lte = new Date(String(endDate));
    }

    const expenses = await Expense.find(expenseDateFilter);
    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {
      green_coffee: 0,
      packaging: 0,
      roastery_utilities: 0,
      logistics: 0,
      marketing: 0,
      equipment_maintenance: 0,
      payroll: 0,
      other: 0,
    };

    for (const exp of expenses) {
      totalExpenses += exp.amount || 0;
      if (expensesByCategory[exp.category] !== undefined) {
        expensesByCategory[exp.category] += exp.amount || 0;
      } else {
        expensesByCategory.other += exp.amount || 0;
      }
    }

    const totalGrossSales = grossRetailSales + grossWholesaleSales;
    // Net Sales = Gross Sales - Discounts - Confirmed Refunds
    const netSales = Math.max(0, totalGrossSales - totalDiscounts - refundedAmount);
    // Net Operating Cash = Collected Revenue - Refunds - Recorded Expenses
    const netOperatingCash = collectedRevenue - refundedAmount - totalExpenses;

    return res.status(200).json({
      success: true,
      summary: {
        currency: 'INR',
        orders: {
          total: orders.length,
          retail: retailOrdersCount,
          wholesale: wholesaleOrdersCount,
        },
        sales: {
          grossRetailSales,
          grossWholesaleSales,
          totalGrossSales,
          totalDiscounts,
          totalTaxCollected,
          totalShippingFees,
          netSales,
        },
        cashflow: {
          collectedRevenue,
          wholesaleReceivables,
          pendingPayments,
          refundedAmount,
          refundPendingAmount,
          failedPaymentsCount,
          totalExpenses,
          netOperatingCash,
        },
        expensesByCategory,
        paymentMethodsBreakdown,
        meta: {
          startDate: startDate || null,
          endDate: endDate || null,
          calculatedAt: new Date(),
          definitions: {
            collectedRevenue: 'Total amount from orders with confirmed paymentStatus: "paid"',
            wholesaleReceivables: 'Active commercial Net terms awaiting remittance (terms_approved)',
            netOperatingCash: 'Collected cash minus verified refunds and recorded operational expenses',
          },
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Finance] Error calculating finance summary:', error);
    return res.status(500).json({ success: false, error: 'Failed to calculate financial summary' });
  }
}

/**
 * GET /api/v1/admin/finance/expenses
 * List recorded roastery and operational expenditures.
 */
export async function listExpenses(req: AuthenticatedRequest, res: Response) {
  try {
    const { category, search, startDate, endDate } = req.query;

    const query: Record<string, any> = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      query.$or = [
        { description: { $regex: term, $options: 'i' } },
        { vendor: { $regex: term, $options: 'i' } },
        { invoiceNumber: { $regex: term, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(String(startDate));
      if (endDate) query.date.$lte = new Date(String(endDate));
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      expenses: expenses.map((e) => e.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Finance] Error listing expenses:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve expenses' });
  }
}

/**
 * POST /api/v1/admin/finance/expenses
 * Record a new operational expenditure.
 */
export async function createExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      category,
      description,
      amount,
      date,
      paymentMethod,
      vendor,
      invoiceNumber,
      receiptUrl,
      notes,
    } = req.body;

    if (!category || !description || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Category, description, and positive amount are required.',
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number in INR.',
      });
    }

    const expense = await Expense.create({
      category: category as ExpenseCategory,
      description: String(description).trim(),
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'bank_transfer',
      vendor: vendor ? String(vendor).trim() : undefined,
      invoiceNumber: invoiceNumber ? String(invoiceNumber).trim() : undefined,
      receiptUrl: receiptUrl ? String(receiptUrl).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      recordedBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
      },
    });

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'EXPENSE_RECORDED',
      resource: 'Expense',
      resourceId: expense._id.toString(),
      details: {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        vendor: expense.vendor,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense: expense.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Finance] Error creating expense:', error);
    return res.status(500).json({ success: false, error: 'Failed to record expense' });
  }
}

/**
 * DELETE /api/v1/admin/finance/expenses/:id
 * Remove an errant or cancelled expense entry.
 */
export async function deleteExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid expense ID' });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense entry not found' });
    }

    await Expense.findByIdAndDelete(id);

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'EXPENSE_DELETED',
      resource: 'Expense',
      resourceId: id,
      details: {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Expense entry deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Finance] Error deleting expense:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete expense' });
  }
}

/**
 * POST /api/v1/admin/orders/:orderId/refund
 * Authoritatively process and record an order refund.
 */
export async function processOrderRefund(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const { amount, reason, transactionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        error: `Order ${order.orderNumber} is already marked as refunded. Double refunds are strictly prevented.`,
      });
    }

    const refundAmt = amount !== undefined ? Number(amount) : order.totalAmount;
    if (isNaN(refundAmt) || refundAmt <= 0 || refundAmt > order.totalAmount) {
      return res.status(400).json({
        success: false,
        error: `Refund amount must be between ₹1 and the order total of ₹${order.totalAmount}`,
      });
    }

    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = 'refunded';
    order.refundAmount = refundAmt;
    order.refundReason = reason || 'Refund issued by finance manager';
    order.refundTransactionId = transactionId ? String(transactionId).trim() : `REF-${Date.now()}`;
    order.refundedAt = new Date();
    order.refundedBy = {
      userId: req.user?._id,
      name: req.user?.name || 'Administrator',
      email: req.user?.email || 'admin@firedupcoffee.com',
    };

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Payment marked refunded: ₹${refundAmt} (${order.refundReason})`,
      updatedBy: req.user?.name || 'Finance Manager',
    });

    await order.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Finance Manager',
        email: req.user?.email || 'finance@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'ORDER_REFUND_PROCESSED',
      resource: 'Order',
      resourceId: order._id.toString(),
      details: {
        orderNumber: order.orderNumber,
        refundAmount: refundAmt,
        previousPaymentStatus,
        reason: order.refundReason,
        transactionId: order.refundTransactionId,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${refundAmt} processed for order ${order.orderNumber}`,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Finance] Error processing refund:', error);
    return res.status(500).json({ success: false, error: 'Failed to process refund' });
  }
}

/**
 * POST /api/v1/admin/orders/:orderId/returns
 * Review and decide return requests on delivered orders.
 */
export async function decideOrderReturn(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const { decision, reason, restoreInventory } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be "approve" or "reject"' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (decision === 'approve') {
      order.returnStatus = 'approved';
      order.returnDecidedAt = new Date();
      order.returnDecisionReason = reason || 'Return accepted by roastery customer support';
      order.returnDecidedBy = {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
      };

      // Set payment to refund_pending if paid
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refund_pending';
      }

      // If requested to restore inventory and not yet restored
      if (restoreInventory && !order.inventoryRestored) {
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
              reason: `Customer return restocked for order ${order.orderNumber}`,
              orderId: order._id,
              orderNumber: order.orderNumber,
              actor: {
                userId: req.user?._id,
                name: req.user?.name || 'Administrator',
                email: req.user?.email || 'admin@firedupcoffee.com',
                role: req.user?.staffRole || req.user?.role || 'admin',
              },
            });
          }
        }
        order.inventoryRestored = true;
      }
    } else {
      order.returnStatus = 'rejected';
      order.returnDecidedAt = new Date();
      order.returnDecisionReason = reason || 'Return rejected per roastery policy';
      order.returnDecidedBy = {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
      };
    }

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Return decision: ${decision.toUpperCase()} — ${reason || 'Processed'}`,
      updatedBy: req.user?.name || 'Administrator',
    });

    await order.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: `ORDER_RETURN_${decision.toUpperCase()}`,
      resource: 'Order',
      resourceId: order._id.toString(),
      details: {
        orderNumber: order.orderNumber,
        decision,
        reason,
        inventoryRestored: order.inventoryRestored,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Order return ${decision}d successfully`,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Finance] Error deciding return:', error);
    return res.status(500).json({ success: false, error: 'Failed to process return decision' });
  }
}
