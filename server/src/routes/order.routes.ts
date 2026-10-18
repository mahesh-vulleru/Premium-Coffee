import { Router } from 'express';
import {
  getCustomerOrders,
  getCustomerOrderById,
  createRetailOrder,
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All customer order endpoints require authentication
router.use(requireAuth);

router.get('/', getCustomerOrders);
router.get('/:id', getCustomerOrderById);
router.post('/', createRetailOrder);

export default router;

