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
  decideOrderCancellation,
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
import {
  listStaffApplications,
  decideStaffApplication,
  listStaffDirectory,
  updateStaffRoleAndPermissions,
  updateStaffStatus,
  createStaffInvitation,
} from '../controllers/adminStaff.controller.js';
import {
  getFinanceSummary,
  listExpenses,
  createExpense,
  deleteExpense,
  processOrderRefund,
  decideOrderReturn,
} from '../controllers/adminFinance.controller.js';
import {
  getReportsAnalytics,
  exportReportCsv,
} from '../controllers/adminReports.controller.js';
import {
  getBusinessSettings,
  updateBusinessSettings,
  getAdminNotifications,
} from '../controllers/adminSettings.controller.js';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';

const router = Router();

// Require authentication for all administrative and operational endpoints
router.use(requireAuth);

// 1. Overview & General Operations
router.get('/metrics', requirePermission('orders.read', 'reports.read'), getAdminMetrics);
router.get('/notifications', requirePermission('orders.read', 'staff.read'), getAdminNotifications);

// 2. Orders & Fulfillment
router.get('/orders', requirePermission('orders.read'), listAllOrders);
router.patch('/orders/:orderId/status', requirePermission('orders.update', 'orders.fulfillment'), updateOrderStatus);
router.post('/orders/:orderId/cancellation', requirePermission('cancellations.review'), decideOrderCancellation);
router.post('/orders/:orderId/returns', requirePermission('returns.review'), decideOrderReturn);

// 3. Finance, Refunds & Expenses
router.get('/finance/summary', requirePermission('finance.read'), getFinanceSummary);
router.get('/finance/expenses', requirePermission('finance.read', 'expenses.manage'), listExpenses);
router.post('/finance/expenses', requirePermission('expenses.manage'), createExpense);
router.delete('/finance/expenses/:id', requirePermission('expenses.manage'), deleteExpense);
router.post('/orders/:orderId/refund', requirePermission('refunds.manage'), processOrderRefund);
router.post('/orders/:orderId/return', requirePermission('returns.review', 'orders.update'), decideOrderReturn);

// 4. Staff Management & Roles
router.get('/staff/applications', requirePermission('staff.read', 'staff.approve', 'staff.manage', 'staff.view'), listStaffApplications);
router.post('/staff/:id/approval', requirePermission('staff.approve'), decideStaffApplication);
router.get('/staff/directory', requirePermission('staff.read', 'staff.manage', 'staff.view'), listStaffDirectory);
router.patch('/staff/:id/role-permissions', requirePermission('roles.manage', 'staff.manage'), updateStaffRoleAndPermissions);
router.patch('/staff/:id/status', requirePermission('staff.manage'), updateStaffStatus);
router.post('/staff/invite', requirePermission('staff.manage'), createStaffInvitation);

// 5. Wholesale Approvals
router.get('/wholesale/applications', requirePermission('wholesale.manage'), listWholesaleApplications);
router.get('/wholesale/applications/:userId', requirePermission('wholesale.manage'), getWholesaleApplication);
router.patch('/wholesale/:userId/approve', requirePermission('wholesale.manage'), approveWholesale);
router.patch('/wholesale/:userId/reject', requirePermission('wholesale.manage'), rejectWholesale);

// 6. User Directory
router.get('/users', requirePermission('staff.read', 'orders.read'), listAllUsers);

// 7. Legacy Tokens
router.post('/tokens/generate', requirePermission('staff.manage'), generateToken);
router.get('/tokens', requirePermission('staff.manage'), listTokens);

// 8. Shop Maintenance: Products
router.get('/products', requirePermission('products.manage', 'inventory.read'), listAdminProducts);
router.post('/products', requirePermission('products.manage'), createAdminProduct);
router.get('/products/:id', requirePermission('products.manage', 'inventory.read'), getAdminProductById);
router.put('/products/:id', requirePermission('products.manage'), updateAdminProduct);
router.patch('/products/:id/publish', requirePermission('products.manage'), setProductPublicationStatus);
router.patch('/products/:id/archive', requirePermission('products.manage'), archiveAdminProduct);

// 9. Shop Maintenance: Inventory
router.get('/inventory', requirePermission('inventory.read'), listAdminInventory);
router.post('/inventory/:id/adjust', requirePermission('inventory.update', 'inventory.write'), adjustAdminInventory);
router.post('/inventory/adjust', requirePermission('inventory.update', 'inventory.write'), adjustAdminInventory);
router.get('/inventory/logs', requirePermission('inventory.read'), listAdminInventoryLogs);

// 10. Shop Maintenance: Pricing
router.get('/pricing', requirePermission('pricing.manage'), listAdminPricing);
router.put('/pricing/:id', requirePermission('pricing.manage'), updateAdminPricing);
router.patch('/pricing/:id', requirePermission('pricing.manage'), updateAdminPricing);

// 11. Shop Maintenance: Promotions
router.get('/promotions', requirePermission('promotions.manage'), listAdminPromotions);
router.post('/promotions', requirePermission('promotions.manage'), createAdminPromotion);
router.put('/promotions/:id', requirePermission('promotions.manage'), updateAdminPromotion);
router.patch('/promotions/:id', requirePermission('promotions.manage'), updateAdminPromotion);
router.patch('/promotions/:id/status', requirePermission('promotions.manage'), togglePromotionStatus);
router.delete('/promotions/:id', requirePermission('promotions.manage'), archiveAdminPromotion);

// 12. Shop Maintenance: Categories
router.get('/categories', requirePermission('categories.manage'), listAdminCategories);
router.post('/categories', requirePermission('categories.manage'), createAdminCategory);
router.put('/categories/:id', requirePermission('categories.manage'), updateAdminCategory);
router.patch('/categories/:id', requirePermission('categories.manage'), updateAdminCategory);
router.patch('/categories/:id/status', requirePermission('categories.manage'), toggleCategoryStatus);
router.delete('/categories/:id', requirePermission('categories.manage'), archiveAdminCategory);

// 13. Shop Maintenance: Storefront Content
router.get('/content', requirePermission('content.manage'), listAdminContent);
router.post('/content', requirePermission('content.manage'), createAdminContent);
router.put('/content/:id', requirePermission('content.manage'), updateAdminContent);
router.patch('/content/:id', requirePermission('content.manage'), updateAdminContent);
router.patch('/content/:id/publication', requirePermission('content.manage'), toggleContentPublication);
router.patch('/content/:id/toggle', requirePermission('content.manage'), toggleContentPublication);
router.delete('/content/:id', requirePermission('content.manage'), deleteAdminContent);

// 14. Reports & CSV Export
router.get('/reports/analytics', requirePermission('reports.read'), getReportsAnalytics);
router.get('/reports/export', requirePermission('reports.export'), exportReportCsv);
router.get('/reports/export/csv', requirePermission('reports.export'), exportReportCsv);

// 15. Audit Logs
router.get('/audit-logs', requirePermission('audit.read'), listAdminAuditLogs);

// 16. Business Settings
router.get('/settings', requirePermission('settings.manage'), getBusinessSettings);
router.put('/settings', requirePermission('settings.manage'), updateBusinessSettings);
router.patch('/settings', requirePermission('settings.manage'), updateBusinessSettings);

export default router;
