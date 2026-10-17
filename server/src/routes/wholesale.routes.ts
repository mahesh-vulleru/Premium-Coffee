import { Router } from 'express';
import {
  getWholesaleStatus,
  getWholesaleCatalog,
  getWholesalePriceSheet,
} from '../controllers/wholesale.controller.js';
import { requireAuth, requireWholesaleApproved } from '../middleware/auth.js';

const router = Router();

// Authentication required for all wholesale routes
router.use(requireAuth);

// Status route: accessible to any wholesale applicant or admin
router.get('/status', getWholesaleStatus);

// Restricted commercial endpoints: strictly requires approved wholesale partner status
router.get('/catalog', requireWholesaleApproved, getWholesaleCatalog);
router.get('/price-sheet', requireWholesaleApproved, getWholesalePriceSheet);

export default router;

