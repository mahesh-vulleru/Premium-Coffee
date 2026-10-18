import { Router } from 'express';
import { subscribeNewsletter, getNewsletterStatus } from '../controllers/newsletter.controller.js';

const router = Router();

router.post('/subscribe', subscribeNewsletter);
router.get('/status', getNewsletterStatus);

export default router;

