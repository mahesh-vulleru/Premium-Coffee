import type { Response } from 'express';
import mongoose from 'mongoose';
import { Cart, type ICart } from '../models/Cart.js';
import { Product, type IProduct } from '../models/Product.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// Calculate cart pricing on the server based on authoritative database product prices
function calculateCartPricing(cart: ICart) {
  let subtotal = 0;
  let itemCount = 0;

  const populatedItems: any[] = [];

  for (const item of cart.items) {
    const product = item.product as unknown as IProduct;
    if (!product || !product.price) continue;

    // Size multiplier: 250g = 1x, 500g = 1.85x, 1kg = 3.4x (matching frontend formula)
    let sizeMultiplier = 1;
    if (item.size === '500g') sizeMultiplier = 1.85;
    else if (item.size === '1kg') sizeMultiplier = 3.4;

    const unitPrice = Math.round(product.price * sizeMultiplier);
    const lineTotal = unitPrice * item.quantity;

    subtotal += lineTotal;
    itemCount += item.quantity;

    populatedItems.push({
      _id: (item as any)._id?.toString(),
      product: typeof (product as any).toJSON === 'function' ? (product as any).toJSON() : product,
      quantity: item.quantity,
      grind: item.grind,
      size: item.size,
      frequency: item.frequency,
      unitPrice,
      lineTotal,
    });
  }

  // Free shipping threshold ₹999; shipping fee ₹99
  const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shippingFee;

  return {
    items: populatedItems,
    itemCount,
    subtotal,
    shippingFee,
    total,
  };
}

// GET /api/v1/cart
export async function getCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const pricing = calculateCartPricing(cart);

    return res.status(200).json({
      success: true,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Cart Controller] Error fetching cart:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve cart' });
  }
}

// POST /api/v1/cart/items
export async function addToCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { productId, quantity = 1, grind = 'Whole Bean', size = '250g', frequency } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    // Verify product exists in database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found in catalogue' });
    }

    if (product.isArchived || product.isPublished === false) {
      return res.status(400).json({
        success: false,
        error: 'Product roast is currently unpublished or unavailable for purchase.',
      });
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Check if matching item already in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.grind === grind &&
        item.size === size &&
        item.frequency === (frequency || undefined)
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qtyToAdd;
      const maxStock = product.stockAvailable > 0 ? product.stockAvailable : 20;
      cart.items[existingIndex].quantity = Math.min(newQty, maxStock);
    } else {
      cart.items.push({
        product: product._id as any,
        quantity: Math.min(qtyToAdd, product.stockAvailable || 20),
        grind,
        size,
        frequency: frequency || undefined,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    const pricing = calculateCartPricing(cart);

    return res.status(200).json({
      success: true,
      message: `Added ${product.name} to cart`,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Cart Controller] Error adding to cart:', error);
    return res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
}

// PUT /api/v1/cart/items/:itemId
export async function updateCartItem(req: AuthenticatedRequest, res: Response) {
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
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    const newQty = parseInt(quantity, 10);
    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(cart.items[itemIndex].product);
      const maxStock = product && product.stockAvailable > 0 ? product.stockAvailable : 20;
      cart.items[itemIndex].quantity = Math.min(newQty, maxStock);
    }

    await cart.save();
    await cart.populate('items.product');

    const pricing = calculateCartPricing(cart);

    return res.status(200).json({
      success: true,
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Cart Controller] Error updating cart item:', error);
    return res.status(500).json({ success: false, error: 'Failed to update cart item' });
  }
}

// DELETE /api/v1/cart/items/:itemId
export async function removeCartItem(req: AuthenticatedRequest, res: Response) {
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

    const pricing = calculateCartPricing(cart);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Cart Controller] Error removing cart item:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
}

// DELETE /api/v1/cart
export async function clearCart(req: AuthenticatedRequest, res: Response) {
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
      message: 'Cart cleared',
      cart: {
        items: [],
        itemCount: 0,
        subtotal: 0,
        shippingFee: 0,
        total: 0,
      },
    });
  } catch (error: any) {
    console.error('[Cart Controller] Error clearing cart:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
}

// POST /api/v1/cart/sync (Merge guest cart into authenticated customer cart)
export async function syncCart(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { items = [] } = req.body;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    if (Array.isArray(items)) {
      for (const guestItem of items) {
        const prodId = guestItem.product?.id || guestItem.productId;
        if (!prodId || !mongoose.Types.ObjectId.isValid(prodId)) continue;

        const product = await Product.findById(prodId);
        if (!product) continue;

        const qty = Math.max(1, parseInt(guestItem.quantity, 10) || 1);
        const grind = guestItem.grind || 'Whole Bean';
        const size = guestItem.size || '250g';
        const frequency = guestItem.frequency || undefined;

        const existingIndex = cart.items.findIndex(
          (item) =>
            item.product.toString() === prodId &&
            item.grind === grind &&
            item.size === size &&
            item.frequency === frequency
        );

        if (existingIndex > -1) {
          cart.items[existingIndex].quantity = Math.min(
            cart.items[existingIndex].quantity + qty,
            product.stockAvailable || 20
          );
        } else {
          cart.items.push({
            product: product._id as any,
            quantity: Math.min(qty, product.stockAvailable || 20),
            grind,
            size,
            frequency,
          });
        }
      }

      await cart.save();
    }

    await cart.populate('items.product');
    const pricing = calculateCartPricing(cart);

    return res.status(200).json({
      success: true,
      message: 'Cart synchronized with account',
      cart: pricing,
    });
  } catch (error: any) {
    console.error('[Cart Controller] Error syncing cart:', error);
    return res.status(500).json({ success: false, error: 'Failed to sync cart' });
  }
}

