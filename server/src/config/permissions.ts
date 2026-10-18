import type { StaffRole, IUser } from '../models/User.js';

export const ALL_PERMISSIONS = [
  'orders.read',
  'orders.update',
  'orders.fulfillment',
  'cancellations.review',
  'returns.review',
  'refunds.read',
  'refunds.manage',
  'inventory.read',
  'inventory.update',
  'products.manage',
  'pricing.manage',
  'promotions.manage',
  'categories.manage',
  'content.manage',
  'wholesale.manage',
  'finance.read',
  'finance.reconcile',
  'expenses.manage',
  'reports.read',
  'reports.export',
  'staff.read',
  'staff.approve',
  'staff.manage',
  'roles.manage',
  'audit.read',
  'settings.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, Permission[]> = {
  owner: [...ALL_PERMISSIONS],
  store_manager: [
    'orders.read',
    'orders.update',
    'orders.fulfillment',
    'cancellations.review',
    'returns.review',
    'inventory.read',
    'products.manage',
    'reports.read',
  ],
  finance_manager: [
    'orders.read',
    'refunds.read',
    'refunds.manage',
    'finance.read',
    'finance.reconcile',
    'expenses.manage',
    'reports.read',
    'reports.export',
  ],
  roastery_staff: [
    'orders.read',
    'orders.fulfillment',
    'inventory.read',
    'inventory.update',
  ],
  customer_support: [
    'orders.read',
    'cancellations.review',
    'returns.review',
    'refunds.read',
  ],
  wholesale_manager: [
    'orders.read',
    'orders.update',
    'orders.fulfillment',
    'wholesale.manage',
    'reports.read',
  ],
  marketing_manager: [
    'products.manage',
    'promotions.manage',
    'categories.manage',
    'content.manage',
    'reports.read',
  ],
  analyst: [
    'orders.read',
    'reports.read',
    'audit.read',
  ],
};

export const PERMISSION_ALIASES: Record<string, Permission> = {
  'staff.view': 'staff.read',
  'staff.read': 'staff.read',
  'staff.approve': 'staff.approve',
  'staff.manage': 'staff.manage',
  'roles.manage': 'roles.manage',
  'inventory.write': 'inventory.update',
  'inventory.update': 'inventory.update',
  'orders.cancel_approve': 'cancellations.review',
  'cancellations.review': 'cancellations.review',
  'returns.review': 'returns.review',
  'orders.fulfill': 'orders.fulfillment',
  'orders.fulfillment': 'orders.fulfillment',
  'refunds.execute': 'refunds.manage',
  'refunds.manage': 'refunds.manage',
  'reports.view': 'reports.read',
  'reports.read': 'reports.read',
};

export function normalizePermission(perm: string): Permission | string {
  return PERMISSION_ALIASES[perm] || perm;
}

/**
 * Returns effective permissions for a user.
 * Owners and legacy 'admin' role automatically receive all permissions.
 * Other staff receive their customized permissions or role defaults.
 */
export function getEffectivePermissions(user: IUser): Permission[] {
  if (user.role === 'admin' || user.staffRole === 'owner') {
    return [...ALL_PERMISSIONS];
  }

  // If user has custom permissions array explicitly set, use that with normalization
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    const permSet = new Set<Permission>();
    for (const p of user.permissions) {
      const canonical = PERMISSION_ALIASES[p] || (p as Permission);
      permSet.add(canonical);
    }
    return Array.from(permSet);
  }

  // Otherwise fallback to their staff role defaults
  if (user.staffRole && ROLE_DEFAULT_PERMISSIONS[user.staffRole]) {
    return ROLE_DEFAULT_PERMISSIONS[user.staffRole];
  }

  // Legacy 'staff' default
  if (user.role === 'staff') {
    return ROLE_DEFAULT_PERMISSIONS.roastery_staff;
  }

  return [];
}

/**
 * Check if a user has a specific permission.
 */
export function hasUserPermission(user: IUser, permission: Permission | string): boolean {
  if (user.role === 'admin' || user.staffRole === 'owner') {
    return true;
  }

  const effective = getEffectivePermissions(user);
  const target = normalizePermission(permission);

  return (
    effective.includes(permission as Permission) ||
    effective.includes(target as Permission) ||
    (Array.isArray(user.permissions) && user.permissions.includes(permission))
  );
}

