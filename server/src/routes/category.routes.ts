import { Router } from 'express';
import { listPublicCategories } from '../controllers/adminCategories.controller.js';

const router = Router();

// Public catalogue categories
router.get('/', listPublicCategories);

export default router;

