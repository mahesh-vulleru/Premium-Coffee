import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';
import { AdminToken } from '../models/AdminToken.js';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function generateTokenAndSetCookie(res: Response, user: IUser): string {
  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const isProduction = env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}

// POST /api/v1/auth/register/customer
export async function registerCustomer(req: Request, res: Response) {
  const { name, email, phone, password, shippingAddress } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
    });
  }

  // Server strictly enforces role = 'customer'
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: 'customer',
    shippingAddress,
  });

  const token = generateTokenAndSetCookie(res, user);

  return res.status(201).json({
    success: true,
    message: 'Customer account created successfully',
    token,
    user: user.toJSON(),
  });
}

// POST /api/v1/auth/register/wholesale
export async function registerWholesale(req: Request, res: Response) {
  const {
    contactName,
    businessName,
    businessType,
    taxId,
    monthlyVolumeKg,
    email,
    phone,
    password,
    deliveryAddress,
  } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
    });
  }

  // Server strictly enforces role = 'wholesale' and status = 'pending'
  const user = await User.create({
    name: contactName,
    email,
    phone,
    password,
    role: 'wholesale',
    wholesaleDetails: {
      businessName,
      taxId,
      businessType,
      monthlyVolumeKg,
      deliveryAddress,
      status: 'pending',
      submittedAt: new Date(),
    },
  });

  const token = generateTokenAndSetCookie(res, user);

  return res.status(201).json({
    success: true,
    message:
      'Wholesale application received. Your credentials are under review by our master roaster.',
    token,
    user: user.toJSON(),
  });
}

// POST /api/v1/auth/register/admin
export async function registerAdmin(req: Request, res: Response) {
  const { name, email, password, invitationToken, department } = req.body;

  // Strict token validation: check master invitation secret or active database token
  let tokenValid = false;
  let dbTokenDoc = null;

  if (invitationToken.trim() === env.ADMIN_INVITATION_SECRET) {
    tokenValid = true;
  } else {
    dbTokenDoc = await AdminToken.findOne({
      token: invitationToken.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    if (dbTokenDoc) {
      tokenValid = true;
    }
  }

  if (!tokenValid) {
    console.warn(
      `[Security Alert] Unauthorized attempt to register admin with invalid token: "${invitationToken}" for email: ${email}`
    );
    return res.status(403).json({
      success: false,
      error:
        'Access denied: Invalid, expired, or revoked admin invitation token. Unauthorized provisioning attempts are logged.',
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
    });
  }

  // Create admin account
  const user = await User.create({
    name,
    email,
    phone: 'HQ Staff Internal',
    password,
    role: 'admin',
    adminSecurityBadge: `${department || 'Operations'} — Staff Verified`,
  });

  // Mark token as used if from DB
  if (dbTokenDoc) {
    dbTokenDoc.isUsed = true;
    dbTokenDoc.usedBy = user._id as any;
    dbTokenDoc.usedAt = new Date();
    await dbTokenDoc.save();
  }

  const token = generateTokenAndSetCookie(res, user);

  console.log(`[Security] Admin account provisioned successfully: ${user.email}`);

  return res.status(201).json({
    success: true,
    message: 'Staff administrative account provisioned successfully.',
    token,
    user: user.toJSON(),
  });
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password credentials.',
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password credentials.',
    });
  }

  const token = generateTokenAndSetCookie(res, user);

  return res.status(200).json({
    success: true,
    message: 'Authenticated successfully',
    token,
    user: user.toJSON(),
  });
}

// POST /api/v1/auth/logout
export function logout(_req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Signed out of session successfully',
  });
}

// GET /api/v1/auth/me
export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  return res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
}

