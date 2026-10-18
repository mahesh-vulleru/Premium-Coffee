import type { Response } from 'express';
import mongoose from 'mongoose';
import { Order, type IOrderItem } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { Promotion } from '../models/Promotion.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getEffectiveProductPrice } from '../utils/pricingHelper.js';

// GET /api/v1/orders
export async function getCustomerOrders(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => o.toJSON()),
    });
  } catch (error: any) {
    console.error('[Order Controller] Error fetching customer orders:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve order history' });
  }
}

// GET /api/v1/orders/:id
export async function getCustomerOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order identifier' });
    }

    const order = await Order.findOne({ _id: id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or unauthorized' });
    }

    return res.status(200).json({
      success: true,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Order Controller] Error fetching order details:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve order details' });
  }
}

// POST /api/v1/orders (Retail Checkout)
export async function createRetailOrder(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { shippingAddress, paymentMethod = 'credit_card', promoCode, notes } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your shopping cart is empty' });
    }

    // Size multipliers
    const sizeMultipliers: Record<string, number> = {
      '250g': 1.0,
      '500g': 1.85,
      '1kg': 3.4,
    };

    let subtotal = 0;
    let totalKg = 0;
    const orderItems: IOrderItem[] = [];

    for (const item of cart.items) {
      const prodId = (item.product as any)?._id || (item.product as any)?.id;
      const product = await Product.findById(prodId);
      if (!product || product.isArchived || product.isPublished === false) {
        return res.status(400).json({
          success: false,
          error: `Product ${product?.name || 'item'} is no longer available in the catalogue.`,
        });
      }

      if (product.stockAvailable < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stockAvailable}, requested: ${item.quantity}.`,
        });
      }

      const mult = sizeMultipliers[item.size] || 1.0;
      const { effectivePrice } = getEffectiveProductPrice(product);
      const unitPrice = Math.round(effectivePrice * mult);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      let kgPerBag = 0.25;
      if (item.size === '500g') kgPerBag = 0.5;
      else if (item.size === '1kg') kgPerBag = 1.0;
      totalKg += kgPerBag * item.quantity;

      // Deduct warehouse stock
      product.stockAvailable = Math.max(0, product.stockAvailable - item.quantity);
      await product.save();

      orderItems.push({
        product: product._id as any,
        productName: product.name,
        quantity: item.quantity,
        size: item.size,
        grind: item.grind,
        unitPrice,
        lineTotal,
      });
    }

    // Apply promo code if valid
    let discountPercent = 0;
    let discountAmount = 0;
    let appliedPromo: any = null;
    let discountTier: string | undefined = undefined;

    if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
      const codeClean = promoCode.trim().toUpperCase();
      const now = new Date();

      let promo = await Promotion.findOne({ code: codeClean, isArchived: { $ne: true } });
      if (!promo && codeClean === 'FIREDUP15') {
        promo = await Promotion.create({
          code: 'FIREDUP15',
          description: '15% off first order for Roaster Club members',
          discountType: 'percentage',
          discountValue: 15,
          minOrderAmount: 0,
          isActive: true,
          isArchived: false,
        });
      }

      if (!promo) {
        return res.status(400).json({
          success: false,
          error: `Invalid promotion coupon code: "${codeClean}".`,
        });
      }

      if (!promo.isActive) {
        return res.status(400).json({
          success: false,
          error: `Promotion coupon "${codeClean}" is no longer active.`,
        });
      }

      if (promo.startDate && now < new Date(promo.startDate)) {
        return res.status(400).json({
          success: false,
          error: `Promotion coupon "${codeClean}" has not started yet.`,
        });
      }

      if (promo.endDate && now > new Date(promo.endDate)) {
        return res.status(400).json({
          success: false,
          error: `Promotion coupon "${codeClean}" has expired.`,
        });
      }

      if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
        return res.status(400).json({
          success: false,
          error: `Coupon "${codeClean}" requires a minimum order subtotal of ₹${promo.minOrderAmount}.`,
        });
      }

      if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
        return res.status(400).json({
          success: false,
          error: `Promotion coupon "${codeClean}" usage limit has been reached.`,
        });
      }

      if (promo.discountType === 'percentage') {
        discountPercent = promo.discountValue;
        discountAmount = Math.round(((subtotal * promo.discountValue) / 100) * 100) / 100;
        if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
          discountAmount = promo.maxDiscountAmount;
        }
      } else {
        discountAmount = Math.min(subtotal, promo.discountValue);
      }

      discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
      appliedPromo = promo;
      discountTier = `Promo ${promo.code}`;
    }

    // Free shipping threshold ₹999
    const shippingFee = subtotal >= 999 ? 0 : 99;
    const taxPercent = 5;
    const taxAmount = Math.round(((subtotal - discountAmount) * 0.05) * 100) / 100;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // Idempotency: Prevent duplicate order within 10s
    const recentDuplicate = await Order.findOne({
      userId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 10000) },
      totalAmount,
    });
    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Order already processed (idempotent)',
        order: recentDuplicate.toJSON(),
      });
    }

    // Delivery address from payload or user profile
    const profileAddr = req.user.shippingAddress;
    const finalAddress = {
      contactName: shippingAddress?.contactName || req.user.name,
      phone: shippingAddress?.phone || req.user.phone,
      street: shippingAddress?.street || profileAddr?.street || 'Doorstep Delivery',
      apartment: shippingAddress?.apartment || profileAddr?.apartment || '',
      city: shippingAddress?.city || profileAddr?.city || 'Bengaluru',
      state: shippingAddress?.state || profileAddr?.state || 'Karnataka',
      postalCode: shippingAddress?.postalCode || profileAddr?.postalCode || '560001',
      country: shippingAddress?.country || profileAddr?.country || 'India',
    };

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `FD-${dateStr}-${randSuffix}`;

    const order = await Order.create({
      orderNumber,
      userId: req.user._id,
      orderType: 'retail',
      items: orderItems,
      totalKg,
      subtotal,
      discountTier,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      shippingFee,
      totalAmount,
      shippingAddress: finalAddress,
      paymentMethod:
        paymentMethod === 'card'
          ? 'credit_card'
          : ['net_terms', 'bank_transfer', 'credit_card', 'cod'].includes(paymentMethod)
            ? paymentMethod
            : 'credit_card',
      paymentStatus: 'paid', // retail mock checkout succeeds
      orderStatus: 'received',
      cancellationStatus: 'none',
      inventoryRestored: false,
      statusHistory: [
        {
          status: 'received',
          timestamp: new Date(),
          note: 'Order confirmed and scheduled for roastery queue.',
          updatedBy: req.user.name || 'Customer',
        },
      ],
      notes: notes ? String(notes).trim() : undefined,
    });

    // Atomically increment promotion usage count
    if (appliedPromo) {
      await Promotion.findByIdAndUpdate(appliedPromo._id, { $inc: { usageCount: 1 } });
    }

    // Record InventoryLog for each item deducted
    try {
      for (const item of orderItems) {
        const prod = await Product.findById(item.product);
        if (prod) {
          await InventoryLog.create({
            productId: item.product,
            productName: item.productName,
            previousStock: prod.stockAvailable + item.quantity,
            newStock: prod.stockAvailable,
            quantityChange: -item.quantity,
            type: 'retail_order',
            reason: `Retail customer checkout order ${orderNumber}`,
            orderId: order._id,
            orderNumber,
            actor: {
              userId: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role || 'customer',
            },
            timestamp: new Date(),
          });
        }
      }
    } catch (logErr) {
      console.warn('[Order Controller] Warning: Failed to record order inventory logs:', logErr);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    console.log(`[Retail Order] Order ${orderNumber} created for customer ${req.user.email}: ₹${totalAmount}`);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Your batch has been scheduled for drum roasting.',
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Order Controller] Retail order creation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process order' });
  }
}

/**
 * POST /api/v1/orders/validate-coupon
 * Validates a coupon code against current cart subtotal
 */
export async function validateCoupon(req: AuthenticatedRequest, res: Response) {
  try {
    const { code } = req.body;
    const subtotal = req.body.subtotal !== undefined ? req.body.subtotal : req.body.orderTotal ?? 0;
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Promo coupon code is required' });
    }

    const codeClean = code.trim().toUpperCase();
    const now = new Date();

    let promo = await Promotion.findOne({ code: codeClean, isArchived: { $ne: true } });
    if (!promo && codeClean === 'FIREDUP15') {
      promo = await Promotion.create({
        code: 'FIREDUP15',
        description: '15% off first order for Roaster Club members',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 0,
        isActive: true,
        isArchived: false,
      });
    }

    if (!promo) {
      return res.status(404).json({ success: false, valid: false, error: `Invalid coupon code "${codeClean}"` });
    }
    if (!promo.isActive) {
      return res.status(400).json({ success: false, valid: false, error: `Coupon "${codeClean}" is currently inactive` });
    }
    if (promo.startDate && now < new Date(promo.startDate)) {
      return res.status(400).json({ success: false, valid: false, error: `Coupon "${codeClean}" has not started yet` });
    }
    if (promo.endDate && now > new Date(promo.endDate)) {
      return res.status(400).json({ success: false, valid: false, error: `Coupon "${codeClean}" has expired` });
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ success: false, valid: false, error: `Coupon "${codeClean}" limit reached` });
    }
    if (promo.minOrderAmount && Number(subtotal) < promo.minOrderAmount) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: `Order subtotal must be at least ₹${promo.minOrderAmount} to use this coupon`,
      });
    }

    const subtotalNum = Number(subtotal) || 0;
    let calculatedDiscount = 0;
    if (promo.discountType === 'percentage') {
      calculatedDiscount = Math.round(((subtotalNum * promo.discountValue) / 100) * 100) / 100;
      if (promo.maxDiscountAmount) {
        calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscountAmount);
      }
    } else {
      calculatedDiscount = Math.min(subtotalNum, promo.discountValue);
    }

    return res.status(200).json({
      success: true,
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: calculatedDiscount,
      message: `Coupon applied: ${promo.description}`,
    });
  } catch (error) {
    console.error('[Order Controller] Error validating coupon:', error);
    return res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
}

/**
 * POST /api/v1/orders/:id/cancel
 * Customer submits a cancellation request for their own order with optional reason
 */
export async function requestOrderCancellation(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order identifier' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Customer can only cancel their own orders (strict multi-tenant data isolation)
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, error: 'Order not found or unauthorized' });
    }

    // Ineligible states check
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Order is already cancelled' });
    }

    if (order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Delivered orders cannot be cancelled. Please contact customer support for returns.',
      });
    }

    if (order.orderStatus === 'dispatched') {
      return res.status(400).json({
        success: false,
        error: 'Cancellation unavailable: This order has already been dispatched with our courier partner.',
      });
    }

    if (order.orderStatus === 'roasting' || order.orderStatus === 'packed') {
      return res.status(400).json({
        success: false,
        error: `Cancellation unavailable: Your batch is currently in the ${order.orderStatus} stage at the roastery.`,
      });
    }

    // Prevent duplicate cancellation requests
    if (order.cancellationStatus === 'requested') {
      return res.status(400).json({
        success: false,
        error: 'A cancellation request for this order is already pending administrative review.',
      });
    }

    const cleanReason = reason && typeof reason === 'string' ? reason.trim() : 'Customer requested cancellation';

    order.cancellationStatus = 'requested';
    order.cancellationReason = cleanReason;
    order.cancellationRequestedAt = new Date();

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Cancellation requested: "${cleanReason}"`,
      updatedBy: req.user.name || 'Customer',
    });

    await order.save();

    console.log(
      `[Order Cancellation] Request submitted for order ${order.orderNumber} by ${req.user.email}: "${cleanReason}"`
    );

    return res.status(200).json({
      success: true,
      message: 'Cancellation request submitted successfully. Our roastery team will review your request.',
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Order Controller] Error requesting cancellation:', error);
    return res.status(500).json({ success: false, error: 'Failed to process cancellation request' });
  }
}


