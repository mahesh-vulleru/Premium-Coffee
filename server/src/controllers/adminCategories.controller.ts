import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { logAdminAction } from '../utils/auditLogger.js';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/__+/g, '_');
}

/**
 * GET /api/v1/categories (Public)
 * Returns active, non-archived categories sorted by displayOrder
 */
export async function listPublicCategories(_req: Request, res: Response) {
  try {
    const categories = await Category.find({
      isActive: true,
      isArchived: { $ne: true },
    }).sort({ displayOrder: 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories: categories.map((c) => c.toJSON()),
    });
  } catch (error) {
    console.error('[Categories] Error fetching public categories:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve categories' });
  }
}

/**
 * GET /api/v1/admin/categories
 * List all categories with product counts
 */
export async function listAdminCategories(_req: AuthenticatedRequest, res: Response) {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: 1 });

    const results = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat.slug,
          isArchived: { $ne: true },
        });
        return {
          ...cat.toJSON(),
          productCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      categories: results,
    });
  } catch (error) {
    console.error('[Admin Categories] Error listing categories:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve categories' });
  }
}

/**
 * POST /api/v1/admin/categories
 * Create new category
 */
export async function createAdminCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, slug, description, icon, image, displayOrder = 0, isActive = true } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const cleanName = name.trim();
    const cleanSlug = slug && typeof slug === 'string' && slug.trim()
      ? slugify(slug)
      : slugify(cleanName);

    if (!cleanSlug) {
      return res.status(400).json({ success: false, error: 'Invalid category slug' });
    }

    // Check duplicate slug
    const existing = await Category.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Category slug "${cleanSlug}" is already taken.`,
      });
    }

    const category = await Category.create({
      slug: cleanSlug,
      name: cleanName,
      description: description ? String(description).trim() : undefined,
      icon: icon ? String(icon).trim() : undefined,
      image: image ? String(image).trim() : undefined,
      displayOrder: Number(displayOrder) || 0,
      isActive: Boolean(isActive),
      isArchived: false,
    });

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'category_created',
      resource: 'category',
      resourceId: category._id.toString(),
      details: { name: category.name, slug: category.slug },
    });

    return res.status(201).json({
      success: true,
      message: `Category "${category.name}" created successfully.`,
      category: category.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Categories] Error creating category:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Category slug must be unique' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create category' });
  }
}

/**
 * PUT /api/v1/admin/categories/:id
 * Update category details
 */
export async function updateAdminCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const category = mongoose.Types.ObjectId.isValid(id)
      ? await Category.findById(id)
      : await Category.findOne({ slug: id.toLowerCase().trim() });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const { name, slug, description, icon, image, displayOrder, isActive } = req.body;

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Category name cannot be empty' });
      }
      category.name = name.trim();
    }

    if (slug !== undefined) {
      const cleanSlug = slugify(slug);
      if (cleanSlug && cleanSlug !== category.slug) {
        const conflict = await Category.findOne({ slug: cleanSlug, _id: { $ne: category._id } });
        if (conflict) {
          return res.status(400).json({ success: false, error: `Category slug "${cleanSlug}" is already taken.` });
        }
        // Update product references to new slug
        await Product.updateMany({ category: category.slug }, { category: cleanSlug });
        category.slug = cleanSlug;
      }
    }

    if (description !== undefined) {
      category.description = description ? String(description).trim() : undefined;
    }

    if (icon !== undefined) {
      category.icon = icon ? String(icon).trim() : undefined;
    }

    if (image !== undefined) {
      category.image = image ? String(image).trim() : undefined;
    }

    if (displayOrder !== undefined) {
      category.displayOrder = Number(displayOrder) || 0;
    }

    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }

    await category.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'category_updated',
      resource: 'category',
      resourceId: category._id.toString(),
      details: { name: category.name, slug: category.slug, isActive: category.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" updated successfully.`,
      category: category.toJSON(),
    });
  } catch (error) {
    console.error('[Admin Categories] Error updating category:', error);
    return res.status(500).json({ success: false, error: 'Failed to update category' });
  }
}

/**
 * PATCH /api/v1/admin/categories/:id/status
 * Toggle category active status
 */
export async function toggleCategoryStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const category = mongoose.Types.ObjectId.isValid(id)
      ? await Category.findById(id)
      : await Category.findOne({ slug: id.toLowerCase().trim() });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    category.isActive = typeof isActive === 'boolean' ? isActive : !category.isActive;
    await category.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'category_status_toggled',
      resource: 'category',
      resourceId: category._id.toString(),
      details: { slug: category.slug, isActive: category.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" is now ${category.isActive ? 'active' : 'inactive'}.`,
      category: category.toJSON(),
    });
  } catch (error) {
    console.error('[Admin Categories] Error toggling status:', error);
    return res.status(500).json({ success: false, error: 'Failed to toggle category status' });
  }
}

/**
 * DELETE /api/v1/admin/categories/:id
 * Safe archive of category (strictly prevents deletion if referenced by active products)
 */
export async function archiveAdminCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const category = mongoose.Types.ObjectId.isValid(id)
      ? await Category.findById(id)
      : await Category.findOne({ slug: id.toLowerCase().trim() });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Safety check: Prevent deletion if active products reference this category
    const activeProductCount = await Product.countDocuments({
      category: category.slug,
      isArchived: { $ne: true },
    });

    if (activeProductCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot archive category "${category.name}" because it is currently assigned to ${activeProductCount} active roast(s). Please reassign or archive those products first.`,
        activeProductCount,
      });
    }

    category.isArchived = true;
    category.isActive = false;
    await category.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'category_archived',
      resource: 'category',
      resourceId: category._id.toString(),
      details: { slug: category.slug, name: category.name },
    });

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" archived successfully.`,
    });
  } catch (error) {
    console.error('[Admin Categories] Error archiving category:', error);
    return res.status(500).json({ success: false, error: 'Failed to archive category' });
  }
}

