import { Router } from 'express';
import {
  listStaffFulfillmentOrders,
  updateStaffFulfillment,
  getStaffFulfillmentMetrics,
} from '../controllers/staff.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Staff fulfillment endpoints require staff or admin role
router.use(requireAuth, requireRole('staff', 'admin'));

router.get('/orders', listStaffFulfillmentOrders);
router.patch('/orders/:orderId/fulfillment', updateStaffFulfillment);
router.patch('/orders/:orderId/status', updateStaffFulfillment);
router.patch('/fulfillment/:orderId/status', updateStaffFulfillment);
router.get('/metrics', getStaffFulfillmentMetrics);

export default router;

