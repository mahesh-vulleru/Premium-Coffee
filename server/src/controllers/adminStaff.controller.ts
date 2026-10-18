import type { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, type StaffRole, type StaffStatus } from '../models/User.js';
import { AdminToken } from '../models/AdminToken.js';
import { logAdminAction } from '../utils/auditLogger.js';
import { ROLE_DEFAULT_PERMISSIONS, getEffectivePermissions, type Permission } from '../config/permissions.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * GET /api/v1/admin/staff/applications
 * List pending staff applications awaiting administrative review.
 */
export async function listStaffApplications(_req: AuthenticatedRequest, res: Response) {
  try {
    const applications = await User.find({
      role: 'staff',
      staffStatus: 'pending',
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map((u) => u.toJSON()),
    });
  } catch (error: any) {
    console.error('[Admin Staff] Error listing staff applications:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve staff applications' });
  }
}

/**
 * POST /api/v1/admin/staff/:id/approval
 * Approve or reject a pending staff application with role and permissions.
 */
export async function decideStaffApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { decision, role, permissions, department, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid staff applicant ID' });
    }

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be "approve" or "reject"' });
    }

    // Prevent self-approval
    if (req.user?._id?.toString() === id) {
      return res.status(403).json({ success: false, error: 'Self-approval is strictly forbidden' });
    }

    const staffUser = await User.findById(id);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ success: false, error: 'Staff applicant not found' });
    }

    if (decision === 'approve') {
      const assignedRole: StaffRole = role || 'roastery_staff';
      const assignedPermissions: string[] =
        Array.isArray(permissions) && permissions.length > 0
          ? permissions
          : ROLE_DEFAULT_PERMISSIONS[assignedRole] || [];

      // Elevate to admin role if assigned owner, else remain staff
      if (assignedRole === 'owner') {
        staffUser.role = 'admin';
      }

      staffUser.staffRole = assignedRole;
      staffUser.permissions = assignedPermissions;
      staffUser.staffStatus = 'active';
      if (department) staffUser.staffDepartment = department;

      if (!staffUser.approvalHistory) staffUser.approvalHistory = [];
      staffUser.approvalHistory.push({
        decidedBy: req.user?.name || 'Administrator',
        decidedAt: new Date(),
        action: 'approved',
        reason: reason || 'Application approved by roastery management',
        roleAssigned: assignedRole,
      });

      await staffUser.save();

      await logAdminAction({
        actor: {
          userId: req.user?._id,
          name: req.user?.name || 'Administrator',
          email: req.user?.email || 'admin@firedupcoffee.com',
          role: req.user?.staffRole || req.user?.role || 'admin',
        },
        action: 'STAFF_APPLICATION_APPROVED',
        resource: 'Staff',
        resourceId: staffUser._id.toString(),
        details: {
          applicantEmail: staffUser.email,
          assignedRole,
          permissionsCount: assignedPermissions.length,
          reason,
        },
      });

      return res.status(200).json({
        success: true,
        message: `Staff member ${staffUser.name} approved as ${assignedRole}`,
        staff: staffUser.toJSON(),
      });
    } else {
      // Rejection
      staffUser.staffStatus = 'deactivated';

      if (!staffUser.approvalHistory) staffUser.approvalHistory = [];
      staffUser.approvalHistory.push({
        decidedBy: req.user?.name || 'Administrator',
        decidedAt: new Date(),
        action: 'rejected',
        reason: reason || 'Application declined by management',
      });

      await staffUser.save();

      await logAdminAction({
        actor: {
          userId: req.user?._id,
          name: req.user?.name || 'Administrator',
          email: req.user?.email || 'admin@firedupcoffee.com',
          role: req.user?.staffRole || req.user?.role || 'admin',
        },
        action: 'STAFF_APPLICATION_REJECTED',
        resource: 'Staff',
        resourceId: staffUser._id.toString(),
        details: {
          applicantEmail: staffUser.email,
          reason,
        },
      });

      return res.status(200).json({
        success: true,
        message: `Staff application for ${staffUser.name} declined`,
        staff: staffUser.toJSON(),
      });
    }
  } catch (error: any) {
    console.error('[Admin Staff] Error deciding staff application:', error);
    return res.status(500).json({ success: false, error: 'Failed to process staff application' });
  }
}

