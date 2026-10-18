import { AuditLog } from '../models/AuditLog.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'apikey',
]);

function sanitizeValue(key: string, val: any): any {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return '[REDACTED]';
  }
  if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      sanitized[k] = sanitizeValue(k, v);
    }
    return sanitized;
  }
  return val;
}

export async function logAdminAction(params: {
  actor: { userId?: any; name: string; email: string; role?: string };
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    const safeDetails = params.details ? sanitizeValue('details', params.details) : undefined;
    await AuditLog.create({
      actor: {
        userId: params.actor.userId,
        name: params.actor.name,
        email: params.actor.email,
        role: params.actor.role || 'admin',
      },
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: safeDetails,
      ipAddress: params.ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[Audit Logger] Failed to record audit log:', err);
  }
}

