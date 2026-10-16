import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Ensure SRV record lookup succeeds across all Windows and router DNS setups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback to default system resolver
}

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 15000,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(
      `[Database] Successfully connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`
    );

    mongoose.connection.on('error', (err) => {
      console.error('[Database] Connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] Disconnected from MongoDB');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDbState(): string {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] Disconnected cleanly');
  }
}
