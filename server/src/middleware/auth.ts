import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type IUser, type UserRole } from '../models/User.js';
import { hasUserPermission, type Permission } from '../config/permissions.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization Bearer header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Fetch user from DB to ensure account still exists & active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Account no longer exists or session expired.',
      });
    }

    // Check if staff account has been suspended or deactivated
    if (
      user.staffStatus &&
      (user.staffStatus === 'suspended' || user.staffStatus === 'deactivated')
    ) {
      return res.status(403).json({
        success: false,
        error: `Staff account is currently ${user.staffStatus}. Access revoked. Contact roastery administration.`,
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication credentials.',
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden. Requires one of roles: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
}

/**
 * Granular permission check middleware.
 * Allows access if the user has any of the specified permissions, or is an admin/owner.
 */
export function requirePermission(...requiredPermissions: (Permission | string)[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    // Super Admin / Owner always has full access
    if (req.user.role === 'admin' || req.user.staffRole === 'owner') {
      return next();
    }

    const hasAny = requiredPermissions.some((perm) => hasUserPermission(req.user!, perm));
    if (!hasAny) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden. Requires one of permissions: [${requiredPermissions.join(', ')}].`,
      });
    }

    next();
  };
}

export function requireWholesaleApproved(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  if (req.user.role !== 'wholesale') {
    return res.status(403).json({ success: false, error: 'Wholesale account required.' });
  }

  if (req.user.wholesaleDetails?.status !== 'approved') {
    return res.status(403).json({
      success: false,
      error:
        'Wholesale account is pending administrative verification. Please wait for roaster approval.',
      status: req.user.wholesaleDetails?.status || 'pending',
    });
  }

  next();
}

