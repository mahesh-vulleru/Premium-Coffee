import type { Response } from 'express';
import mongoose from 'mongoose';
import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// GET /api/v1/wishlist
export async function getWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
    }

    return res.status(200).json({
      success: true,
      wishlist: wishlist.products.map((p: any) =>
        typeof p.toJSON === 'function' ? p.toJSON() : p
      ),
      count: wishlist.products.length,
    });
  } catch (error: any) {
    console.error('[Wishlist Controller] Error fetching wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wishlist' });
  }
}

// POST /api/v1/wishlist/:productId (Toggle / Add)
export async function toggleWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex(
      (p) => p.toString() === productId
    );

    let added = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
      added = false;
    } else {
      wishlist.products.push(product._id as any);
      added = true;
    }

    await wishlist.save();
    await wishlist.populate('products');

    return res.status(200).json({
      success: true,
      action: added ? 'added' : 'removed',
      message: added ? `Saved "${product.name}" to wishlist` : `Removed "${product.name}" from wishlist`,
      wishlist: wishlist.products.map((p: any) =>
        typeof p.toJSON === 'function' ? p.toJSON() : p
      ),
      count: wishlist.products.length,
    });
  } catch (error: any) {
    console.error('[Wishlist Controller] Error toggling wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
}

// DELETE /api/v1/wishlist/:productId
export async function removeFromWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return res.status(200).json({ success: true, wishlist: [], count: 0 });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate('products');

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: wishlist.products.map((p: any) =>
        typeof p.toJSON === 'function' ? p.toJSON() : p
      ),
      count: wishlist.products.length,
    });
  } catch (error: any) {
    console.error('[Wishlist Controller] Error removing from wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
  }
}

// POST /api/v1/wishlist/sync (Sync guest wishlist with user account)
export async function syncWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { productIds = [] } = req.body;

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, products: [] });
    }

    if (Array.isArray(productIds)) {
      for (const id of productIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) continue;
        const exists = wishlist.products.some((p) => p.toString() === id);
        if (!exists) {
          const product = await Product.findById(id);
          if (product) {
            wishlist.products.push(product._id as any);
          }
        }
      }
      await wishlist.save();
    }

    await wishlist.populate('products');

    return res.status(200).json({
      success: true,
      message: 'Wishlist synchronized',
      wishlist: wishlist.products.map((p: any) =>
        typeof p.toJSON === 'function' ? p.toJSON() : p
      ),
      count: wishlist.products.length,
    });
  } catch (error: any) {
    console.error('[Wishlist Controller] Error syncing wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to sync wishlist' });
  }
}

