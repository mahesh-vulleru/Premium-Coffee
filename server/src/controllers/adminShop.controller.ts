import type { Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { InventoryLog, type InventoryMovementType } from '../models/InventoryLog.js';
import { AuditLog } from '../models/AuditLog.js';
import { logAdminAction } from '../utils/auditLogger.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==========================================
// 1. PRODUCT MANAGEMENT
// ==========================================

/**
 * GET /api/v1/admin/products
 * List and search all products (including unpublished and archived)
 */
export async function listAdminProducts(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      search,
      category,
      roastLevel,
      stockStatus,
      status = 'all',
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    const filter: Record<string, any> = {};

    // Publication & Archival Status Filter
    if (status === 'published') {
      filter.isPublished = true;
      filter.isArchived = { $ne: true };
    } else if (status === 'unpublished') {
      filter.isPublished = false;
      filter.isArchived = { $ne: true };
    } else if (status === 'archived') {
      filter.isArchived = true;
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Roast level filter
    if (roastLevel && roastLevel !== 'all') {
      filter.roastLevel = roastLevel;
    }

    // Stock status filter
    if (stockStatus === 'out_of_stock') {
      filter.stockAvailable = 0;
    } else if (stockStatus === 'low_stock') {
      filter.$expr = { $lte: ['$stockAvailable', '$lowStockThreshold'] };
      filter.stockAvailable = { $gt: 0 };
    } else if (stockStatus === 'in_stock') {
      filter.$expr = { $gt: ['$stockAvailable', '$lowStockThreshold'] };
    }

    // Text search
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { slug: regex },
        { origin: regex },
        { description: regex },
        { tastingNotes: regex },
      ];
    }

    // Sorting
    let sortOptions: Record<string, any> = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'stock_asc') sortOptions = { stockAvailable: 1 };
    else if (sort === 'stock_desc') sortOptions = { stockAvailable: -1 };
    else if (sort === 'name') sortOptions = { name: 1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      count: products.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      products: products.map((p) => p.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error listing products:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve products' });
  }
}

/**
 * GET /api/v1/admin/products/:id
 * Retrieve single product details for inspection or editing
 */
export async function getAdminProductById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ slug: id.toLowerCase() });
    }

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product roast not found' });
    }

    return res.status(200).json({
      success: true,
      product: product.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error retrieving product:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve product details' });
  }
}

/**
 * POST /api/v1/admin/products
 * Create new specialty coffee roast with validation and unique slug
 */
