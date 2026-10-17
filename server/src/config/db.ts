import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Ensure SRV record lookup succeeds across all Windows and router DNS setups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Fallback to default system resolver
}

let isConnected = false;

export async function connectDB(customUri?: string, customDbName?: string): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const targetDbName = customDbName || env.DB_NAME;
  const primaryUri = customUri || env.MONGODB_URI;
  const fallbackUri = `mongodb://127.0.0.1:27017/${targetDbName}`;

  try {
    const conn = await mongoose.connect(primaryUri, {
      dbName: targetDbName,
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
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
  } catch (primaryError: any) {
    if (primaryUri !== fallbackUri) {
      console.warn(
        `[Database] Primary MongoDB connection failed (${primaryError.message?.slice(0, 80)}...). Attempting local fallback: ${fallbackUri}`
      );
      try {
        const fallbackConn = await mongoose.connect(fallbackUri, {
          dbName: targetDbName,
          autoIndex: true,
          serverSelectionTimeoutMS: 4000,
        });

        isConnected = fallbackConn.connection.readyState === 1;
        console.log(
          `[Database] Successfully connected to Local MongoDB: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`
        );

        return fallbackConn;
      } catch {
        console.error('[Database] Both primary and local fallback connections failed.');
        throw primaryError;
      }
    }

    console.error('[Database] MongoDB connection failed:', primaryError);
    isConnected = false;
    throw primaryError;
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
