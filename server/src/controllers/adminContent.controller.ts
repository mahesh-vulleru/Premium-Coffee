import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { StorefrontContent } from '../models/StorefrontContent.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { logAdminAction } from '../utils/auditLogger.js';

function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  // Prevent javascript: pseudo-protocol or data: scripts
  if (/^(javascript:|data:|vbscript:)/i.test(trimmed)) {
    return '#';
  }
  return trimmed;
}

/**
 * GET /api/v1/content (Public)
 * Returns active, published storefront content items
 */
export async function listPublicContent(req: Request, res: Response) {
  try {
    const now = new Date();

    const queryFilter: Record<string, any> = {
      isActive: true,
      isPublished: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const typeParam = req.query.type || req.query.contentType;
    if (typeParam && typeof typeParam === 'string') {
      queryFilter.contentType = typeParam;
    }

    const items = await StorefrontContent.find(queryFilter).sort({ displayOrder: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      content: items.map((i) => i.toJSON()),
    });
  } catch (error) {
    console.error('[Content] Error fetching public content:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve storefront content' });
  }
}

/**
 * GET /api/v1/admin/content
 * List all storefront content items for administrative management
 */
export async function listAdminContent(_req: AuthenticatedRequest, res: Response) {
  try {
    const items = await StorefrontContent.find().sort({ displayOrder: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      content: items.map((i) => i.toJSON()),
    });
  } catch (error) {
    console.error('[Admin Content] Error listing storefront content:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve content' });
  }
}

/**
 * POST /api/v1/admin/content
 * Create a new storefront content item
 */
export async function createAdminContent(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      key,
      contentType = 'banner',
      title,
      subtitle,
      badge,
      description,
      linkText,
      linkUrl,
      countdownEndDate,
      displayOrder = 0,
      isActive = true,
      isPublished = true,
      startDate,
      endDate,
    } = req.body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ success: false, error: 'Content key identifier is required' });
    }

    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');

    const existing = await StorefrontContent.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Content item with key "${cleanKey}" already exists.`,
      });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const item = await StorefrontContent.create({
      key: cleanKey,
      contentType,
      title: title.trim(),
      subtitle: subtitle ? String(subtitle).trim() : undefined,
      badge: badge ? String(badge).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      linkText: linkText ? String(linkText).trim() : undefined,
      linkUrl: sanitizeUrl(linkUrl),
      countdownEndDate: countdownEndDate ? new Date(countdownEndDate) : undefined,
      displayOrder: Number(displayOrder) || 0,
      isActive: Boolean(isActive),
      isPublished: Boolean(isPublished),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'storefront_content_created',
      resource: 'content',
      resourceId: item._id.toString(),
      details: { key: item.key, title: item.title },
    });

    return res.status(201).json({
      success: true,
      message: `Storefront content "${item.title}" created successfully.`,
      content: item.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Content] Error creating content:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Content key must be unique' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create content item' });
  }
}

/**
 * PUT /api/v1/admin/content/:id
 * Update storefront content
 */
export async function updateAdminContent(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid content ID' });
    }

    const item = await StorefrontContent.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Content item not found' });
    }

    const {
      title,
      subtitle,
      badge,
      description,
      linkText,
      linkUrl,
      countdownEndDate,
      displayOrder,
      isActive,
      isPublished,
      startDate,
      endDate,
    } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Title cannot be empty' });
      }
      item.title = title.trim();
    }

    if (subtitle !== undefined) item.subtitle = subtitle ? String(subtitle).trim() : undefined;
    if (badge !== undefined) item.badge = badge ? String(badge).trim() : undefined;
    if (description !== undefined) item.description = description ? String(description).trim() : undefined;
    if (linkText !== undefined) item.linkText = linkText ? String(linkText).trim() : undefined;
    if (linkUrl !== undefined) item.linkUrl = sanitizeUrl(linkUrl);
    if (countdownEndDate !== undefined) item.countdownEndDate = countdownEndDate ? new Date(countdownEndDate) : undefined;
    if (displayOrder !== undefined) item.displayOrder = Number(displayOrder) || 0;
    if (isActive !== undefined) item.isActive = Boolean(isActive);
    if (isPublished !== undefined) item.isPublished = Boolean(isPublished);
    if (startDate !== undefined) item.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) item.endDate = endDate ? new Date(endDate) : undefined;

    await item.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'storefront_content_updated',
      resource: 'content',
      resourceId: item._id.toString(),
      details: { key: item.key, title: item.title, isPublished: item.isPublished },
    });

    return res.status(200).json({
      success: true,
      message: `Storefront content "${item.title}" updated successfully.`,
      content: item.toJSON(),
    });
  } catch (error) {
    console.error('[Admin Content] Error updating content:', error);
    return res.status(500).json({ success: false, error: 'Failed to update content' });
  }
}

/**
 * PATCH /api/v1/admin/content/:id/publication
 * Toggle publication status
 */
export async function toggleContentPublication(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid content ID' });
    }

    const item = await StorefrontContent.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Content item not found' });
    }

    item.isPublished = typeof isPublished === 'boolean' ? isPublished : !item.isPublished;
    await item.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'storefront_content_publication_toggled',
      resource: 'content',
      resourceId: item._id.toString(),
      details: { key: item.key, isPublished: item.isPublished },
    });

    return res.status(200).json({
      success: true,
      message: `Content "${item.title}" is now ${item.isPublished ? 'published' : 'unpublished'}.`,
      content: item.toJSON(),
    });
  } catch (error) {
    console.error('[Admin Content] Error toggling publication:', error);
    return res.status(500).json({ success: false, error: 'Failed to toggle publication' });
  }
}

/**
 * DELETE /api/v1/admin/content/:id
 * Delete storefront content item
 */
export async function deleteAdminContent(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid content ID' });
    }

    const item = await StorefrontContent.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Content item not found' });
    }

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.role || 'admin',
      },
      action: 'storefront_content_deleted',
      resource: 'content',
      resourceId: id,
      details: { key: item.key, title: item.title },
    });

    return res.status(200).json({
      success: true,
      message: `Content "${item.title}" deleted successfully.`,
    });
  } catch (error) {
    console.error('[Admin Content] Error deleting content:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete content item' });
  }
}