export async function createAdminProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      name,
      subtitle,
      slug: customSlug,
      category,
      price,
      originalPrice,
      image,
      isSale = false,
      saleLabel,
      tag = 'best_sellers',
      roastLevel = 'Medium',
      tastingNotes = [],
      origin,
      description,
      stockAvailable = 20,
      lowStockThreshold = 10,
      isPublished = true,
      availablePackSizes = ['250g', '500g', '1kg'],
      grindOptions = ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'],
      brewGuide,
    } = req.body;

    // Field validations
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Product name must be at least 2 characters long' });
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ success: false, error: 'Valid positive price in INR is required' });
    }

    if (!category || !['cappuccino', 'espresso', 'moca', 'latte', 'americano', 'cold_brew'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing coffee category' });
    }

    if (!image || typeof image !== 'string' || !image.trim()) {
      return res.status(400).json({ success: false, error: 'Product image URL or path is required' });
    }

    if (!origin || typeof origin !== 'string' || !origin.trim()) {
      return res.status(400).json({ success: false, error: 'Single-origin estate or region is required' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Roast flavor description is required' });
    }

    const stock = Math.max(0, parseInt(stockAvailable, 10) || 0);
    const threshold = Math.max(0, parseInt(lowStockThreshold, 10) || 10);

    // Slug generation and uniqueness check
    const generatedSlug = customSlug && typeof customSlug === 'string' && customSlug.trim()
      ? slugify(customSlug)
      : slugify(name);

    const existingSlug = await Product.findOne({ slug: generatedSlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        error: `Product slug "${generatedSlug}" is already in use. Please specify a unique slug.`,
      });
    }

    // Format tasting notes array
    const notesArray = Array.isArray(tastingNotes)
      ? tastingNotes.map((n) => String(n).trim()).filter(Boolean)
      : typeof tastingNotes === 'string'
      ? tastingNotes.split(',').map((n) => n.trim()).filter(Boolean)
      : [];

    const product = await Product.create({
      name: name.trim(),
      subtitle: subtitle ? String(subtitle).trim() : undefined,
      slug: generatedSlug,
      category,
      price,
      originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
      image: image.trim(),
      isSale: Boolean(isSale),
      saleLabel: saleLabel ? String(saleLabel).trim() : undefined,
      tag: ['new_arrivals', 'best_sellers', 'top_rates'].includes(tag) ? tag : 'best_sellers',
      roastLevel: ['Light', 'Medium', 'Medium-Dark', 'Dark'].includes(roastLevel) ? roastLevel : 'Medium',
      tastingNotes: notesArray,
      origin: origin.trim(),
      description: description.trim(),
      stockAvailable: stock,
      lowStockThreshold: threshold,
      reservedStock: 0,
      isPublished: Boolean(isPublished),
      isArchived: false,
      availablePackSizes: Array.isArray(availablePackSizes) && availablePackSizes.length > 0
        ? availablePackSizes
        : ['250g', '500g', '1kg'],
      grindOptions: Array.isArray(grindOptions) && grindOptions.length > 0
        ? grindOptions
        : ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'],
      brewGuide,
    });

    // Record initial inventory log if created with stock
    if (stock > 0) {
      await InventoryLog.create({
        productId: product._id,
        productName: product.name,
        previousStock: 0,
        newStock: stock,
        quantityChange: stock,
        type: 'restock',
        reason: 'Initial warehouse intake on product creation',
        actor: {
          userId: req.user?._id,
          name: req.user?.name || 'Administrator',
          email: req.user?.email || 'admin@firedupcoffee.com',
          role: req.user?.role || 'admin',
        },
        timestamp: new Date(),
      });
    }

    // Record Audit Log
    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'product_created',
      resource: 'product',
      resourceId: product._id.toString(),
      details: {
        name: product.name,
        slug: product.slug,
        price: product.price,
        stockAvailable: product.stockAvailable,
        isPublished: product.isPublished,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Product "${product.name}" created successfully.`,
      product: product.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error creating product:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Product slug or name must be unique' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
}

/**
 * PUT /api/v1/admin/products/:id
 * Update an existing product
 */
export async function updateAdminProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updates = req.body;
    const changedFields: Record<string, { from: any; to: any }> = {};

    // Validate and check slug if provided
    if (updates.slug !== undefined) {
      const cleanSlug = slugify(updates.slug);
      if (cleanSlug !== product.slug) {
        const slugExists = await Product.findOne({ slug: cleanSlug, _id: { $ne: product._id } });
        if (slugExists) {
          return res.status(400).json({
            success: false,
            error: `Product slug "${cleanSlug}" is already taken by another roast.`,
          });
        }
        changedFields.slug = { from: product.slug, to: cleanSlug };
        product.slug = cleanSlug;
      }
    }

    // Name
    if (updates.name !== undefined && typeof updates.name === 'string' && updates.name.trim().length >= 2) {
      if (product.name !== updates.name.trim()) {
        changedFields.name = { from: product.name, to: updates.name.trim() };
        product.name = updates.name.trim();
      }
    }

    // Subtitle
    if (updates.subtitle !== undefined) {
      product.subtitle = updates.subtitle ? String(updates.subtitle).trim() : undefined;
    }

    // Category
    if (updates.category && ['cappuccino', 'espresso', 'moca', 'latte', 'americano', 'cold_brew'].includes(updates.category)) {
      if (product.category !== updates.category) {
        changedFields.category = { from: product.category, to: updates.category };
        product.category = updates.category;
      }
    }

    // Price
    if (updates.price !== undefined && typeof updates.price === 'number' && updates.price >= 0) {
      if (product.price !== updates.price) {
        changedFields.price = { from: product.price, to: updates.price };
        product.price = updates.price;
      }
    }

    // Original Price
    if (updates.originalPrice !== undefined) {
      product.originalPrice = updates.originalPrice > 0 ? updates.originalPrice : undefined;
    }

    // Image
    if (updates.image && typeof updates.image === 'string' && updates.image.trim()) {
      product.image = updates.image.trim();
    }

    // Sale fields
    if (updates.isSale !== undefined) product.isSale = Boolean(updates.isSale);
    if (updates.saleLabel !== undefined) product.saleLabel = updates.saleLabel ? String(updates.saleLabel).trim() : undefined;

    // Tag
    if (updates.tag && ['new_arrivals', 'best_sellers', 'top_rates'].includes(updates.tag)) {
      product.tag = updates.tag;
    }

    // Roast level
    if (updates.roastLevel && ['Light', 'Medium', 'Medium-Dark', 'Dark'].includes(updates.roastLevel)) {
      product.roastLevel = updates.roastLevel;
    }

    // Tasting notes
    if (updates.tastingNotes !== undefined) {
      const notesArray = Array.isArray(updates.tastingNotes)
        ? updates.tastingNotes.map((n: any) => String(n).trim()).filter(Boolean)
        : typeof updates.tastingNotes === 'string'
        ? updates.tastingNotes.split(',').map((n: string) => n.trim()).filter(Boolean)
        : [];
      product.tastingNotes = notesArray;
    }

    // Origin and Description
    if (updates.origin && typeof updates.origin === 'string') product.origin = updates.origin.trim();
    if (updates.description && typeof updates.description === 'string') product.description = updates.description.trim();

    // Low stock threshold
    if (updates.lowStockThreshold !== undefined && typeof updates.lowStockThreshold === 'number') {
      product.lowStockThreshold = Math.max(0, updates.lowStockThreshold);
    }

    // Pack sizes and grind options
    if (Array.isArray(updates.availablePackSizes)) product.availablePackSizes = updates.availablePackSizes;
    if (Array.isArray(updates.grindOptions)) product.grindOptions = updates.grindOptions;

    // Brew Guide
    if (updates.brewGuide !== undefined) product.brewGuide = updates.brewGuide;

    await product.save();

    // Record Audit Log
    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'product_updated',
      resource: 'product',
      resourceId: product._id.toString(),
      details: { changedFields },
    });

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" updated successfully.`,
      product: product.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error updating product:', error);
    return res.status(500).json({ success: false, error: 'Failed to update product details' });
  }
}

/**
 * PATCH /api/v1/admin/products/:id/publish
 * Toggle or set publication status
 */
export async function setProductPublicationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const { isPublished } = req.body;
    const targetStatus = isPublished !== undefined ? Boolean(isPublished) : !product.isPublished;

    if (targetStatus && product.isArchived) {
      return res.status(400).json({
        success: false,
        error: 'Archived products cannot be published directly. Unarchive the product first.',
      });
    }

    const prevStatus = product.isPublished;
    product.isPublished = targetStatus;
    await product.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: targetStatus ? 'product_published' : 'product_unpublished',
      resource: 'product',
      resourceId: product._id.toString(),
      details: {
        productName: product.name,
        from: prevStatus,
        to: targetStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" is now ${targetStatus ? 'published and live on storefront' : 'unpublished and hidden from storefront'}.`,
      product: product.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error setting publication status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update publication status' });
  }
}

