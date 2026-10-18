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

// Shop Maintenance: Audit Logs
router.get('/audit-logs', listAdminAuditLogs);

export default router;