/**
 * GET /api/v1/admin/staff/directory
 * List all staff members with role, permissions, status, and activity.
 */
export async function listStaffDirectory(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, role, search } = req.query;

    const query: Record<string, any> = {
      role: { $in: ['admin', 'staff'] },
    };

    if (status && status !== 'all') {
      query.staffStatus = status;
    }

    if (role && role !== 'all') {
      query.staffRole = role;
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { staffDepartment: { $regex: term, $options: 'i' } },
      ];
    }

    const staffMembers = await User.find(query).sort({ createdAt: -1 });

    const formatted = staffMembers.map((u) => {
      const json: any = u.toJSON();
      json.effectivePermissions = getEffectivePermissions(u);
      return json;
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      staff: formatted,
    });
  } catch (error: any) {
    console.error('[Admin Staff] Error listing staff directory:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve staff directory' });
  }
}

/**
 * PATCH /api/v1/admin/staff/:id/role-permissions
 * Update role and granular permissions for a staff member.
 */
export async function updateStaffRoleAndPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { staffRole, permissions, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid staff ID' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser || (targetUser.role !== 'admin' && targetUser.role !== 'staff')) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    // Owner protection safeguard: Cannot demote the last active owner!
    if (
      (targetUser.role === 'admin' || targetUser.staffRole === 'owner') &&
      staffRole !== 'owner'
    ) {
      const activeOwnersCount = await User.countDocuments({
        $or: [{ role: 'admin' }, { staffRole: 'owner' }],
        staffStatus: { $ne: 'deactivated' },
        _id: { $ne: targetUser._id },
      });

      if (activeOwnersCount === 0) {
        return res.status(400).json({
          success: false,
          error: 'Protection rule: Cannot demote the primary/last active business owner.',
        });
      }
    }

    const previousRole = targetUser.staffRole || targetUser.role;

    if (staffRole) {
      targetUser.staffRole = staffRole as StaffRole;
      if (staffRole === 'owner') {
        targetUser.role = 'admin';
      } else {
        targetUser.role = 'staff';
      }
    }

    if (Array.isArray(permissions)) {
      targetUser.permissions = permissions;
    }

    if (department !== undefined) {
      targetUser.staffDepartment = department ? String(department).trim() : undefined;
    }

    if (!targetUser.approvalHistory) targetUser.approvalHistory = [];
    targetUser.approvalHistory.push({
      decidedBy: req.user?.name || 'Administrator',
      decidedAt: new Date(),
      action: 'role_changed',
      reason: `Role updated from ${previousRole} to ${targetUser.staffRole}`,
      roleAssigned: targetUser.staffRole,
    });

    await targetUser.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'STAFF_PERMISSIONS_UPDATED',
      resource: 'Staff',
      resourceId: targetUser._id.toString(),
      details: {
        targetEmail: targetUser.email,
        previousRole,
        newRole: targetUser.staffRole,
        permissionsCount: targetUser.permissions?.length || 0,
      },
    });

    const json: any = targetUser.toJSON();
    json.effectivePermissions = getEffectivePermissions(targetUser);

    return res.status(200).json({
      success: true,
      message: `Staff member ${targetUser.name} permissions updated`,
      staff: json,
    });
  } catch (error: any) {
    console.error('[Admin Staff] Error updating staff permissions:', error);
    return res.status(500).json({ success: false, error: 'Failed to update staff permissions' });
  }
}

/**
 * PATCH /api/v1/admin/staff/:id/status
 * Suspend, reactivate, or deactivate a staff account.
 */
