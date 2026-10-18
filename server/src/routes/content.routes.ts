import { Router } from 'express';
import { listPublicContent } from '../controllers/adminContent.controller.js';

const router = Router();

// Public storefront dynamic content
router.get('/', listPublicContent);

export default router;

