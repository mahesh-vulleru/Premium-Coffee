import { Router } from 'express';
import {
  getWholesaleStatus,
  getWholesaleDashboard,
  updateWholesaleProfile,
  getWholesaleCatalog,
  getWholesalePriceSheet,
  getWholesaleCart,
  addToWholesaleCart,
  updateWholesaleCartItem,
  removeWholesaleCartItem,
  clearWholesaleCart,
  createWholesaleOrder,
  getWholesaleOrders,
  getWholesaleOrderById,
  downloadWholesaleInvoice,
  reorderWholesale,
} from '../controllers/wholesale.controller.js';
import { requireAuth, requireWholesaleApproved } from '../middleware/auth.js';

const router = Router();

// Authentication required for all wholesale routes
router.use(requireAuth);

// General account & profile routes (accessible to any applicant)
router.get('/status', getWholesaleStatus);
router.get('/dashboard', getWholesaleDashboard);
router.put('/profile', updateWholesaleProfile);

// Commercial B2B operations: strictly requires approved wholesale partner status
router.get('/catalog', requireWholesaleApproved, getWholesaleCatalog);
router.get('/price-sheet', requireWholesaleApproved, getWholesalePriceSheet);

// B2B Wholesale Bulk Cart
router.get('/cart', requireWholesaleApproved, getWholesaleCart);
router.post('/cart/items', requireWholesaleApproved, addToWholesaleCart);
router.put('/cart/items/:itemId', requireWholesaleApproved, updateWholesaleCartItem);
router.delete('/cart/items/:itemId', requireWholesaleApproved, removeWholesaleCartItem);
router.delete('/cart', requireWholesaleApproved, clearWholesaleCart);

// Commercial Orders & Invoices
router.post('/orders', requireWholesaleApproved, createWholesaleOrder);
router.get('/orders', requireWholesaleApproved, getWholesaleOrders);
router.get('/orders/:id', requireWholesaleApproved, getWholesaleOrderById);
router.get('/orders/:id/invoice', requireWholesaleApproved, downloadWholesaleInvoice);
router.post('/orders/:id/reorder', requireWholesaleApproved, reorderWholesale);

export default router;
