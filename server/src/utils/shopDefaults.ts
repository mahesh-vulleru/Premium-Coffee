import { Promotion } from '../models/Promotion.js';
import { Category } from '../models/Category.js';
import { StorefrontContent } from '../models/StorefrontContent.js';

/**
 * Initializes default database fixtures for Phase 3:
 * 1. Default promotional coupon FIREDUP15 (15% off).
 * 2. Default taxonomy categories (cappuccino, espresso, moca, latte, americano, cold_brew).
 * 3. Default storefront announcement banner and homepage promotional banners.
 */
export async function ensureShopDefaults(): Promise<void> {
  try {
    // 1. Ensure FIREDUP15 promotion exists
    const firedup15 = await Promotion.findOne({ code: 'FIREDUP15' });
    if (!firedup15) {
      await Promotion.create({
        code: 'FIREDUP15',
        description: '15% off first order for Roaster Club members',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 0,
        isActive: true,
        isArchived: false,
      });
    }

    // 2. Ensure standard coffee categories exist
    const defaultCategories = [
      { slug: 'cappuccino', name: 'Cappuccino', description: 'Rich espresso topped with velvety steamed milk foam', displayOrder: 1 },
      { slug: 'espresso', name: 'Espresso', description: 'Concentrated full-bodied shot with dense crema', displayOrder: 2 },
      { slug: 'moca', name: 'Moca', description: 'Harmonious blend of dark chocolate and espresso', displayOrder: 3 },
      { slug: 'latte', name: 'Latte', description: 'Smooth espresso with silky micro-foam milk', displayOrder: 4 },
      { slug: 'americano', name: 'Americano', description: 'Espresso stretched with hot mineral water for pure clarity', displayOrder: 5 },
      { slug: 'cold_brew', name: 'Cold Brew', description: 'Steeped for 18 hours in mountain spring water', displayOrder: 6 },
    ];

    for (const cat of defaultCategories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) {
        await Category.create({
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          displayOrder: cat.displayOrder,
          isActive: true,
          isArchived: false,
        });
      }
    }

    // 3. Ensure default storefront content exists
    const defaultContent = [
      {
        key: 'announcement_bar',
        contentType: 'announcement' as const,
        title: 'Freshly Roasted This Morning • Free Express Shipping on Orders Over ₹999',
        displayOrder: 1,
        isActive: true,
        isPublished: true,
      },
      {
        key: 'home_flash_drop',
        contentType: 'promo_card' as const,
        title: 'Fuel Your Morning With Fresh Roast Drops',
        subtitle: 'Limited Roaster Batch Drop',
        badge: 'Limited Roaster Batch Drop',
        description: 'Single-origin micro-lots cupped above 86 points, hand-roasted and shipped within 24 hours of cooling.',
        linkText: 'View Flash Deals',
        linkUrl: '/deals',
        displayOrder: 1,
        isActive: true,
        isPublished: true,
      },
      {
        key: 'home_promo_banner',
        contentType: 'banner' as const,
        title: 'Save 15% on First Order + Free Express Shipping',
        subtitle: 'Special Promotion',
        badge: 'Special Promotion',
        description: 'Use code FIREDUP15 during checkout. Free doorstep delivery unlocked on all coffee orders over ₹999.',
        linkText: 'Shop Now',
        linkUrl: '/shop',
        displayOrder: 2,
        isActive: true,
        isPublished: true,
      },
    ];

    for (const item of defaultContent) {
      const exists = await StorefrontContent.findOne({ key: item.key });
      if (!exists) {
        await StorefrontContent.create(item);
      }
    }
  } catch (error) {
    console.error('[Shop Defaults] Error initializing default shop data:', error);
  }
}