/**
 * PATCH /api/v1/admin/products/:id/archive
 * Safely archive product (unpublishes and hides, preserving historical orders)
 */
export async function archiveAdminProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const { isArchived = true, reason } = req.body;
    const targetArchived = Boolean(isArchived);

    product.isArchived = targetArchived;
    if (targetArchived) {
      product.isPublished = false;
    }
    await product.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: targetArchived ? 'product_archived' : 'product_unarchived',
      resource: 'product',
      resourceId: product._id.toString(),
      details: {
        productName: product.name,
        isArchived: targetArchived,
        reason: reason ? String(reason).trim() : 'Administrative archival',
      },
    });

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" ${targetArchived ? 'safely archived' : 'unarchived successfully'}.`,
      product: product.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error archiving product:', error);
    return res.status(500).json({ success: false, error: 'Failed to archive product' });
  }
}

// ==========================================
// 2. INVENTORY MANAGEMENT
// ==========================================

/**
 * GET /api/v1/admin/inventory
 * Summary of warehouse stock, low-stock warnings, and SKUs
 */
export async function listAdminInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, category, lowStockOnly = 'false', page = '1', limit = '20' } = req.query;

    const filter: Record<string, any> = { isArchived: { $ne: true } };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.name = new RegExp(search.trim(), 'i');
    }

    if (lowStockOnly === 'true') {
      filter.$expr = { $lte: ['$stockAvailable', '$lowStockThreshold'] };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Fetch products
    const [products, total, allProducts] = await Promise.all([
      Product.find(filter).sort({ stockAvailable: 1 }).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
      Product.find({ isArchived: { $ne: true } }).select('stockAvailable lowStockThreshold reservedStock'),
    ]);

    // Calculate aggregated inventory KPIs
    let totalStockBags = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of allProducts) {
      totalStockBags += p.stockAvailable || 0;
      const threshold = p.lowStockThreshold ?? 10;
      if (p.stockAvailable === 0) {
        outOfStockCount++;
      } else if (p.stockAvailable <= threshold) {
        lowStockCount++;
      }
    }

    const items = products.map((p) => {
      const threshold = p.lowStockThreshold ?? 10;
      const reserved = p.reservedStock || 0;
      const available = Math.max(0, p.stockAvailable - reserved);

      let status = 'in_stock';
      if (p.stockAvailable === 0) status = 'out_of_stock';
      else if (p.stockAvailable <= threshold) status = 'low_stock';

      return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        category: p.category,
        image: p.image,
        price: p.price,
        currentStock: p.stockAvailable,
        reservedStock: reserved,
        availableStock: available,
        lowStockThreshold: threshold,
        isPublished: p.isPublished,
        status,
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalSkus: allProducts.length,
        totalStockBags,
        lowStockCount,
        outOfStockCount,
      },
      products: items,
      total,
      count: items.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error listing inventory:', error);
    return res.status(500).json({ success: false, error: 'Failed to load inventory data' });
  }
}

