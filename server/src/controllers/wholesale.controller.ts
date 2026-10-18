import type { Response } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { Product, type IProduct } from '../models/Product.js';
import { Cart, type ICart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';

// Convert pack size string to weight in kilograms
export function getWeightInKg(size: string): number {
  switch (size) {
    case '10kg':
      return 10;
    case '5kg':
      return 5;
    case '1kg':
      return 1;
    case '500g':
      return 0.5;
    case '250g':
    default:
      return 0.25;
  }
}

// Calculate server-authoritative wholesale pricing & volume tier rules
export function calculateWholesaleCartPricing(cart: ICart) {
  let rawRetailSubtotal = 0;
  let totalKg = 0;
  let itemCount = 0;

  const populatedItems: any[] = [];

  for (const item of cart.items) {
    const product = item.product as unknown as IProduct;
    if (!product || !product.price) continue;

    const weightPerUnitKg = getWeightInKg(item.size);
    const lineWeightKg = weightPerUnitKg * item.quantity;
    totalKg += lineWeightKg;
    itemCount += item.quantity;

    // Retail base per kg is product.price * 3.4
    const retailKgPrice = Math.round(product.price * 3.4);
    const rawLineRetail = Math.round(retailKgPrice * lineWeightKg);
    rawRetailSubtotal += rawLineRetail;

    const prodJson = typeof (product as any).toJSON === 'function' ? (product as any).toJSON() : product;
    const prodObj = {
      ...prodJson,
      _id: (product as any)._id?.toString() || prodJson.id,
      id: prodJson.id || (product as any)._id?.toString(),
    };

    populatedItems.push({
      _id: (item as any)._id?.toString(),
      product: prodObj,
      quantity: item.quantity,
      size: item.size,
      grind: item.grind,
      weightPerUnitKg,
      lineWeightKg,
      retailKgPrice,
      rawLineRetail,
    });
  }

  // Volume Tier Calculation
  // Minimum Order Quantity: 5kg
  const moqKg = 5;
  const isMoqMet = totalKg >= moqKg;

  let discountPercent = 0;
  let discountTier = 'Standard Wholesale (Under 5kg)';

  if (totalKg >= 50) {
    discountPercent = 42;
    discountTier = 'Tier 3: Roastery Distributor (50kg+ • 42% off)';
  } else if (totalKg >= 20) {
    discountPercent = 35;
    discountTier = 'Tier 2: Commercial Cafe Partner (20 - 49kg • 35% off)';
  } else if (totalKg >= 5) {
    discountPercent = 25;
    discountTier = 'Tier 1: Micro-Cafe Partner (5 - 19kg • 25% off)';
  }

  // Calculate discounted unit prices and line totals
  const items = populatedItems.map((item) => {
    const discountedKgPrice = Math.round(item.retailKgPrice * (1 - discountPercent / 100));
    const unitPrice = Math.round(discountedKgPrice * item.weightPerUnitKg);
    const lineTotal = unitPrice * item.quantity;

    return {
      ...item,
      discountedKgPrice,
      unitPrice,
      lineTotal,
    };
  });

  const subtotal = items.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const discountAmount = Math.max(0, rawRetailSubtotal - subtotal);

  // Free freight threshold: 25kg. Below 25kg: ₹450 flat courier freight
  const freeFreightThresholdKg = 25;
  const freeShippingQualified = totalKg >= freeFreightThresholdKg;
  const shippingFee = totalKg === 0 || freeShippingQualified ? 0 : 450;

  // 5% standard coffee commercial GST
  const taxPercent = 5;
  const taxAmount = Math.round(subtotal * (taxPercent / 100));

  const finalTotal = subtotal + taxAmount + shippingFee;

  return {
    items,
    itemCount,
    totalKg: Math.round(totalKg * 100) / 100,
    moqKg,
    isMoqMet,
    discountTier,
    discountPercent,
    rawRetailSubtotal,
    subtotal,
    discountAmount,
    taxPercent,
    taxAmount,
    shippingFee,
    freeFreightThresholdKg,
    freeShippingQualified,
    finalTotal,
    paymentTerms: 'Net 15 upon dispatch',
  };
}

/**
 * GET /api/v1/wholesale/status
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
    const { category, search, sort } = req.query;

    const filter: Record<string, any> = { stockAvailable: { $gt: 0 } };

    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { origin: { $regex: search.trim(), $options: 'i' } },
        { tastingNotes: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    let query = Product.find(filter);

    if (sort === 'price_asc') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ price: -1 });
    } else if (sort === 'name') {
      query = query.sort({ name: 1 });
    } else {
      query = query.sort({ price: 1 });
    }

    const products = await query.exec();

    const wholesaleProducts = products.map((p) => {
      const retailBasePrice = p.price;
      const retailKgPrice = Math.round(retailBasePrice * 3.4);
      // Standard commercial discount 35%
      const wholesalePricePerKg = Math.round(retailKgPrice * 0.65);

      return {
        _id: p._id.toString(),
        id: p._id.toString(),
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        image: p.image,
        origin: p.origin,
        roastLevel: p.roastLevel,
        tastingNotes: p.tastingNotes,
        description: p.description,
        retailBasePrice,
        retailKgPrice,
        wholesalePricePerKg,
        commercialDiscountPercent: 35,
        minOrderKg: 5,
        packSizes: ['1kg', '5kg', '10kg'],
        stockAvailableKg: Math.floor(p.stockAvailable * 1.5),
      };
    });

    return res.status(200).json({
      success: true,
      partner: req.user?.wholesaleDetails?.businessName || req.user?.name,
      status: 'approved',
      pricingPolicy: {
        standardDiscountPercent: 35,
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
 */
export async function getWholesalePriceSheet(req: AuthenticatedRequest, res: Response) {
  return res.status(200).json({
    success: true,
    title: 'Firedup Specialty Coffee Commercial Roastery 2026 Price Sheet',
    issuedTo: req.user?.wholesaleDetails?.businessName || req.user?.name,
    validUntil: '2026-12-31',
    currency: 'INR',
    tiers: [
      { tier: 'Tier 1: Micro-Cafe Partner (5 - 19 kg/mo)', discountPercent: 25, dispatchWindowHours: 48, moq: '5 kg' },
      { tier: 'Tier 2: Commercial Cafe Partner (20 - 49 kg/mo)', discountPercent: 35, dispatchWindowHours: 24, moq: '5 kg' },
      { tier: 'Tier 3: Roastery Distributor (50+ kg/mo)', discountPercent: 42, dispatchWindowHours: 24, moq: '5 kg' },
    ],
    terms: 'Payment: Net 15 upon dispatch. Free freight applied on all orders 25kg and above.',
  });
}

/**
 * GET /api/v1/wholesale/cart
 */
export async function getWholesaleCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const pricing = calculateWholesaleCartPricing(cart);

    return res.status(200).json({
      success: true,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Wholesale Cart] Error retrieving wholesale cart:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wholesale cart' });
  }
}

