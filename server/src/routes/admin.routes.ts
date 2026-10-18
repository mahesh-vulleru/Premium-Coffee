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

export default router;