/**
 * POST /api/v1/admin/inventory/:id/adjust
 * Adjust product stock with mandatory reason, preventing negative inventory
 */
export async function adjustAdminInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id || req.body.id || req.body.productId;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const { adjustment, newStock: explicitNewStock, reason, type = 'manual_adjustment' } = req.body;

    // Mandatory reason check
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'A mandatory adjustment reason must be provided (minimum 3 characters).',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found in warehouse' });
    }

    const previousStock = product.stockAvailable;
    let targetNewStock = previousStock;
    let qtyChange = 0;

    if (adjustment !== undefined && typeof adjustment === 'number') {
      qtyChange = adjustment;
      targetNewStock = previousStock + adjustment;
    } else if (explicitNewStock !== undefined && typeof explicitNewStock === 'number') {
      targetNewStock = explicitNewStock;
      qtyChange = explicitNewStock - previousStock;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either "adjustment" (delta) or "newStock" must be specified.',
      });
    }

    // Prevent negative stock
    if (targetNewStock < 0) {
      return res.status(400).json({
        success: false,
        error: `Adjustment would result in negative stock. Available: ${previousStock}, requested change: ${qtyChange}.`,
      });
    }

    // Concurrency-safe atomic update
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, stockAvailable: previousStock },
      { $set: { stockAvailable: targetNewStock } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(409).json({
        success: false,
        error: 'Stock was concurrently updated by another process. Please refresh and retry.',
      });
    }

    const cleanReason = reason.trim();
    const movementType: InventoryMovementType = [
      'manual_adjustment',
      'retail_order',
      'wholesale_order',
      'restock',
      'reconciliation',
    ].includes(type)
      ? type
      : 'manual_adjustment';

    // Record Inventory Log
    const log = await InventoryLog.create({
      productId: product._id,
      productName: product.name,
      previousStock,
      newStock: targetNewStock,
      quantityChange: qtyChange,
      type: movementType,
      reason: cleanReason,
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      timestamp: new Date(),
    });

    // Record Audit Log
    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'inventory_adjusted',
      resource: 'inventory',
      resourceId: product._id.toString(),
      details: {
        productName: product.name,
        previousStock,
        newStock: targetNewStock,
        quantityChange: qtyChange,
        reason: cleanReason,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Stock for "${product.name}" successfully updated from ${previousStock} to ${targetNewStock} bags.`,
      product: updatedProduct.toJSON(),
      log: log.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error adjusting inventory:', error);
    return res.status(500).json({ success: false, error: 'Failed to adjust inventory' });
  }
}

/**
 * GET /api/v1/admin/inventory/logs
 * Historical inventory movement trail
 */
export async function listAdminInventoryLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { productId, type, page = '1', limit = '30' } = req.query;

    const filter: Record<string, any> = {};
    if (productId && mongoose.Types.ObjectId.isValid(productId as string)) {
      filter.productId = productId;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const total = await InventoryLog.countDocuments(filter);
    const logs = await InventoryLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      count: logs.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      logs: logs.map((l) => l.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error fetching inventory logs:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve inventory logs' });
  }
}

// ==========================================
// 3. AUDIT LOGS
// ==========================================

/**
 * GET /api/v1/admin/audit-logs
 * List administrative actions audit trail
 */
export async function listAdminAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { resource, action, search, page = '1', limit = '30' } = req.query;

    const filter: Record<string, any> = {};
    if (resource && resource !== 'all') {
      filter.resource = resource;
    }
    if (action && action !== 'all') {
      filter.action = action;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'actor.name': regex },
        { 'actor.email': regex },
        { action: regex },
        { resource: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      count: logs.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      logs: logs.map((l) => l.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Shop] Error fetching audit logs:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
  }
}

