import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import wholesaleRoutes from './routes/wholesale.routes.js';
import orderRoutes from './routes/order.routes.js';
import newsletterRoutes from './routes/newsletter.routes.js';
import categoryRoutes from './routes/category.routes.js';
import contentRoutes from './routes/content.routes.js';
import {
  notFoundHandler,
  globalErrorHandler,
} from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Basic request security & CORS
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body and cookie parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Mount API endpoints
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/content', contentRoutes);
  app.use('/api/v1/cart', cartRoutes);
  app.use('/api/v1/wishlist', wishlistRoutes);
  app.use('/api/v1/wholesale', wholesaleRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/newsletter', newsletterRoutes);

  // Fallback 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