/**
 * POST /api/v1/wholesale/cart/items
 */
export async function addToWholesaleCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { productId, quantity = 1, size = '1kg', grind = 'Whole Bean' } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'Valid product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found in roastery catalogue' });
    }

    const validSizes = ['1kg', '5kg', '10kg'];
    if (!validSizes.includes(size)) {
      return res.status(400).json({ success: false, error: 'Wholesale pack size must be 1kg, 5kg, or 10kg' });
    }

    const validGrinds = ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew', 'Commercial Bulk Grind'];
    if (!validGrinds.includes(grind)) {
      return res.status(400).json({ success: false, error: 'Invalid commercial grind specification' });
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const weightPerUnit = getWeightInKg(size);
    const stockAvailableKg = Math.floor(product.stockAvailable * 1.5);

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size && item.grind === grind
    );

    let currentQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const requestedTotalKg = (currentQty + qtyToAdd) * weightPerUnit;

    if (requestedTotalKg > stockAvailableKg) {
      const allowedMaxUnits = Math.floor(stockAvailableKg / weightPerUnit);
      if (allowedMaxUnits <= currentQty) {
        return res.status(400).json({
          success: false,
          error: `Insufficient roastery inventory. Only ${stockAvailableKg}kg available for ${product.name}.`,
        });
      }
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += qtyToAdd;
    } else {
      cart.items.push({
        product: product._id as any,
        quantity: qtyToAdd,
        size,
        grind,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    const pricing = calculateWholesaleCartPricing(cart);

    return res.status(200).json({
      success: true,
      message: `Added ${qtyToAdd}x ${size} bag(s) of ${product.name} to bulk cart`,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Wholesale Cart] Error adding item:', error);
    return res.status(500).json({ success: false, error: 'Failed to add item to wholesale cart' });
  }
}

/**
 * PUT /api/v1/wholesale/cart/items/:itemId
 */
export async function updateWholesaleCartItem(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => (item as any)._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in wholesale cart' });
    }

    const newQty = parseInt(quantity, 10);
    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const targetItem = cart.items[itemIndex];
      const product = await Product.findById(targetItem.product);
      if (product) {
        const weightPerUnit = getWeightInKg(targetItem.size);
        const stockAvailableKg = Math.floor(product.stockAvailable * 1.5);
        const maxUnits = Math.max(1, Math.floor(stockAvailableKg / weightPerUnit));
        targetItem.quantity = Math.min(newQty, maxUnits);
      } else {
        targetItem.quantity = newQty;
      }
    }

    await cart.save();
    await cart.populate('items.product');

    const pricing = calculateWholesaleCartPricing(cart);

    return res.status(200).json({
      success: true,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Wholesale Cart] Error updating cart item:', error);
    return res.status(500).json({ success: false, error: 'Failed to update item quantity' });
  }
}

