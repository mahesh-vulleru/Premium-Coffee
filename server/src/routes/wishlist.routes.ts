import { Router } from 'express';
import {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  syncWishlist,
} from '../controllers/wishlist.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWishlist);
router.post('/sync', syncWishlist);
router.post('/:productId', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;

