import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  console.log('--- Starting Firedup Specialty Coffee Backend Server ---');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Database Name: ${env.DB_NAME}`);

  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start listening
    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Firedup API listening at http://localhost:${env.PORT}`);
      console.log(`[Health] Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP listener closed');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Bootstrap Error] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