/**
 * DELETE /api/v1/wholesale/cart/items/:itemId
 */
export async function removeWholesaleCartItem(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => (item as any)._id.toString() !== itemId);
    await cart.save();
    await cart.populate('items.product');

    const pricing = calculateWholesaleCartPricing(cart);

    return res.status(200).json({
      success: true,
      message: 'Item removed from wholesale cart',
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Wholesale Cart] Error removing item:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
}

/**
 * DELETE /api/v1/wholesale/cart
 */
export async function clearWholesaleCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Wholesale cart cleared',
    });
  } catch (error: any) {
    console.error('[Wholesale Cart] Error clearing cart:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
}

/**
 * POST /api/v1/wholesale/orders
 * Submit wholesale order after rigorous server-side verification of MOQ, stock, volume tiers, and terms
 */
export async function createWholesaleOrder(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { deliveryAddress, notes, paymentMethod = 'net_terms' } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Wholesale cart is empty' });
    }

    const pricing = calculateWholesaleCartPricing(cart);

    // Enforce Minimum Order Quantity (5kg)
    if (!pricing.isMoqMet) {
      return res.status(400).json({
        success: false,
        error: `Order quantity of ${pricing.totalKg}kg does not meet the minimum commercial volume of ${pricing.moqKg}kg.`,
      });
    }

    // Idempotency: Prevent duplicate submissions submitted within 10 seconds for the same user
    const recentDuplicate = await Order.findOne({
      userId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 10000) },
      totalAmount: pricing.finalTotal,
    });
    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Order already received and queued for processing (idempotent)',
        order: recentDuplicate.toJSON(),
      });
    }

    // Verify stock and build canonical order items
    const orderItems: any[] = [];

    for (const item of pricing.items) {
      const prodId = item.product?._id || item.product?.id;
      const product = await Product.findById(prodId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.product.name} is no longer available in the catalogue.`,
        });
      }

      if (product.stockAvailable < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stockAvailable} bags, requested: ${item.quantity}.`,
        });
      }

      // Deduct stock from warehouse
      product.stockAvailable = Math.max(0, product.stockAvailable - item.quantity);
      await product.save();

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        size: item.size,
        grind: item.grind,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      });
    }

    // Determine final delivery address from request or verified business profile
    const profileAddr = req.user.wholesaleDetails?.deliveryAddress || req.user.shippingAddress;
    const finalAddress = {
      businessName: req.user.wholesaleDetails?.businessName || req.user.name,
      contactName: deliveryAddress?.contactName || req.user.name,
      phone: deliveryAddress?.phone || req.user.phone,
      street: deliveryAddress?.street || profileAddr?.street || 'Roastery Delivery Bay',
      apartment: deliveryAddress?.apartment || profileAddr?.apartment || '',
      city: deliveryAddress?.city || profileAddr?.city || 'Bengaluru',
      state: deliveryAddress?.state || profileAddr?.state || 'Karnataka',
      postalCode: deliveryAddress?.postalCode || profileAddr?.postalCode || '560001',
      country: deliveryAddress?.country || profileAddr?.country || 'India',
    };

    // Generate unique order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `WS-${dateStr}-${randSuffix}`;

    // Create Order with honest payment status: 'terms_approved' for net terms, 'pending' for others
    const validPaymentMethods = ['net_terms', 'bank_transfer', 'credit_card'];
    const chosenMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'net_terms';
    const paymentStatus = chosenMethod === 'net_terms' ? 'terms_approved' : 'pending';

    const order = await Order.create({
      orderNumber,
      userId: req.user._id,
      orderType: 'wholesale',
      items: orderItems,
      totalKg: pricing.totalKg,
      subtotal: pricing.subtotal,
      discountTier: pricing.discountTier,
      discountPercent: pricing.discountPercent,
      discountAmount: pricing.discountAmount,
      taxPercent: pricing.taxPercent,
      taxAmount: pricing.taxAmount,
      shippingFee: pricing.shippingFee,
      totalAmount: pricing.finalTotal,
      shippingAddress: finalAddress,
      paymentMethod: chosenMethod,
      paymentStatus,
      orderStatus: 'received',
      notes: notes ? String(notes).trim() : undefined,
    });

    // Clear cart after successful order creation
    cart.items = [];
    await cart.save();

    console.log(
      `[Wholesale Order] Order ${orderNumber} created for partner ${finalAddress.businessName}: ₹${pricing.finalTotal} (${pricing.totalKg}kg)`
    );

    return res.status(201).json({
      success: true,
      message: `Commercial wholesale order ${orderNumber} submitted successfully.`,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Wholesale Orders] Error creating wholesale order:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit wholesale order' });
  }
}

