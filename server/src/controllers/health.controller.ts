import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { isDbConnected, getDbState } from '../config/db.js';
import { env } from '../config/env.js';

export function getHealthStatus(_req: Request, res: Response) {
  const connected = isDbConnected();

  const healthData = {
    status: connected ? 'healthy' : 'degraded',
    service: 'firedup-coffee-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    database: {
      status: connected ? 'connected' : 'disconnected',
      connectionState: getDbState(),
      databaseName: env.DB_NAME,
      host: mongoose.connection.host || 'none',
      port: mongoose.connection.port || null,
    },
  };

  const statusCode = connected ? 200 : 503;
  return res.status(statusCode).json(healthData);
}

