import { Router } from 'express';
import {
  registerCustomer,
  registerWholesale,
  registerAdmin,
  login,
  logout,
  getMe,
  updateProfile,
} from '../controllers/auth.controller.js';
import {
  validateBody,
  RegisterCustomerSchema,
  RegisterWholesaleSchema,
  RegisterAdminSchema,
  LoginSchema,
} from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Registration endpoints
router.post(
  '/register',
  validateBody(RegisterCustomerSchema),
  registerCustomer
);

router.post(
  '/register/customer',
  validateBody(RegisterCustomerSchema),
  registerCustomer
);

router.post(
  '/register/wholesale',
  validateBody(RegisterWholesaleSchema),
  registerWholesale
);

router.post(
  '/register/admin',
  validateBody(RegisterAdminSchema),
  registerAdmin
);

// Login & Session endpoints
router.post('/login', validateBody(LoginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);

export default router;