/**
 * GET /api/v1/wholesale/orders
 * Returns orders scoped exclusively to the authenticated wholesale partner
 */
export async function getWholesaleOrders(req: AuthenticatedRequest, res: Response) {
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
    console.error('[Wholesale Orders] Error fetching orders:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wholesale orders' });
  }
}

/**
 * GET /api/v1/wholesale/orders/:id
 */
export async function getWholesaleOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order identifier' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Verify ownership or admin privileges
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied to this order record' });
    }

    return res.status(200).json({
      success: true,
      order: order.toJSON(),
    });
  } catch (error: any) {
    console.error('[Wholesale Orders] Error fetching order by ID:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve order details' });
  }
}

/**
 * GET /api/v1/wholesale/orders/:id/invoice
 * Generates an official, printable Tax Invoice document
 */
export async function downloadWholesaleInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order identifier' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order record not found' });
    }

    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to download this invoice' });
    }

    const partner = await User.findById(order.userId);
    const taxId = partner?.wholesaleDetails?.taxId || 'GSTIN-PENDING';
    const businessName = order.shippingAddress?.businessName || partner?.wholesaleDetails?.businessName || order.shippingAddress.contactName;

    // Return official HTML Tax Invoice
    const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${order.orderNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #2B170E; background: #FAF6F0; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; border: 1px solid #EBDCCE; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2B170E; padding-bottom: 20px; }
    .brand h1 { margin: 0; font-size: 24px; color: #2B170E; letter-spacing: 1px; }
    .brand p { margin: 4px 0 0 0; color: #8A5934; font-size: 12px; }
    .meta { text-align: right; }
    .meta h2 { margin: 0; font-size: 20px; color: #C85A32; }
    .meta p { margin: 3px 0 0 0; font-size: 12px; color: #532D16; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 13px; }
    .details h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #8A5934; letter-spacing: 0.5px; }
    .table-container { margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #FAF6F0; border-bottom: 1px solid #EBDCCE; color: #532D16; font-size: 11px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #F5ECE1; }
    .totals { margin-top: 20px; margin-left: auto; width: 320px; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals-row.grand { font-size: 16px; font-weight: bold; border-top: 2px solid #2B170E; padding-top: 10px; color: #2B170E; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #EBDCCE; font-size: 11px; color: #8A5934; text-align: center; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: #E0F2FE; color: #0369A1; }
    @media print {
      body { background: #fff; margin: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; text-align: right;">
    <button onclick="window.print()" style="background: #2B170E; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <h1>FIREDUP SPECIALTY COFFEE</h1>
        <p>Commercial Roastery Division • Artisanal Wholesale Supply</p>
        <p>GSTIN: 29AAAAF1234F1Z5 • FSSAI Lic: 11223344000123</p>
      </div>
      <div class="meta">
        <h2>TAX INVOICE</h2>
        <p><strong>Invoice #:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <p><strong>Payment Terms:</strong> ${order.paymentMethod === 'net_terms' ? 'Net 15 upon dispatch' : 'Bank Wire / Advance'}</p>
        <p><strong>Status:</strong> <span class="badge">${order.paymentStatus}</span></p>
      </div>
    </div>

    <div class="details">
      <div>
        <h3>Billed & Shipped To:</h3>
        <p style="margin: 0; font-weight: bold; font-size: 14px;">${businessName}</p>
        <p style="margin: 3px 0 0 0;"><strong>Attn:</strong> ${order.shippingAddress.contactName}</p>
        <p style="margin: 3px 0 0 0;"><strong>Tax / GST ID:</strong> ${taxId}</p>
        <p style="margin: 3px 0 0 0;">${order.shippingAddress.street}${order.shippingAddress.apartment ? ', ' + order.shippingAddress.apartment : ''}</p>
        <p style="margin: 3px 0 0 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
        <p style="margin: 3px 0 0 0;">${order.shippingAddress.country} • Phone: ${order.shippingAddress.phone}</p>
      </div>
      <div>
        <h3>Roastery Dispatch Point:</h3>
        <p style="margin: 0; font-weight: bold;">Firedup Central Roasting Lab</p>
        <p style="margin: 3px 0 0 0;">Plot 42, Specialty Bean Industrial Estate</p>
        <p style="margin: 3px 0 0 0;">Chikmagalur, Karnataka 577101, India</p>
        <p style="margin: 3px 0 0 0;">Email: wholesale@firedupcoffee.com</p>
        <p style="margin: 3px 0 0 0;">Phone: +91 80 4455 6677</p>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Item & Specification</th>
            <th>Pack Size</th>
            <th>Grind</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `<tr>
              <td><strong>${item.productName}</strong></td>
              <td>${item.size}</td>
              <td>${item.grind}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
              <td style="text-align: right;"><strong>₹${item.lineTotal.toLocaleString('en-IN')}</strong></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="totals-row">
        <span>Order Volume:</span>
        <span><strong>${order.totalKg} kg</strong></span>
      </div>
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>₹${order.subtotal.toLocaleString('en-IN')}</span>
      </div>
      ${
        order.discountAmount > 0
          ? `<div class="totals-row" style="color: #059669;">
        <span>Commercial Discount (${order.discountPercent}%):</span>
        <span>-₹${order.discountAmount.toLocaleString('en-IN')}</span>
      </div>`
          : ''
      }
      <div class="totals-row">
        <span>GST (5%):</span>
        <span>₹${order.taxAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row">
        <span>Freight Shipping:</span>
        <span>${order.shippingFee === 0 ? 'FREE (25kg+ Tier)' : '₹' + order.shippingFee.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row grand">
        <span>Invoice Total:</span>
        <span style="color: #C85A32;">₹${order.totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for partnering with Firedup Specialty Coffee. All beans roasted within 48 hours of dispatch.</p>
      <p>Electronic tax invoice generated in compliance with Commercial B2B Roastery Terms. Subject to Karnataka jurisdiction.</p>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(invoiceHtml);
  } catch (error: any) {
    console.error('[Wholesale Invoices] Error generating invoice:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate tax invoice' });
  }
}

/**
 * POST /api/v1/wholesale/orders/:id/reorder
 * Re-validates stock and populates current cart with previous order's items
 */
export async function reorderWholesale(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to reorder from this record' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const addedItems: string[] = [];
    const unavailableItems: string[] = [];

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product || product.stockAvailable <= 0) {
        unavailableItems.push(item.productName);
        continue;
      }

      const weightPerUnit = getWeightInKg(item.size);
      const stockKg = Math.floor(product.stockAvailable * 1.5);
      const allowedUnits = Math.min(item.quantity, Math.max(1, Math.floor(stockKg / weightPerUnit)));

      cart.items.push({
        product: product._id as any,
        quantity: allowedUnits,
        size: item.size,
        grind: item.grind,
      });

      addedItems.push(`${allowedUnits}x ${item.size} of ${product.name}`);
    }

    await cart.save();
    await cart.populate('items.product');

    const pricing = calculateWholesaleCartPricing(cart);

    return res.status(200).json({
      success: true,
      message: `Reordered items added to bulk cart: ${addedItems.join(', ')}`,
      unavailableItems,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Wholesale Orders] Error reordering:', error);
    return res.status(500).json({ success: false, error: 'Failed to process reorder' });
  }
}

/**
 * GET /api/v1/wholesale/dashboard
 * Aggregates real MongoDB statistics for the authenticated partner
 */
export async function getWholesaleDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userId = req.user._id;

    const [totalOrders, pendingOrders, completedOrders, recentOrders] = await Promise.all([
      Order.countDocuments({ userId }),
      Order.countDocuments({ userId, orderStatus: { $in: ['received', 'processing', 'roasting'] } }),
      Order.countDocuments({ userId, orderStatus: 'delivered' }),
      Order.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    // Sum total spend from real orders
    const spendAggregate = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId.toString()) } },
      { $group: { _id: null, totalSpent: { $sum: '$totalAmount' }, totalKg: { $sum: '$totalKg' } } },
    ]);

    const totalSpent = spendAggregate.length > 0 ? spendAggregate[0].totalSpent : 0;
    const totalVolumeOrderedKg = spendAggregate.length > 0 ? spendAggregate[0].totalKg : 0;

    return res.status(200).json({
      success: true,
      businessOverview: {
        businessName: req.user.wholesaleDetails?.businessName || req.user.name,
        businessType: req.user.wholesaleDetails?.businessType || 'cafe',
        contactName: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        taxId: req.user.wholesaleDetails?.taxId || '',
        monthlyVolumeKg: req.user.wholesaleDetails?.monthlyVolumeKg || '50',
        deliveryAddress: req.user.wholesaleDetails?.deliveryAddress || null,
        status: req.user.wholesaleDetails?.status || 'none',
        rejectionReason: req.user.wholesaleDetails?.rejectionReason,
        submittedAt: req.user.wholesaleDetails?.submittedAt,
        reviewedAt: req.user.wholesaleDetails?.reviewedAt,
      },
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent,
        totalVolumeOrderedKg,
      },
      recentOrders: recentOrders.map((o) => o.toJSON()),
    });
  } catch (error: any) {
    console.error('[Wholesale Dashboard] Error retrieving dashboard data:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wholesale dashboard' });
  }
}

/**
 * PUT /api/v1/wholesale/profile
 * Allows updating business details, contact info, and delivery address.
 * Strictly prevents modification of role, wholesaleStatus, and rejectionReason.
 */
export async function updateWholesaleProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      contactName,
      phone,
      businessName,
      businessType,
      taxId,
      monthlyVolumeKg,
      deliveryAddress,
    } = req.body;

    if (contactName !== undefined) {
      if (typeof contactName !== 'string' || contactName.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Contact person name must be at least 2 characters.' });
      }
      req.user.name = contactName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.trim().length < 7) {
        return res.status(400).json({ success: false, error: 'Contact phone must be at least 7 characters.' });
      }
      req.user.phone = phone.trim();
    }

    if (!req.user.wholesaleDetails) {
      req.user.wholesaleDetails = {
        businessName: businessName || req.user.name,
        taxId: taxId || '',
        businessType: businessType || 'cafe',
        monthlyVolumeKg: monthlyVolumeKg || '50',
        deliveryAddress: deliveryAddress || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
        },
        status: 'pending',
        submittedAt: new Date(),
      };
    }

    if (businessName !== undefined) {
      if (typeof businessName !== 'string' || businessName.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Business name must be at least 2 characters.' });
      }
      req.user.wholesaleDetails.businessName = businessName.trim();
    }

    if (businessType !== undefined) {
      const allowed = ['cafe', 'restaurant', 'office', 'retailer', 'hotel', 'other'];
      if (!allowed.includes(businessType)) {
        return res.status(400).json({ success: false, error: 'Invalid business classification type.' });
      }
      req.user.wholesaleDetails.businessType = businessType;
    }

    if (taxId !== undefined) {
      if (typeof taxId !== 'string' || taxId.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Commercial tax/GST ID must be at least 3 characters.' });
      }
      req.user.wholesaleDetails.taxId = taxId.trim().toUpperCase();
    }

    if (monthlyVolumeKg !== undefined) {
      req.user.wholesaleDetails.monthlyVolumeKg = String(monthlyVolumeKg).trim();
    }

    if (deliveryAddress) {
      const { street, apartment, city, state, postalCode, country } = deliveryAddress;
      if (!street || !city || !state || !postalCode) {
        return res.status(400).json({
          success: false,
          error: 'Street, city, state, and postal code are required for delivery address.',
        });
      }
      req.user.wholesaleDetails.deliveryAddress = {
        street: String(street).trim(),
        apartment: apartment ? String(apartment).trim() : '',
        city: String(city).trim(),
        state: String(state).trim(),
        postalCode: String(postalCode).trim(),
        country: country ? String(country).trim() : 'India',
      };
    }

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Wholesale business profile updated successfully',
      user: req.user.toJSON(),
    });
  } catch (error: any) {
    console.error('[Wholesale Profile] Error saving profile:', error);
    return res.status(500).json({ success: false, error: 'Failed to update wholesale profile' });
  }
}
