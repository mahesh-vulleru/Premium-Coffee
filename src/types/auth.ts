export type UserRole = 'customer' | 'wholesale' | 'admin' | 'staff';

export type StaffRole =
  | 'owner'
  | 'store_manager'
  | 'finance_manager'
  | 'roastery_staff'
  | 'customer_support'
  | 'wholesale_manager'
  | 'marketing_manager'
  | 'analyst';

export type StaffStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

export type WholesaleStatus = 'pending' | 'approved' | 'rejected';

export interface ShippingAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface WholesaleDetails {
  businessName: string;
  taxId: string;
  businessType: 'cafe' | 'restaurant' | 'office' | 'retailer' | 'hotel' | 'other';
  monthlyVolumeKg: string;
  deliveryAddress: ShippingAddress;
  status: WholesaleStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  staffRole?: StaffRole;
  permissions?: string[];
  effectivePermissions?: string[];
  staffStatus?: StaffStatus;
  staffDepartment?: string;
  staffApplicationNotes?: string;
  lastLoginAt?: string;
  createdAt: string;
  shippingAddress?: ShippingAddress;
  wholesaleDetails?: WholesaleDetails;
  adminSecurityBadge?: string;
}

export interface CustomerRegistrationPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  shippingAddress: ShippingAddress;
}

export interface WholesaleRegistrationPayload {
  contactName: string;
  businessName: string;
  businessType: 'cafe' | 'restaurant' | 'office' | 'retailer' | 'hotel' | 'other';
  taxId: string;
  monthlyVolumeKg: string;
  email: string;
  phone: string;
  password: string;
  deliveryAddress: ShippingAddress;
}

export interface AdminRegistrationPayload {
  name: string;
  email: string;
  password: string;
  invitationToken: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  shippingAddress?: ShippingAddress;
}

