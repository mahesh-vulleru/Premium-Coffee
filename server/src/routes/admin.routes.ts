import { Router } from 'express';
import {
  listAllUsers,
  approveWholesale,
  rejectWholesale,
  generateToken,
  listTokens,
} from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with authentication and role = 'admin'
router.use(requireAuth, requireRole('admin'));

router.get('/users', listAllUsers);
router.patch('/wholesale/:userId/approve', approveWholesale);
router.patch('/wholesale/:userId/reject', rejectWholesale);
router.post('/tokens/generate', generateToken);
router.get('/tokens', listTokens);

export default router;

