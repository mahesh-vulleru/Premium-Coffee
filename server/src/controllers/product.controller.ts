import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

// GET /api/v1/products
export async function getProducts(req: Request, res: Response) {
  try {
    const {
      search,
      category,
      roastLevel,
      tag,
      sort = 'featured',
      page = '1',
      limit = '50',
    } = req.query;

    const filterQuery: Record<string, any> = {};

    // Category filter
    if (category && category !== 'all') {
      filterQuery.category = category;
    }

    // Roast level filter
    if (roastLevel && roastLevel !== 'all') {
      filterQuery.roastLevel = roastLevel;
    }

    // Tag / Special filter
    if (tag) {
      if (tag === 'sale') {
        filterQuery.isSale = true;
      } else if (['new_arrivals', 'best_sellers', 'top_rates'].includes(tag as string)) {
        filterQuery.tag = tag;
      }
    }

    // Search filter across text fields
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filterQuery.$or = [
        { name: searchRegex },
        { origin: searchRegex },
        { tastingNotes: searchRegex },
        { description: searchRegex },
        { subtitle: searchRegex },
      ];
    }

    // Sorting
    let sortOptions: Record<string, any> = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1, reviewsCount: -1 };
    } else if (sort === 'reviews') {
      sortOptions = { reviewsCount: -1 };
    } else if (sort === 'name') {
      sortOptions = { name: 1 };
    } else if (sort === 'featured') {
      sortOptions = { rating: -1, price: 1 };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filterQuery);
    const products = await Product.find(filterQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      products: products.map((p) => p.toJSON()),
    });
  } catch (error: any) {
    console.error('[Product Controller] Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products from catalogue.',
    });
  }
}

// GET /api/v1/products/:id
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    let product = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }

    // Fallback: search by name or legacy string id if not valid ObjectId
    if (!product) {
      product = await Product.findOne({
        $or: [
          { name: new RegExp(`^${id.replace(/-/g, ' ')}$`, 'i') },
        ],
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product roast not found in catalogue.',
      });
    }

    return res.status(200).json({
      success: true,
      product: product.toJSON(),
    });
  } catch (error: any) {
    console.error('[Product Controller] Error fetching product by ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve product details.',
    });
  }
}

