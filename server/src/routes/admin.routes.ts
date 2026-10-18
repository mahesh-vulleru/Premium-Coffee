import { Router } from 'express';
import {
  listAllUsers,
  listWholesaleApplications,
  getWholesaleApplication,
  approveWholesale,
  rejectWholesale,
  listAllOrders,
  updateOrderStatus,
  generateToken,
  listTokens,
  getAdminMetrics,
} from '../controllers/admin.controller.js';
import {
  listAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  setProductPublicationStatus,
  archiveAdminProduct,
  listAdminInventory,
  adjustAdminInventory,
  listAdminInventoryLogs,
  listAdminAuditLogs,
} from '../controllers/adminShop.controller.js';
import {
  listAdminPricing,
  updateAdminPricing,
} from '../controllers/adminPricing.controller.js';
import {
  listAdminPromotions,
  createAdminPromotion,
  updateAdminPromotion,
  togglePromotionStatus,
  archiveAdminPromotion,
} from '../controllers/adminPromotions.controller.js';
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleCategoryStatus,
  archiveAdminCategory,
} from '../controllers/adminCategories.controller.js';
import {
  listAdminContent,
  createAdminContent,
  updateAdminContent,
  toggleContentPublication,
  deleteAdminContent,
} from '../controllers/adminContent.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with authentication and role = 'admin'
router.use(requireAuth, requireRole('admin'));

router.get('/metrics', getAdminMetrics);
router.get('/users', listAllUsers);
router.get('/wholesale/applications', listWholesaleApplications);
router.get('/wholesale/applications/:userId', getWholesaleApplication);
router.patch('/wholesale/:userId/approve', approveWholesale);
router.patch('/wholesale/:userId/reject', rejectWholesale);
router.get('/orders', listAllOrders);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.post('/tokens/generate', generateToken);
router.get('/tokens', listTokens);

// Shop Maintenance: Products
router.get('/products', listAdminProducts);
router.post('/products', createAdminProduct);
router.get('/products/:id', getAdminProductById);
router.put('/products/:id', updateAdminProduct);
router.patch('/products/:id/publish', setProductPublicationStatus);
router.patch('/products/:id/archive', archiveAdminProduct);

// Shop Maintenance: Inventory
router.get('/inventory', listAdminInventory);
router.post('/inventory/:id/adjust', adjustAdminInventory);
router.get('/inventory/logs', listAdminInventoryLogs);

// Shop Maintenance: Pricing
router.get('/pricing', listAdminPricing);
router.put('/pricing/:id', updateAdminPricing);
router.patch('/pricing/:id', updateAdminPricing);

// Shop Maintenance: Promotions
router.get('/promotions', listAdminPromotions);
router.post('/promotions', createAdminPromotion);
router.put('/promotions/:id', updateAdminPromotion);
router.patch('/promotions/:id', updateAdminPromotion);
router.patch('/promotions/:id/status', togglePromotionStatus);
router.delete('/promotions/:id', archiveAdminPromotion);

// Shop Maintenance: Categories
router.get('/categories', listAdminCategories);
router.post('/categories', createAdminCategory);
router.put('/categories/:id', updateAdminCategory);
router.patch('/categories/:id', updateAdminCategory);
router.patch('/categories/:id/status', toggleCategoryStatus);
router.delete('/categories/:id', archiveAdminCategory);

// Shop Maintenance: Storefront Content
router.get('/content', listAdminContent);
router.post('/content', createAdminContent);
router.put('/content/:id', updateAdminContent);
router.patch('/content/:id', updateAdminContent);
router.patch('/content/:id/publication', toggleContentPublication);
router.patch('/content/:id/toggle', toggleContentPublication);
router.delete('/content/:id', deleteAdminContent);

// Shop Maintenance: Audit Logs
router.get('/audit-logs', listAdminAuditLogs);

export default router;
