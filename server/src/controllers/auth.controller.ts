import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';
import { AdminToken } from '../models/AdminToken.js';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function timingSafeCompare(candidate: string, secret: string): boolean {
  if (!candidate || !secret) return false;
  const candBuf = Buffer.from(candidate.trim());
  const secretBuf = Buffer.from(secret.trim());
  if (candBuf.length !== secretBuf.length) {
    crypto.timingSafeEqual(candBuf, candBuf);
    return false;
  }
  return crypto.timingSafeEqual(candBuf, secretBuf);
}

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

  // Prevent duplicate wholesale registrations using identical commercial Tax/GST ID
  if (taxId && typeof taxId === 'string') {
    const existingTax = await User.findOne({
      'wholesaleDetails.taxId': taxId.trim(),
      'wholesaleDetails.status': { $in: ['pending', 'approved'] },
    });
    if (existingTax) {
      return res.status(409).json({
        success: false,
        error: 'A wholesale partner account or pending application is already registered with this Tax / Business ID.',
      });
    }
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

export async function registerAdmin(req: Request, res: Response) {
  const { name, email, password, invitationToken, adminInvitationToken, department } = req.body;
  const tokenCandidate = invitationToken || adminInvitationToken;

  // Strict token validation: check master invitation secret or active database token
  let tokenValid = false;
  let dbTokenDoc = null;

  if (timingSafeCompare(tokenCandidate, env.ADMIN_INVITATION_SECRET)) {
    tokenValid = true;
  } else if (tokenCandidate) {
    dbTokenDoc = await AdminToken.findOne({
      token: tokenCandidate.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    if (dbTokenDoc) {
      tokenValid = true;
    }
  }

  if (!tokenValid) {
    console.warn(
      `[Security Alert] Unauthorized attempt to register admin with invalid token for email: ${email}`
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
      error: 'An account with this email address already exists. Existing accounts cannot be elevated via registration.',
    });
  }

  // Check if invited token has an assigned role or email restriction
  let assignedRole: 'admin' | 'staff' = 'admin';
  let assignedStaffRole: any = 'owner';
  let assignedPermissions: string[] = [];

  if (dbTokenDoc) {
    if (dbTokenDoc.invitedEmail && dbTokenDoc.invitedEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'This invitation token is restricted to a different email address.',
      });
    }

    if (dbTokenDoc.role === 'owner') {
      assignedRole = 'admin';
      assignedStaffRole = 'owner';
    } else {
      assignedRole = 'staff';
      assignedStaffRole = dbTokenDoc.role || 'roastery_staff';
    }

    assignedPermissions = dbTokenDoc.permissions || [];
  }

  // Create staff / admin account
  const user = await User.create({
    name,
    email,
    phone: 'HQ Staff Internal',
    password,
    role: assignedRole,
    staffRole: assignedStaffRole,
    permissions: assignedPermissions,
    staffStatus: 'active',
    staffDepartment: (dbTokenDoc && dbTokenDoc.department) || department || 'Operations',
    staffInvitedBy: dbTokenDoc?.createdBy,
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

  console.log(`[Security] Staff/Admin account provisioned successfully: ${user.email} as ${assignedStaffRole}`);

  return res.status(201).json({
    success: true,
    message: 'Staff administrative account provisioned successfully.',
    token,
    user: user.toJSON(),
  });
}

// POST /api/v1/auth/register/staff
export async function registerStaffApplication(req: Request, res: Response) {
  const { name, email, phone, password, department, applicationNotes } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
    });
  }

  const staffUser = await User.create({
    name,
    email,
    phone: phone || '+91 98765 00000',
    password,
    role: 'staff',
    staffRole: 'roastery_staff',
    staffStatus: 'pending',
    staffDepartment: department || 'Roastery Floor',
    staffApplicationNotes: applicationNotes || 'Staff onboarding applicant',
    permissions: [],
  });

  return res.status(201).json({
    success: true,
    message: 'Staff application submitted successfully. An administrator will review your credentials before activation.',
    applicant: staffUser.toJSON(),
    user: staffUser.toJSON(),
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

  // Prevent login if staff account is not active
  if (user.role === 'staff' || user.role === 'admin') {
    if (user.staffStatus === 'pending') {
      return res.status(403).json({
        success: false,
        error: 'Staff account is pending administrative approval.',
      });
    }
    if (user.staffStatus === 'suspended' || user.staffStatus === 'deactivated') {
      return res.status(403).json({
        success: false,
        error: `Staff account is ${user.staffStatus}. Access revoked. Contact roastery administration.`,
      });
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

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

// PUT /api/v1/auth/profile
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  const { name, phone, shippingAddress } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Full name must be at least 2 characters.',
      });
    }
    req.user.name = name.trim();
  }

  if (phone !== undefined) {
    if (typeof phone !== 'string' || phone.trim().length < 7) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be at least 7 characters.',
      });
    }
    req.user.phone = phone.trim();
  }

  if (shippingAddress) {
    const { street, apartment, city, state, postalCode, country } = shippingAddress;
    if (!street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        error: 'Street, city, state, and postal code are required for shipping address.',
      });
    }
    req.user.shippingAddress = {
      street: String(street).trim(),
      apartment: apartment ? String(apartment).trim() : '',
      city: String(city).trim(),
      state: String(state).trim(),
      postalCode: String(postalCode).trim(),
      country: country ? String(country).trim() : 'India',
    };
  }

  await req.user.save();

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: req.user.toJSON(),
  });
}