export async function updateStaffStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid staff ID' });
    }

    const validStatuses: StaffStatus[] = ['active', 'suspended', 'deactivated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Prevent self-suspension/deactivation
    if (req.user?._id?.toString() === id && status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'You cannot suspend or deactivate your own account.',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser || (targetUser.role !== 'admin' && targetUser.role !== 'staff')) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    // Owner protection safeguard: Cannot suspend or deactivate the last active owner!
    if (
      (targetUser.role === 'admin' || targetUser.staffRole === 'owner') &&
      status !== 'active'
    ) {
      const otherActiveOwners = await User.countDocuments({
        $or: [{ role: 'admin' }, { staffRole: 'owner' }],
        staffStatus: 'active',
        _id: { $ne: targetUser._id },
      });

      if (otherActiveOwners === 0) {
        return res.status(400).json({
          success: false,
          error: 'Protection rule: Cannot suspend or deactivate the primary/last active business owner.',
        });
      }
    }

    const previousStatus = targetUser.staffStatus || 'active';
    targetUser.staffStatus = status;

    if (!targetUser.approvalHistory) targetUser.approvalHistory = [];
    targetUser.approvalHistory.push({
      decidedBy: req.user?.name || 'Administrator',
      decidedAt: new Date(),
      action: status === 'active' ? 'reactivated' : 'suspended',
      reason: reason || `Status changed from ${previousStatus} to ${status}`,
    });

    await targetUser.save();

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: `STAFF_STATUS_${status.toUpperCase()}`,
      resource: 'Staff',
      resourceId: targetUser._id.toString(),
      details: {
        targetEmail: targetUser.email,
        previousStatus,
        newStatus: status,
        reason,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Staff member ${targetUser.name} status updated to ${status}`,
      staff: targetUser.toJSON(),
    });
  } catch (error: any) {
    console.error('[Admin Staff] Error updating staff status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update staff status' });
  }
}

/**
 * POST /api/v1/admin/staff/invite
 * Generate a single-use expiring invitation token for staff onboarding.
 */
export async function createStaffInvitation(req: AuthenticatedRequest, res: Response) {
  try {
    const { department, role, invitedEmail, expiresInDays, permissions } = req.body;

    const rawRandom = crypto.randomBytes(8).toString('hex').toUpperCase();
    const tokenString = `FIREDUP-STAFF-${rawRandom}`;
    const days = expiresInDays ? parseInt(expiresInDays, 10) : 7;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const assignedRole: StaffRole = role || 'roastery_staff';
    const assignedPermissions =
      Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ROLE_DEFAULT_PERMISSIONS[assignedRole] || [];

    const tokenDoc = await AdminToken.create({
      token: tokenString,
      department: department || 'Roastery Operations',
      role: assignedRole,
      permissions: assignedPermissions,
      invitedEmail: invitedEmail ? String(invitedEmail).toLowerCase().trim() : undefined,
      expiresAt,
      createdBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
      },
    });

    await logAdminAction({
      actor: {
        userId: req.user?._id,
        name: req.user?.name || 'Administrator',
        email: req.user?.email || 'admin@firedupcoffee.com',
        role: req.user?.staffRole || req.user?.role || 'admin',
      },
      action: 'STAFF_INVITATION_CREATED',
      resource: 'AdminToken',
      resourceId: tokenDoc._id.toString(),
      details: {
        invitedEmail,
        department: tokenDoc.department,
        role: assignedRole,
        expiresAt,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Staff invitation created successfully',
      invitation: {
        id: tokenDoc._id,
        token: tokenDoc.token,
        department: tokenDoc.department,
        role: tokenDoc.role,
        permissions: tokenDoc.permissions,
        invitedEmail: tokenDoc.invitedEmail,
        expiresAt: tokenDoc.expiresAt,
        createdAt: tokenDoc.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Staff] Error creating staff invitation:', error);
    return res.status(500).json({ success: false, error: 'Failed to create staff invitation' });
  }
}
