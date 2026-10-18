import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  Building2,
  Users,
  LogOut,
  Package,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Truck,
  FileText,
  Search,
  Eye,
  Boxes,
  Ban,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Receipt,
  RotateCcw,
  Settings,
  Bell,
  Download,
  Plus,
  Trash2,
  Layers,
  Tag,
  Layout,
  BarChart3,
  Coffee,
  Menu,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../utils/pricing';
import { ShopMaintenanceSection } from '../components/ShopMaintenanceSection';

// Tab identifiers for all 20 modules
export type AdminTab =
  | 'overview'
  | 'staff-approvals'
  | 'staff-directory'
  | 'roles-permissions'
  | 'retail-orders'
  | 'wholesale-orders'
  | 'cancellations'
  | 'fulfillment'
  | 'products'
  | 'inventory'
  | 'pricing'
  | 'promotions'
  | 'categories'
  | 'storefront-content'
  | 'finance'
  | 'expenses'
  | 'reports'
  | 'audit-logs'
  | 'notifications'
  | 'settings';

interface AdminMetrics {
  applications: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  users: {
    retail: number;
    wholesale: number;
    wholesaleApproved: number;
    admin: number;
    total: number;
  };
  orders: {
    total: number;
    wholesale: number;
    retail: number;
    totalRevenue: number;
    totalKg: number;
    byStatus: Record<string, number>;
  };
  inventory: {
    totalProducts: number;
    inStockProducts: number;
    lowStockProducts: number;
    totalStockBags: number;
  };
}

interface FinanceSummary {
  currency: string;
  orders: {
    total: number;
    retail: number;
    wholesale: number;
  };
  sales: {
    grossRetailSales: number;
    grossWholesaleSales: number;
    totalGrossSales: number;
    totalDiscounts: number;
    totalTaxCollected: number;
    totalShippingFees: number;
    netSales: number;
  };
  cashflow: {
    collectedRevenue: number;
    wholesaleReceivables: number;
    pendingPayments: number;
    refundedAmount: number;
    refundPendingAmount: number;
    failedPaymentsCount: number;
    totalExpenses: number;
    netOperatingCash: number;
  };
  expensesByCategory: Record<string, number>;
  paymentMethodsBreakdown: Record<string, number>;
}

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'urgent';
  category: 'staff' | 'wholesale' | 'order' | 'inventory' | 'finance';
  title: string;
  message: string;
  link: string;
  timestamp: string;
}

interface BusinessSettingsData {
  businessName: string;
  tagline: string;
  gstin: string;
  contactEmail: string;
  contactPhone: string;
  roasteryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  wholesaleMoqKg: number;
  orderPrefix: string;
  wholesaleOrderPrefix: string;
  taxPercent: number;
  roasteryCapacityKgPerDay: number;
}

export const PERMISSION_ALIASES_MAP: Record<string, string> = {
  'staff.view': 'staff.read',
  'inventory.write': 'inventory.update',
  'orders.cancel_approve': 'cancellations.review',
  'orders.fulfill': 'orders.fulfillment',
  'refunds.execute': 'refunds.manage',
  'reports.view': 'reports.read',
};

export const CANONICAL_PERMISSIONS: { id: string; label: string; group: string }[] = [
  { id: 'orders.read', label: 'View Orders & Queue', group: 'Orders & Fulfillment' },
  { id: 'orders.update', label: 'Update Order Status', group: 'Orders & Fulfillment' },
  { id: 'orders.fulfillment', label: 'Roastery Fulfillment & Tracking', group: 'Orders & Fulfillment' },
  { id: 'cancellations.review', label: 'Review & Decide Cancellations', group: 'Orders & Fulfillment' },
  { id: 'returns.review', label: 'Review & Restock Returns', group: 'Orders & Fulfillment' },
  { id: 'refunds.read', label: 'View Refunds & Logs', group: 'Finance & Payments' },
  { id: 'refunds.manage', label: 'Execute Order Refunds', group: 'Finance & Payments' },
  { id: 'finance.read', label: 'View Financial Summaries', group: 'Finance & Payments' },
  { id: 'finance.reconcile', label: 'Reconcile Financial Accounts', group: 'Finance & Payments' },
  { id: 'expenses.manage', label: 'Record & Manage Expenses', group: 'Finance & Payments' },
  { id: 'inventory.read', label: 'View Warehouse Inventory', group: 'Products & Catalogue' },
  { id: 'inventory.update', label: 'Adjust Warehouse Stock', group: 'Products & Catalogue' },
  { id: 'products.manage', label: 'Manage Products & Roasts', group: 'Products & Catalogue' },
  { id: 'pricing.manage', label: 'Manage Retail & Sale Pricing', group: 'Products & Catalogue' },
  { id: 'promotions.manage', label: 'Manage Promo Coupons', group: 'Products & Catalogue' },
  { id: 'categories.manage', label: 'Manage Taxonomy Categories', group: 'Products & Catalogue' },
  { id: 'content.manage', label: 'Manage Storefront Content', group: 'Storefront & B2B' },
  { id: 'wholesale.manage', label: 'Review Wholesale Applications', group: 'Storefront & B2B' },
  { id: 'reports.read', label: 'View Reports & Charts', group: 'Reports & Governance' },
  { id: 'reports.export', label: 'Export Data to CSV', group: 'Reports & Governance' },
  { id: 'audit.read', label: 'View Administrative Audit Trail', group: 'Reports & Governance' },
  { id: 'staff.read', label: 'View Staff Directory', group: 'Staff Governance' },
  { id: 'staff.approve', label: 'Review Staff Applications', group: 'Staff Governance' },
  { id: 'staff.manage', label: 'Manage Staff Status & Invites', group: 'Staff Governance' },
  { id: 'roles.manage', label: 'Assign Roles & Permissions', group: 'Staff Governance' },
  { id: 'settings.manage', label: 'Manage Business Settings', group: 'Staff Governance' },
];

export const ROLE_PRESETS: Record<string, string[]> = {
  owner: CANONICAL_PERMISSIONS.map((p) => p.id),
  store_manager: [
    'orders.read',
    'orders.update',
    'orders.fulfillment',
    'cancellations.review',
    'returns.review',
    'inventory.read',
    'inventory.update',
    'products.manage',
    'pricing.manage',
    'promotions.manage',
    'categories.manage',
    'content.manage',
    'staff.read',
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
    'orders.update',
    'cancellations.review',
    'returns.review',
    'refunds.read',
    'products.manage',
  ],
  wholesale_manager: [
    'orders.read',
    'orders.update',
    'orders.fulfillment',
    'wholesale.manage',
    'reports.read',
    'reports.export',
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
    'reports.export',
    'audit.read',
    'finance.read',
  ],
};

export const AdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentUser,
    isLoading,
    allUsers,
    approveWholesaleUser,
    rejectWholesaleUser,
    logout,
  } = useAuth();

  // Active Tab synchronized with searchParams
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const activeTab: AdminTab = tabParam || 'overview';

  const setActiveTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  const [notification, setNotification] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Server-Authoritative Metrics & Data
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  // Staff State
  const [staffApplications, setStaffApplications] = useState<any[]>([]);
  const [staffDirectory, setStaffDirectory] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState('all');

  // Staff Action Modals
  const [staffApprovalModal, setStaffApprovalModal] = useState<{
    user: any;
    decision: 'approve' | 'reject';
  } | null>(null);
  const [staffApprovalRole, setStaffApprovalRole] = useState<string>('roastery_staff');
  const [staffApprovalReason, setStaffApprovalReason] = useState<string>('');
  const [isSubmittingStaffDecision, setIsSubmittingStaffDecision] = useState(false);

  const [editPermissionsModalUser, setEditPermissionsModalUser] = useState<any | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<string>('roastery_staff');
  const [editPermissionsList, setEditPermissionsList] = useState<string[]>([]);
  const [isSubmittingRoleEdit, setIsSubmittingRoleEdit] = useState(false);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('roastery_staff');
  const [inviteDepartment, setInviteDepartment] = useState('Roastery Operations');
  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Orders State
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [inspectingOrder, setInspectingOrder] = useState<any | null>(null);

  // Wholesale Applications State
  const [wholesaleSubTab, setWholesaleSubTab] = useState<'orders' | 'applications'>('orders');
  const [appFilter, setAppFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [appSearch, setAppSearch] = useState('');
  const [rejectingUser, setRejectingUser] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Volume under commercial minimum or documentation incomplete.');
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);

  // Cancellation Decision State
  const [cancellationModal, setCancellationModal] = useState<{
    order: any;
    decision: 'approve' | 'reject';
  } | null>(null);
  const [cancellationDecisionReason, setCancellationDecisionReason] = useState('');
  const [isDecidingCancellation, setIsDecidingCancellation] = useState(false);

  // Return Decision State
  const [returnModal, setReturnModal] = useState<{
    order: any;
    decision: 'approve' | 'reject';
  } | null>(null);
  const [returnDecisionReason, setReturnDecisionReason] = useState('');
  const [returnRestoreInventory, setReturnRestoreInventory] = useState(true);
  const [isDecidingReturn, setIsDecidingReturn] = useState(false);

  // Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<any | null>(null);
  const [refundFormAmount, setRefundFormAmount] = useState<number>(0);
  const [refundFormReason, setRefundFormReason] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Tracking Update State
  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    courierName: 'BlueDart Express',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDeliveryDate: '',
  });
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

  // Expenses State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [isRecordExpenseModalOpen, setIsRecordExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'green_coffee',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    vendor: '',
    invoiceNumber: '',
    notes: '',
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Reports State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState('30');
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Business Settings State
  const [settingsData, setSettingsData] = useState<BusinessSettingsData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<BusinessSettingsData>>({});

  // --------------------------------------------------------------------------
  // Data Fetching Callbacks
  // --------------------------------------------------------------------------
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/metrics', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load server admin metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchFinanceSummary = useCallback(async () => {
    setFinanceLoading(true);
    try {
      const res = await fetch('/api/v1/admin/finance/summary', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.summary) {
        setFinanceSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load finance summary:', err);
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/notifications', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.notifications)) {
        setNotificationsList(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/v1/admin/orders', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchStaffData = useCallback(async () => {
    setStaffLoading(true);
    try {
      const [appsRes, dirRes] = await Promise.all([
        fetch('/api/v1/admin/staff/applications', { credentials: 'include' }),
        fetch('/api/v1/admin/staff/directory', { credentials: 'include' }),
      ]);
      const [appsData, dirData] = await Promise.all([appsRes.json(), dirRes.json()]);
      if (appsRes.ok && appsData.success) {
        setStaffApplications(appsData.applications || []);
      }
      if (dirRes.ok && dirData.success) {
        setStaffDirectory(dirData.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const res = await fetch('/api/v1/admin/finance/expenses', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/reports/analytics?days=${analyticsDays}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDays]);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/settings', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.settings) {
        setSettingsData(data.settings);
        setSettingsForm(data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
      fetchMetrics();
      fetchFinanceSummary();
      fetchNotifications();
      fetchOrders();
    }
  }, [currentUser, fetchMetrics, fetchFinanceSummary, fetchNotifications, fetchOrders]);

  // Tab-dependent fetching
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === 'staff-approvals' || activeTab === 'staff-directory' || activeTab === 'roles-permissions') {
      fetchStaffData();
    } else if (activeTab === 'finance' || activeTab === 'expenses') {
      fetchFinanceSummary();
      fetchExpenses();
    } else if (activeTab === 'reports') {
      fetchAnalytics();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, currentUser, fetchStaffData, fetchFinanceSummary, fetchExpenses, fetchAnalytics, fetchSettings]);

  // --------------------------------------------------------------------------
  // Authorization & Permissions Helpers
  // --------------------------------------------------------------------------
  const isOwner = currentUser?.role === 'admin' || currentUser?.staffRole === 'owner';

  const userHasPermission = useCallback(
    (perm: string) => {
      if (isOwner) return true;
      if (!currentUser) return false;
      const canonical = PERMISSION_ALIASES_MAP[perm] || perm;
      const userPerms = [
        ...(Array.isArray(currentUser.permissions) ? currentUser.permissions : []),
        ...(Array.isArray(currentUser.effectivePermissions) ? currentUser.effectivePermissions : []),
      ];
      return (
        userPerms.includes(perm) ||
        userPerms.includes(canonical) ||
        userPerms.some((p) => (PERMISSION_ALIASES_MAP[p] || p) === canonical)
      );
    },
    [isOwner, currentUser]
  );

  // --------------------------------------------------------------------------
  // Action Handlers: Wholesale Approvals
  // --------------------------------------------------------------------------
  const handleApproveWholesale = async (userId: string) => {
    try {
      await approveWholesaleUser(userId);
      setNotification('Wholesale partner successfully verified and approved.');
      setTimeout(() => setNotification(null), 4000);
      fetchMetrics();
      fetchNotifications();
    } catch {
      setNotification('Failed to approve wholesale partner.');
    }
  };

  const handleRejectWholesale = async () => {
    if (!rejectingUser) return;
    try {
      await rejectWholesaleUser(rejectingUser.id, rejectionReason);
      setNotification(`Wholesale application declined for ${rejectingUser.name}.`);
      setRejectingUser(null);
      setTimeout(() => setNotification(null), 4000);
      fetchMetrics();
      fetchNotifications();
    } catch {
      setNotification('Failed to reject application.');
    }
  };

  // --------------------------------------------------------------------------
  // Action Handlers: Cancellation & Returns
  // --------------------------------------------------------------------------
  const handleDecideCancellation = async () => {
    if (!cancellationModal) return;
    setIsDecidingCancellation(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${cancellationModal.order._id}/cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision: cancellationModal.decision,
          reason: cancellationDecisionReason || `Administrative decision: ${cancellationModal.decision}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Cancellation request ${cancellationModal.decision}d for Order #${cancellationModal.order.orderNumber}`);
        setCancellationModal(null);
        setCancellationDecisionReason('');
        fetchOrders();
        fetchMetrics();
        fetchNotifications();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to process cancellation decision');
      }
    } catch {
      setNotification('Network error processing cancellation');
    } finally {
      setIsDecidingCancellation(false);
    }
  };

  const handleDecideReturn = async () => {
    if (!returnModal) return;
    setIsDecidingReturn(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${returnModal.order._id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision: returnModal.decision,
          reason: returnDecisionReason || `Return request ${returnModal.decision}d`,
          restoreInventory: returnRestoreInventory,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Return request ${returnModal.decision}d for Order #${returnModal.order.orderNumber}`);
        setReturnModal(null);
        setReturnDecisionReason('');
        fetchOrders();
        fetchNotifications();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to process return decision');
      }
    } catch {
      setNotification('Network error processing return decision');
    } finally {
      setIsDecidingReturn(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${refundModalOrder._id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: refundFormAmount,
          reason: refundFormReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Refund of ₹${refundFormAmount} processed for Order #${refundModalOrder.orderNumber}`);
        setRefundModalOrder(null);
        fetchOrders();
        fetchFinanceSummary();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to process refund');
      }
    } catch {
      setNotification('Network error issuing refund');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    setIsSubmittingTracking(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${trackingModalOrder._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courierName: trackingForm.courierName,
          trackingNumber: trackingForm.trackingNumber,
          trackingUrl: trackingForm.trackingUrl,
          estimatedDeliveryDate: trackingForm.estimatedDeliveryDate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Tracking updated for Order #${trackingModalOrder.orderNumber}`);
        setTrackingModalOrder(null);
        fetchOrders();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to update courier tracking');
      }
    } catch {
      setNotification('Network error updating tracking');
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  // --------------------------------------------------------------------------
  // Action Handlers: Staff Lifecycle & Onboarding
  // --------------------------------------------------------------------------
  const handleDecideStaffApp = async () => {
    if (!staffApprovalModal) return;
    setIsSubmittingStaffDecision(true);
    try {
      const res = await fetch(`/api/v1/admin/staff/${staffApprovalModal.user._id || staffApprovalModal.user.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision: staffApprovalModal.decision,
          role: staffApprovalRole,
          reason: staffApprovalReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Staff application ${staffApprovalModal.decision}d successfully`);
        setStaffApprovalModal(null);
        fetchStaffData();
        fetchNotifications();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to process staff application');
      }
    } catch {
      setNotification('Network error processing staff application');
    } finally {
      setIsSubmittingStaffDecision(false);
    }
  };

  const handleSaveStaffRolePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermissionsModalUser) return;
    setIsSubmittingRoleEdit(true);
    try {
      const res = await fetch(
        `/api/v1/admin/staff/${editPermissionsModalUser._id || editPermissionsModalUser.id}/role-permissions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            staffRole: editRoleValue,
            permissions: editPermissionsList,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Role and permissions updated for ${editPermissionsModalUser.name}`);
        setEditPermissionsModalUser(null);
        fetchStaffData();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to update permissions');
      }
    } catch {
      setNotification('Network error saving permissions');
    } finally {
      setIsSubmittingRoleEdit(false);
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentStatus: string, name: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to change ${name}'s status to ${nextStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/v1/admin/staff/${staffId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: nextStatus,
          reason: `Status toggled to ${nextStatus} by administrator`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Staff account ${name} is now ${nextStatus}`);
        fetchStaffData();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to update staff status');
      }
    } catch {
      setNotification('Network error toggling staff status');
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInvite(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/v1/admin/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          role: inviteRole,
          department: inviteDepartment,
          invitedEmail: inviteEmail || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInviteResult(data.invitation);
        setNotification('Invitation token generated successfully');
      } else {
        setNotification(data.error || 'Failed to create staff invitation');
      }
    } catch {
      setNotification('Network error generating invitation');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // --------------------------------------------------------------------------
  // Action Handlers: Expenses & Finance
  // --------------------------------------------------------------------------
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingExpense(true);
    try {
      const res = await fetch('/api/v1/admin/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification('Operational expenditure recorded successfully');
        setIsRecordExpenseModalOpen(false);
        setExpenseForm({
          category: 'green_coffee',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'bank_transfer',
          vendor: '',
          invoiceNumber: '',
          notes: '',
        });
        fetchExpenses();
        fetchFinanceSummary();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to record expense');
      }
    } catch {
      setNotification('Network error recording expense');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this expense record?')) return;
    try {
      const res = await fetch(`/api/v1/admin/finance/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification('Expense record removed');
        fetchExpenses();
        fetchFinanceSummary();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to delete expense');
      }
    } catch {
      setNotification('Network error deleting expense');
    }
  };

  // --------------------------------------------------------------------------
  // Action Handlers: Reports Export
  // --------------------------------------------------------------------------
  const handleExportCsv = async (type: string) => {
    setIsExportingCsv(true);
    try {
      const res = await fetch(`/api/v1/admin/reports/export?type=${type}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firedup-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setNotification(`CSV report for ${type} exported successfully`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification(err.message || 'Failed to export CSV report');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // --------------------------------------------------------------------------
  // Action Handlers: Settings
  // --------------------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification('Roastery business settings saved successfully');
        setSettingsData(data.settings);
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(data.error || 'Failed to update business settings');
      }
    } catch {
      setNotification('Network error saving settings');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Access Control Guards
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-4 bg-[#140e0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-500 flex items-center justify-center border border-stone-800 shadow-xl animate-pulse">
            <Coffee className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-100">Connecting to Owner Control Center...</h2>
            <p className="text-xs text-amber-200/60 mt-1">Verifying administrative security credentials</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'staff')) {
    return (
      <div className="min-h-screen py-20 px-4 bg-[#140e0a] flex items-center justify-center">
        <div className="max-w-md w-full bg-stone-900 rounded-3xl p-8 border border-stone-800 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center border border-amber-800/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-100">Access Restricted</h1>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              You must possess verified staff or owner credentials to access the Firedup Specialty Coffee Control Center.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-amber-600 text-stone-950 font-bold text-xs hover:bg-amber-500 transition-colors shadow-md"
            >
              Sign In with Staff Account
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Account Suspended Guard
  if (currentUser.staffStatus === 'suspended' || currentUser.staffStatus === 'deactivated') {
    return (
      <div className="min-h-screen py-20 px-4 bg-[#140e0a] flex items-center justify-center">
        <div className="max-w-md w-full bg-stone-900 rounded-3xl p-8 border border-red-900/50 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 text-red-500 mx-auto flex items-center justify-center border border-red-800/50">
            <Ban className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-100">Account Suspended</h1>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Your staff account has been {currentUser.staffStatus} by roastery management. Protected operational access is currently revoked.
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Filtered Lists & Sub-collections
  // --------------------------------------------------------------------------
  const retailOrdersList = adminOrders.filter((o) => o.orderType !== 'wholesale');
  const wholesaleOrdersList = adminOrders.filter((o) => o.orderType === 'wholesale');
  const cancellationRequestsList = adminOrders.filter(
    (o) => o.cancellationStatus === 'requested' || o.returnStatus === 'requested' || o.cancellationStatus === 'approved'
  );

  const pendingCancellationCount = adminOrders.filter((o) => o.cancellationStatus === 'requested').length;
  const pendingReturnCount = adminOrders.filter((o) => o.returnStatus === 'requested').length;
  const pendingStaffCount = staffApplications.length;

  // Sidebar navigation modules metadata
  const navModules: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'EXECUTIVE' | 'STAFF' | 'ORDERS' | 'ROASTERY' | 'FINANCE' | 'GOVERNANCE';
    requiredPermission?: string;
    badgeCount?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: Layout, category: 'EXECUTIVE' },
    { id: 'notifications', label: 'Notifications', icon: Bell, category: 'EXECUTIVE', badgeCount: notificationsList.length },

    { id: 'staff-approvals', label: 'Staff Approvals', icon: UserCheck, category: 'STAFF', requiredPermission: 'staff.approve', badgeCount: pendingStaffCount },
    { id: 'staff-directory', label: 'Staff Directory', icon: Users, category: 'STAFF', requiredPermission: 'staff.read' },
    { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldCheck, category: 'STAFF', requiredPermission: 'roles.manage' },

    { id: 'retail-orders', label: 'Retail Orders', icon: Package, category: 'ORDERS', requiredPermission: 'orders.read' },
    { id: 'wholesale-orders', label: 'Wholesale Orders', icon: Building2, category: 'ORDERS', requiredPermission: 'wholesale.manage' },
    { id: 'cancellations', label: 'Cancellations & Returns', icon: RotateCcw, category: 'ORDERS', requiredPermission: 'cancellations.review', badgeCount: pendingCancellationCount + pendingReturnCount },
    { id: 'fulfillment', label: 'Fulfillment & Tracking', icon: Truck, category: 'ORDERS', requiredPermission: 'orders.fulfillment' },

    { id: 'products', label: 'Products & Catalogue', icon: Coffee, category: 'ROASTERY', requiredPermission: 'products.manage' },
    { id: 'inventory', label: 'Inventory & Roastery', icon: Boxes, category: 'ROASTERY', requiredPermission: 'inventory.read' },
    { id: 'pricing', label: 'Retail Pricing', icon: DollarSign, category: 'ROASTERY', requiredPermission: 'pricing.manage' },
    { id: 'promotions', label: 'Promotions & Coupons', icon: Tag, category: 'ROASTERY', requiredPermission: 'promotions.manage' },
    { id: 'categories', label: 'Categories', icon: Layers, category: 'ROASTERY', requiredPermission: 'categories.manage' },
    { id: 'storefront-content', label: 'Storefront Content', icon: FileText, category: 'ROASTERY', requiredPermission: 'content.manage' },

    { id: 'finance', label: 'Finance & Payments', icon: Receipt, category: 'FINANCE', requiredPermission: 'finance.read' },
    { id: 'expenses', label: 'Expenses & Costs', icon: TrendingUp, category: 'FINANCE', requiredPermission: 'expenses.manage' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, category: 'FINANCE', requiredPermission: 'reports.read' },

    { id: 'audit-logs', label: 'Audit Logs', icon: Clock, category: 'GOVERNANCE', requiredPermission: 'audit.read' },
    { id: 'settings', label: 'Business Settings', icon: Settings, category: 'GOVERNANCE', requiredPermission: 'settings.manage' },
  ];

  // Group modules for clean rendering
  const filteredNavModules = navModules.filter((m) => !m.requiredPermission || userHasPermission(m.requiredPermission));

  return (
    <div className="min-h-screen bg-[#140e0a] text-stone-100 flex flex-col lg:flex-row antialiased selection:bg-amber-600 selection:text-white">
      {/* ==================================================================== */}
      {/* SIDEBAR NAVIGATION */}
      {/* ==================================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1a130e] border-r border-stone-800/80 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-stone-950 shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-black tracking-wider text-sm text-stone-100 block">FIREDUP</span>
              <span className="text-[10px] tracking-widest text-amber-500 font-bold block uppercase">Owner Control Center</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-stone-900/90 border border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-700/40 text-amber-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-stone-200 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-medium text-amber-400/90 uppercase tracking-wider">
                  {currentUser.staffRole?.replace('_', ' ') || currentUser.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 text-xs">
          {(['EXECUTIVE', 'STAFF', 'ORDERS', 'ROASTERY', 'FINANCE', 'GOVERNANCE'] as const).map((category) => {
            const items = filteredNavModules.filter((m) => m.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <p className="px-3 text-[10px] font-bold tracking-wider text-stone-500 uppercase">{category}</p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                          isActive
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 shadow-sm'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-stone-400'}`} />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                        {item.badgeCount && item.badgeCount > 0 ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-600 text-stone-950">
                            {item.badgeCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Action Footer */}
        <div className="p-4 border-t border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
          <span>v2.6 Enterprise Roastery</span>
          <Link to="/" className="text-amber-500 hover:underline">
            Storefront
          </Link>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#140e0a]">
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-[#1a130e]/80 backdrop-blur-md border-b border-stone-800/80 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span>Control Center</span>
                <ChevronRight className="w-3 h-3 text-stone-600" />
                <span className="text-amber-400 font-medium capitalize">{activeTab.replace('-', ' ')}</span>
              </div>
              <h1 className="text-base font-serif font-bold text-stone-100 capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Global Sync Button */}
            <button
              onClick={() => {
                fetchMetrics();
                fetchFinanceSummary();
                fetchNotifications();
                fetchOrders();
              }}
              disabled={metricsLoading || financeLoading || ordersLoading}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors disabled:opacity-50"
              title="Sync Platform Data"
            >
              <RefreshCw className={`w-4 h-4 ${metricsLoading || financeLoading || ordersLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications Pill */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationsList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-stone-950 font-black text-[10px] flex items-center justify-center">
                  {notificationsList.length}
                </span>
              )}
            </button>

            {/* Invite Staff Shortcut (If permitted) */}
            {userHasPermission('staff.manage') && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Staff</span>
              </button>
            )}

            {/* Roastery Staff Floor Shortcut */}
            <Link
              to="/dashboard/staff"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-700/60 text-stone-300 hover:text-stone-100 text-xs font-semibold transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              <span>Roastery Floor</span>
            </Link>
          </div>
        </header>

        {/* Global Alert Notification Banner */}
        {notification && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-600/15 border border-amber-600/30 text-amber-200 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-amber-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body Container */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* ============================================================== */}
          {/* 1. OVERVIEW MODULE */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Collected Revenue</span>
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-serif font-black text-stone-100">
                    {formatCurrency(financeSummary?.cashflow.collectedRevenue || metrics?.orders.totalRevenue || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {metrics?.orders.total || 0} Total Orders ({metrics?.orders.retail || 0} Direct / {metrics?.orders.wholesale || 0} B2B)
                  </p>
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Wholesale Receivables</span>
                    <Building2 className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-serif font-black text-amber-400">
                    {formatCurrency(financeSummary?.cashflow.wholesaleReceivables || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Active Net 15 credit terms awaiting settlement
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Operating Expenses</span>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-serif font-black text-stone-100">
                    {formatCurrency(financeSummary?.cashflow.totalExpenses || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Green coffee, logistics, packaging & overhead
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Inventory Health</span>
                    <Boxes className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-serif font-black text-stone-100">
                    {metrics?.inventory.totalStockBags || 0}{' '}
                    <span className="text-xs font-sans text-stone-400">bags</span>
                  </p>
                  <p className="text-[11px] text-amber-400 mt-1 font-semibold">
                    {metrics?.inventory.lowStockProducts || 0} Low-Stock Alerts Requiring Roasting
                  </p>
                </div>
              </div>

              {/* Actionable Pipeline & Operational Queues */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Actions */}
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-stone-200 flex items-center justify-between">
                    <span>Critical Decision Queues</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-sans">
                      {pendingStaffCount + pendingCancellationCount + (metrics?.applications.pending || 0)} Pending
                    </span>
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setActiveTab('staff-approvals')}
                      className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800/80 hover:border-amber-600/40 flex items-center justify-between text-left transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center font-bold">
                          {pendingStaffCount}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-200">Staff Applications</p>
                          <p className="text-[11px] text-stone-400">Awaiting role & permission review</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </button>

                    <button
                      onClick={() => setActiveTab('cancellations')}
                      className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800/80 hover:border-amber-600/40 flex items-center justify-between text-left transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-950/60 text-red-400 flex items-center justify-center font-bold">
                          {pendingCancellationCount}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-200">Cancellation Requests</p>
                          <p className="text-[11px] text-stone-400">Customer requests on eligible orders</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </button>

                    <button
                      onClick={() => setActiveTab('wholesale-orders')}
                      className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800/80 hover:border-amber-600/40 flex items-center justify-between text-left transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center font-bold">
                          {metrics?.applications.pending || 0}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-200">Wholesale Partners</p>
                          <p className="text-[11px] text-stone-400">Commercial cafe applications</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </button>
                  </div>
                </div>

                {/* Fulfillment Velocity */}
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-stone-200 flex items-center justify-between">
                    <span>Fulfillment Pipeline</span>
                    <button
                      onClick={() => setActiveTab('fulfillment')}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      View Roastery Queue
                    </button>
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Received (New)', key: 'received', color: 'bg-amber-400' },
                      { label: 'Allocated to Green Beans', key: 'processing', color: 'bg-amber-500' },
                      { label: 'In Drum Roaster', key: 'roasting', color: 'bg-orange-500' },
                      { label: 'Packed & Sealed', key: 'packed', color: 'bg-emerald-500' },
                      { label: 'Dispatched with Courier', key: 'dispatched', color: 'bg-blue-500' },
                    ].map((st) => {
                      const count = metrics?.orders.byStatus?.[st.key] || 0;
                      return (
                        <div key={st.key} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-800/60 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                            <span className="text-stone-300">{st.label}</span>
                          </div>
                          <span className="font-bold text-stone-100">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Notifications Feed */}
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-stone-200 flex items-center justify-between">
                    <span>Recent Live Alerts</span>
                    <button onClick={() => setActiveTab('notifications')} className="text-xs text-amber-400 hover:underline">
                      See All
                    </button>
                  </h3>
                  <div className="space-y-2.5">
                    {notificationsList.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          const tabTarget = n.link.replace('/admin?tab=', '') as AdminTab;
                          setActiveTab(tabTarget);
                        }}
                        className="p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-700/50 cursor-pointer transition-all text-xs"
                      >
                        <p className="font-bold text-stone-200">{n.title}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{n.message}</p>
                      </div>
                    ))}
                    {notificationsList.length === 0 && (
                      <p className="text-xs text-stone-500 text-center py-6">All systems operational. No active alerts.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. STAFF APPROVALS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'staff-approvals' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Pending Staff Applications</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Review and authorize new roastery personnel before system access is granted.
                  </p>
                </div>
                <button
                  onClick={() => fetchStaffData()}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {staffLoading ? (
                <div className="p-12 text-center text-xs text-stone-500">Loading staff applications...</div>
              ) : staffApplications.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#1a130e] border border-stone-800 text-stone-400">
                  <UserCheck className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-200">No Pending Applications</p>
                  <p className="text-xs text-stone-500 mt-1">All roastery personnel onboarding requests have been reviewed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffApplications.map((app) => (
                    <div
                      key={app.id || app._id}
                      className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4 hover:border-amber-700/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-stone-100">{app.name}</h3>
                          <p className="text-xs text-stone-400">{app.email}</p>
                          <p className="text-xs text-stone-400">{app.phone}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800/40">
                          {app.staffDepartment || 'Roastery Floor'}
                        </span>
                      </div>

                      {app.staffApplicationNotes && (
                        <p className="text-xs p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 italic">
                          "{app.staffApplicationNotes}"
                        </p>
                      )}

                      <div className="pt-2 flex items-center gap-2 border-t border-stone-800/80">
                        <button
                          onClick={() => {
                            setStaffApprovalModal({ user: app, decision: 'approve' });
                            setStaffApprovalRole('roastery_staff');
                            setStaffApprovalReason('');
                          }}
                          className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Assign Role</span>
                        </button>
                        <button
                          onClick={() => {
                            setStaffApprovalModal({ user: app, decision: 'reject' });
                            setStaffApprovalReason('Qualifications do not match current roastery requirements.');
                          }}
                          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-red-950/60 text-red-400 border border-stone-800 hover:border-red-800 font-bold text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. STAFF DIRECTORY MODULE */}
          {/* ============================================================== */}
          {activeTab === 'staff-directory' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Roastery Staff Directory</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Manage active personnel accounts, granular role permissions, and access status.
                  </p>
                </div>
                {userHasPermission('staff.manage') && (
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Generate Single-Use Invitation</span>
                  </button>
                )}
              </div>

              {/* Directory Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff by name, email, or department..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={staffRoleFilter}
                    onChange={(e) => setStaffRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 text-xs focus:outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="owner">Owner / Super Admin</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="roastery_staff">Roastery Staff</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="wholesale_manager">Wholesale Manager</option>
                    <option value="marketing_manager">Marketing Manager</option>
                    <option value="analyst">Analyst / Viewer</option>
                  </select>

                  <select
                    value={staffStatusFilter}
                    onChange={(e) => setStaffStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 text-xs focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-[#1a130e]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-900/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role & Department</th>
                      <th className="py-3 px-4">Effective Permissions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {staffDirectory
                      .filter((s) => {
                        if (staffRoleFilter !== 'all' && (s.staffRole || s.role) !== staffRoleFilter) return false;
                        if (staffStatusFilter !== 'all' && (s.staffStatus || 'active') !== staffStatusFilter) return false;
                        if (!staffSearch.trim()) return true;
                        const q = staffSearch.toLowerCase();
                        return (
                          s.name.toLowerCase().includes(q) ||
                          s.email.toLowerCase().includes(q) ||
                          (s.staffDepartment && s.staffDepartment.toLowerCase().includes(q))
                        );
                      })
                      .map((staff) => {
                        const isPrimaryOwner = staff.role === 'admin' && staff.email === 'admin@firedupcoffee.com';
                        const status = staff.staffStatus || 'active';

                        return (
                          <tr key={staff.id || staff._id} className="hover:bg-stone-900/40 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-stone-100">{staff.name}</p>
                              <p className="text-stone-400 text-[11px]">{staff.email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-amber-400 capitalize block">
                                {staff.staffRole?.replace('_', ' ') || staff.role}
                              </span>
                              <span className="text-[10px] text-stone-500">{staff.staffDepartment || 'Operations'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300">
                                {staff.role === 'admin' || staff.staffRole === 'owner'
                                  ? 'All 22 Permissions (Full Access)'
                                  : `${staff.effectivePermissions?.length || 0} permissions granted`}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  status === 'active'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                    : status === 'suspended'
                                    ? 'bg-red-950/80 text-red-400 border border-red-800/40'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {userHasPermission('roles.manage') && (
                                  <button
                                    onClick={() => {
                                      setEditPermissionsModalUser(staff);
                                      const isTargetOwner = staff.role === 'admin' || staff.staffRole === 'owner';
                                      const roleVal = isTargetOwner ? 'owner' : (staff.staffRole || 'roastery_staff');
                                      setEditRoleValue(roleVal);
                                      if (isTargetOwner) {
                                        setEditPermissionsList(CANONICAL_PERMISSIONS.map((p) => p.id));
                                      } else {
                                        const rawPerms = Array.isArray(staff.permissions) && staff.permissions.length > 0
                                          ? staff.permissions
                                          : (ROLE_PRESETS[roleVal] || []);
                                        const normalized = rawPerms.map((p: string) => PERMISSION_ALIASES_MAP[p] || p);
                                        setEditPermissionsList(Array.from(new Set(normalized)));
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 text-[11px] font-bold"
                                  >
                                    Edit Role
                                  </button>
                                )}
                                {userHasPermission('staff.manage') && !isPrimaryOwner && (
                                  <button
                                    onClick={() =>
                                      handleToggleStaffStatus(staff.id || staff._id, status, staff.name)
                                    }
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                                      status === 'active'
                                        ? 'bg-stone-900 hover:bg-red-950/60 text-red-400 border-stone-800 hover:border-red-800'
                                        : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800/50'
                                    }`}
                                  >
                                    {status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. ROLES & PERMISSIONS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'roles-permissions' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <h2 className="text-lg font-serif font-bold text-stone-100">Role-Based Access Control Matrix</h2>
                <p className="text-xs text-stone-400 mt-1">
                  Reference definition of the 8 authoritative business roles and their baseline permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Owner / Super Admin',
                    role: 'owner',
                    desc: 'Full business governance, staff approvals, payments, finance, and settings.',
                    color: 'text-amber-400 border-amber-600/30',
                    perms: ['All 22 System Permissions'],
                  },
                  {
                    title: 'Store Manager',
                    role: 'store_manager',
                    desc: 'Retail orders, operations, fulfillment velocity, and inventory alerts.',
                    color: 'text-blue-400 border-blue-600/30',
                    perms: ['orders.read/update', 'fulfillment', 'cancellations.review', 'inventory.read', 'products.manage'],
                  },
                  {
                    title: 'Finance Manager',
                    role: 'finance_manager',
                    desc: 'Payment reconciliation, expense management, refund issuance, and financial audit.',
                    color: 'text-emerald-400 border-emerald-600/30',
                    perms: ['finance.read', 'finance.reconcile', 'expenses.manage', 'refunds.manage', 'reports.export'],
                  },
                  {
                    title: 'Roastery Staff',
                    role: 'roastery_staff',
                    desc: 'Roastery floor queue, drum batch tracking, bag packing, and inventory adjustments.',
                    color: 'text-orange-400 border-orange-600/30',
                    perms: ['orders.read', 'orders.fulfillment', 'inventory.read', 'inventory.update'],
                  },
                  {
                    title: 'Customer Support',
                    role: 'customer_support',
                    desc: 'Customer order lookup, return reviews, and cancellation processing.',
                    color: 'text-purple-400 border-purple-600/30',
                    perms: ['orders.read', 'cancellations.review', 'returns.review', 'refunds.read'],
                  },
                  {
                    title: 'Wholesale Manager',
                    role: 'wholesale_manager',
                    desc: 'Commercial cafe verification, volume tiers, bulk dispatch, and Net terms invoices.',
                    color: 'text-cyan-400 border-cyan-600/30',
                    perms: ['wholesale.manage', 'orders.read/update', 'fulfillment', 'reports.read'],
                  },
                  {
                    title: 'Marketing Manager',
                    role: 'marketing_manager',
                    desc: 'Storefront catalogue, promotions, coupon codes, and banner campaigns.',
                    color: 'text-pink-400 border-pink-600/30',
                    perms: ['products.manage', 'promotions.manage', 'categories.manage', 'content.manage'],
                  },
                  {
                    title: 'Analyst / Viewer',
                    role: 'analyst',
                    desc: 'Read-only business analytics, revenue trends, and audit log inspection.',
                    color: 'text-stone-300 border-stone-700',
                    perms: ['orders.read', 'reports.read', 'audit.read'],
                  },
                ].map((item) => (
                  <div key={item.role} className={`p-5 rounded-2xl bg-[#1a130e] border ${item.color} space-y-3`}>
                    <h3 className={`font-serif font-bold text-sm ${item.color}`}>{item.title}</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">{item.desc}</p>
                    <div className="pt-2 border-t border-stone-800/80">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Default Permissions:</p>
                      <ul className="text-[11px] text-stone-300 space-y-1">
                        {item.perms.map((p) => (
                          <li key={p} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. RETAIL ORDERS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'retail-orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Retail Direct Customer Orders</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Manage direct-to-consumer specialty roast shipments, pricing snapshots, and courier delivery.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportCsv('sales')}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Orders CSV</span>
                  </button>
                  <button
                    onClick={() => fetchOrders()}
                    className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Orders Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by order #, customer name, city..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 text-xs focus:outline-none"
                >
                  <option value="all">All Fulfillment Statuses</option>
                  <option value="received">Received</option>
                  <option value="processing">Processing</option>
                  <option value="roasting">Roasting</option>
                  <option value="packed">Packed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Retail Orders List */}
              <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-[#1a130e]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-900/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Order # & Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items / Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Fulfillment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {retailOrdersList
                      .filter((o) => {
                        if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                        if (!orderSearch.trim()) return true;
                        const q = orderSearch.toLowerCase();
                        return (
                          o.orderNumber.toLowerCase().includes(q) ||
                          (o.shippingAddress?.contactName && o.shippingAddress.contactName.toLowerCase().includes(q)) ||
                          (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q))
                        );
                      })
                      .map((order) => (
                        <tr key={order._id || order.id} className="hover:bg-stone-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-400 font-mono block">#{order.orderNumber}</span>
                            <span className="text-[10px] text-stone-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-stone-200">{order.shippingAddress?.contactName || 'Retail Customer'}</p>
                            <p className="text-[10px] text-stone-400">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-100">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-[10px] text-stone-500">{order.items?.length || 0} line items</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  : order.paymentStatus === 'refunded'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-800/40'
                                  : order.paymentStatus === 'refund_pending'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.orderStatus === 'delivered'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : order.orderStatus === 'dispatched'
                                  ? 'bg-blue-950 text-blue-400'
                                  : order.orderStatus === 'roasting'
                                  ? 'bg-orange-950 text-orange-400'
                                  : order.orderStatus === 'cancelled'
                                  ? 'bg-red-950 text-red-400'
                                  : 'bg-stone-800 text-stone-300'
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInspectingOrder(order)}
                                className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-[11px] font-bold"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => {
                                  setTrackingModalOrder(order);
                                  setTrackingForm({
                                    courierName: order.courierName || 'BlueDart Express',
                                    trackingNumber: order.trackingNumber || '',
                                    trackingUrl: order.trackingUrl || '',
                                    estimatedDeliveryDate: order.estimatedDeliveryDate
                                      ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0]
                                      : '',
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-600/30 text-[11px] font-bold"
                              >
                                Tracking
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. WHOLESALE ORDERS & PARTNERS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'wholesale-orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Wholesale Commercial B2B Hub</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Manage commercial partners, volume discount tiers, 5kg minimum orders, and Net 15 invoices.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl bg-stone-900 p-1 border border-stone-800">
                    <button
                      onClick={() => setWholesaleSubTab('orders')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        wholesaleSubTab === 'orders'
                          ? 'bg-amber-600 text-stone-950'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Commercial Orders ({wholesaleOrdersList.length})
                    </button>
                    <button
                      onClick={() => setWholesaleSubTab('applications')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        wholesaleSubTab === 'applications'
                          ? 'bg-amber-600 text-stone-950'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Partner Applications ({(allUsers || []).filter((u) => u.role === 'wholesale' && (!u.wholesaleDetails?.status || u.wholesaleDetails?.status === 'pending')).length})
                    </button>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 text-xs font-bold hidden sm:inline-block">
                    Receivables: {formatCurrency(financeSummary?.cashflow.wholesaleReceivables || 0)}
                  </span>
                </div>
              </div>

              {wholesaleSubTab === 'orders' ? (
                /* Wholesale Orders List */
                <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-[#1a130e]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                      <tr>
                        <th className="py-3 px-4">Order # & Date</th>
                        <th className="py-3 px-4">Cafe / Partner</th>
                        <th className="py-3 px-4">Volume (kg)</th>
                        <th className="py-3 px-4">Order Total</th>
                        <th className="py-3 px-4">Payment Terms</th>
                        <th className="py-3 px-4">Fulfillment</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {wholesaleOrdersList.map((order) => (
                        <tr key={order._id || order.id} className="hover:bg-stone-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-400 font-mono block">#{order.orderNumber}</span>
                            <span className="text-[10px] text-stone-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-200">
                              {order.shippingAddress?.businessName || order.shippingAddress?.contactName || 'Commercial Partner'}
                            </p>
                            <p className="text-[10px] text-stone-500">{order.shippingAddress?.city}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-stone-200 font-semibold">{order.totalKg || 0} kg</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-100">{formatCurrency(order.totalAmount)}</p>
                            {order.discountAmount > 0 && (
                              <p className="text-[10px] text-emerald-400 font-semibold">
                                Tier Discount: -{formatCurrency(order.discountAmount)}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : order.paymentStatus === 'terms_approved'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              {order.paymentStatus === 'terms_approved' ? 'Net 15 Approved' : order.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-stone-900 text-stone-300 border border-stone-800 text-[10px] font-bold uppercase">
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInspectingOrder(order)}
                                className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-[11px] font-bold"
                              >
                                Invoice & Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {wholesaleOrdersList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-stone-500">
                            No wholesale commercial orders recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Partner Applications */
                <div className="space-y-4">
                  {/* Filters & Search */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#1a130e] border border-stone-800">
                    <div className="flex items-center gap-2">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setAppFilter(status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                            appFilter === status
                              ? 'bg-amber-600 text-stone-950'
                              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="relative min-w-[220px]">
                      <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        placeholder="Search partners, GSTIN..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Applications Cards/Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(allUsers || [])
                      .filter((u) => {
                        if (u.role !== 'wholesale') return false;
                        const status = u.wholesaleDetails?.status || 'pending';
                        if (appFilter !== 'all' && status !== appFilter) return false;
                        if (appSearch) {
                          const q = appSearch.toLowerCase();
                          const bName = u.wholesaleDetails?.businessName?.toLowerCase() || '';
                          const uName = u.name?.toLowerCase() || '';
                          const email = u.email?.toLowerCase() || '';
                          return bName.includes(q) || uName.includes(q) || email.includes(q);
                        }
                        return true;
                      })
                      .map((user) => {
                        const details = user.wholesaleDetails;
                        const status = details?.status || 'pending';

                        return (
                          <div
                            key={user.id}
                            className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-serif font-bold text-sm text-stone-100">
                                  {details?.businessName || user.name}
                                </h3>
                                <p className="text-xs text-stone-400">{user.email}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  status === 'approved'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                    : status === 'rejected'
                                    ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                                    : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                }`}
                              >
                                {status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400 bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80">
                              <div>
                                <span className="text-[10px] text-stone-500 block">GSTIN / Tax ID</span>
                                <span className="font-mono text-stone-200">{details?.taxId || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-500 block">Est. Monthly Volume</span>
                                <span className="text-stone-200 font-semibold">{details?.monthlyVolumeKg ? `${details.monthlyVolumeKg} kg` : 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setInspectingUser(user)}
                                className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800"
                              >
                                Dossier
                              </button>
                              {userHasPermission('wholesale.manage') && status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveWholesale(user.id)}
                                  className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
                                >
                                  Approve
                                </button>
                              )}
                              {userHasPermission('wholesale.manage') && status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => setRejectingUser({ id: user.id, name: details?.businessName || user.name })}
                                  className="flex-1 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800/60"
                                >
                                  Decline
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 7. CANCELLATIONS & RETURNS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'cancellations' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Cancellations, Returns & Refunds</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Review and authorize customer requests with authoritative stock restoration and refund controls.
                  </p>
                </div>
                <button
                  onClick={() => fetchOrders()}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Queue</span>
                </button>
              </div>

              {cancellationRequestsList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#1a130e] border border-stone-800 text-stone-400">
                  <CheckCircle className="w-10 h-10 text-emerald-500/60 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-200">No Pending Requests</p>
                  <p className="text-xs text-stone-500 mt-1">No orders currently have pending cancellation or return requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cancellationRequestsList.map((order) => {
                    const isCancellation = order.cancellationStatus === 'requested';
                    const isReturn = order.returnStatus === 'requested';

                    return (
                      <div
                        key={order._id || order.id}
                        className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 hover:border-amber-700/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-amber-400">#{order.orderNumber}</span>
                            <span className="text-xs text-stone-400">({order.orderType})</span>
                            {isCancellation && (
                              <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/40 text-[10px] font-bold uppercase">
                                Cancellation Requested
                              </span>
                            )}
                            {isReturn && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800/40 text-[10px] font-bold uppercase">
                                Return Requested
                              </span>
                            )}
                            {order.cancellationStatus === 'approved' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold uppercase">
                                Cancelled (Refund Pending)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-300">
                            Customer: <span className="font-semibold">{order.shippingAddress?.contactName}</span> — Total:{' '}
                            <span className="font-bold text-stone-100">{formatCurrency(order.totalAmount)}</span>
                          </p>
                          {(order.cancellationReason || order.returnReason) && (
                            <p className="text-xs text-amber-200/80 italic">
                              Reason: "{order.cancellationReason || order.returnReason}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCancellation && (
                            <>
                              <button
                                onClick={() =>
                                  setCancellationModal({
                                    order,
                                    decision: 'approve',
                                  })
                                }
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs transition-colors"
                              >
                                Approve Cancellation
                              </button>
                              <button
                                onClick={() =>
                                  setCancellationModal({
                                    order,
                                    decision: 'reject',
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-red-950/60 text-red-400 border border-stone-800 font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isReturn && (
                            <>
                              <button
                                onClick={() =>
                                  setReturnModal({
                                    order,
                                    decision: 'approve',
                                  })
                                }
                                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                              >
                                Approve Return
                              </button>
                              <button
                                onClick={() =>
                                  setReturnModal({
                                    order,
                                    decision: 'reject',
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-red-950/60 text-red-400 border border-stone-800 font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {order.paymentStatus === 'refund_pending' && userHasPermission('refunds.manage') && (
                            <button
                              onClick={() => {
                                setRefundModalOrder(order);
                                setRefundFormAmount(order.totalAmount);
                                setRefundFormReason(order.cancellationReason || 'Order cancellation refund');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors shadow-sm"
                            >
                              Process Refund (₹{order.totalAmount})
                            </button>
                          )}

                          <button
                            onClick={() => setInspectingOrder(order)}
                            className="p-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 8. FULFILLMENT & TRACKING MODULE */}
          {/* ============================================================== */}
          {activeTab === 'fulfillment' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Roastery Fulfillment & Courier Logistics</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Manage the live order pipeline: green bean allocation, drum roasting, bag degassing, and AWB dispatch.
                  </p>
                </div>
                <Link
                  to="/dashboard/staff"
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Open Dedicated Floor Terminal</span>
                </Link>
              </div>

              {/* Orders in Fulfillment */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminOrders
                  .filter((o) => ['received', 'processing', 'roasting', 'packed', 'dispatched'].includes(o.orderStatus))
                  .map((order) => (
                    <div
                      key={order._id || order.id}
                      className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4 hover:border-amber-700/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400 text-sm">#{order.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-bold uppercase text-stone-300">
                          {order.orderStatus}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-stone-200">{order.shippingAddress?.contactName}</p>
                        <p className="text-[11px] text-stone-400">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          {order.items?.length || 0} roasts ({order.totalKg || 0} kg) — Total: {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      {order.trackingNumber && (
                        <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
                          <p className="text-[10px] font-bold text-stone-500 uppercase">Courier Dispatch:</p>
                          <p className="font-semibold text-amber-400">{order.courierName}: {order.trackingNumber}</p>
                        </div>
                      )}

                      <div className="pt-2 flex items-center gap-2 border-t border-stone-800/80">
                        <button
                          onClick={() => {
                            setTrackingModalOrder(order);
                            setTrackingForm({
                              courierName: order.courierName || 'BlueDart Express',
                              trackingNumber: order.trackingNumber || '',
                              trackingUrl: order.trackingUrl || '',
                              estimatedDeliveryDate: order.estimatedDeliveryDate
                                ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0]
                                : '',
                            });
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 font-bold text-xs transition-colors"
                        >
                          Update Tracking
                        </button>
                        <button
                          onClick={() => setInspectingOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white border border-stone-800 text-xs font-bold"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 9–14. SHOP MAINTENANCE EMBEDDED MODULES */}
          {/* Products, Inventory, Pricing, Promotions, Categories, Content */}
          {/* ============================================================== */}
          {(activeTab === 'products' ||
            activeTab === 'inventory' ||
            activeTab === 'pricing' ||
            activeTab === 'promotions' ||
            activeTab === 'categories' ||
            activeTab === 'storefront-content') && (
            <div className="space-y-6">
              <ShopMaintenanceSection
                onNotify={(msg) => {
                  setNotification(msg);
                  setTimeout(() => setNotification(null), 4000);
                }}
                controlledTab={
                  activeTab === 'products'
                    ? 'products'
                    : activeTab === 'inventory'
                    ? 'inventory'
                    : activeTab === 'pricing'
                    ? 'pricing'
                    : activeTab === 'promotions'
                    ? 'promotions'
                    : activeTab === 'categories'
                    ? 'categories'
                    : 'content'
                }
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 15. FINANCE & PAYMENTS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Financial Intelligence & Reconciliation</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Authoritative financial ledger: gross sales, tax collections, confirmed refunds, and operating cash.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('sales')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Financial Ledger</span>
                </button>
              </div>

              {/* Financial Summary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Gross Sales</span>
                  <p className="text-2xl font-serif font-bold text-stone-100">
                    {formatCurrency(financeSummary?.sales.totalGrossSales || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Retail: {formatCurrency(financeSummary?.sales.grossRetailSales || 0)} | B2B:{' '}
                    {formatCurrency(financeSummary?.sales.grossWholesaleSales || 0)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Collected Cash</span>
                  <p className="text-2xl font-serif font-bold text-emerald-400">
                    {formatCurrency(financeSummary?.cashflow.collectedRevenue || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400">Confirmed settlement via card, UPI, bank</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Net 15 Receivables</span>
                  <p className="text-2xl font-serif font-bold text-amber-400">
                    {formatCurrency(financeSummary?.cashflow.wholesaleReceivables || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400">Commercial cafe invoices pending remittance</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Confirmed Refunds</span>
                  <p className="text-2xl font-serif font-bold text-purple-400">
                    {formatCurrency(financeSummary?.cashflow.refundedAmount || 0)}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Pending Refund Claims: {formatCurrency(financeSummary?.cashflow.refundPendingAmount || 0)}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Deductions & Net Revenue */}
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-stone-200">Reconciliation Breakdown</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">Gross Total Bookings</span>
                      <span className="font-bold text-stone-200">{formatCurrency(financeSummary?.sales.totalGrossSales || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">Discounts & Promos Applied</span>
                      <span className="font-bold text-red-400">-{formatCurrency(financeSummary?.sales.totalDiscounts || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">Confirmed Customer Refunds</span>
                      <span className="font-bold text-red-400">-{formatCurrency(financeSummary?.cashflow.refundedAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">GST Collected (5% Coffee Tax)</span>
                      <span className="font-bold text-stone-200">{formatCurrency(financeSummary?.sales.totalTaxCollected || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-bold border-t border-amber-600/40">
                      <span className="text-amber-400">Net Authoritative Sales</span>
                      <span className="text-stone-100">{formatCurrency(financeSummary?.sales.netSales || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Cashflow & Operating Expenses */}
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-stone-200">Operating Cash Balance</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">Collected Cash Revenue</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(financeSummary?.cashflow.collectedRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">Recorded Roastery Expenditures</span>
                      <span className="font-bold text-red-400">-{formatCurrency(financeSummary?.cashflow.totalExpenses || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-800/80">
                      <span className="text-stone-400">Refunds Disbursed</span>
                      <span className="font-bold text-red-400">-{formatCurrency(financeSummary?.cashflow.refundedAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-bold border-t border-amber-600/40">
                      <span className="text-amber-400">Net Roastery Operating Cash</span>
                      <span className={`font-bold ${((financeSummary?.cashflow.netOperatingCash || 0) >= 0) ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(financeSummary?.cashflow.netOperatingCash || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 16. EXPENSES & COSTS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Roastery Expenditures & Cost Management</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Record green bean procurement, packaging materials, roasting utilities, and logistics costs.
                  </p>
                </div>
                {userHasPermission('expenses.manage') && (
                  <button
                    onClick={() => setIsRecordExpenseModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Expense</span>
                  </button>
                )}
              </div>

              {/* Expense Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div className="flex items-center gap-2">
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="green_coffee">Green Coffee</option>
                    <option value="packaging">Packaging</option>
                    <option value="roastery_utilities">Utilities</option>
                    <option value="logistics">Logistics</option>
                    <option value="marketing">Marketing</option>
                    <option value="equipment_maintenance">Equipment</option>
                    <option value="payroll">Payroll</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Search expenses, vendors..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Expense Table */}
              <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-[#1a130e]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-900/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {expensesLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-stone-500">
                          Loading expenses...
                        </td>
                      </tr>
                    ) : (
                      expenses
                        .filter((exp) => {
                          if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
                          if (expenseSearch) {
                            const q = expenseSearch.toLowerCase();
                            const desc = exp.description?.toLowerCase() || '';
                            const vend = exp.vendor?.toLowerCase() || '';
                            const inv = exp.invoiceNumber?.toLowerCase() || '';
                            return desc.includes(q) || vend.includes(q) || inv.includes(q);
                          }
                          return true;
                        })
                        .map((exp) => (
                          <tr key={exp._id || exp.id} className="hover:bg-stone-900/40 transition-colors">
                            <td className="py-3 px-4 text-stone-400">
                              {new Date(exp.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-bold uppercase text-amber-400">
                                {exp.category?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-stone-200">{exp.description}</td>
                            <td className="py-3 px-4 text-stone-400">{exp.vendor || 'N/A'}</td>
                            <td className="py-3 px-4 text-stone-400 uppercase text-[10px]">{exp.paymentMethod}</td>
                            <td className="py-3 px-4 font-bold text-stone-100">{formatCurrency(exp.amount)}</td>
                            <td className="py-3 px-4 text-right">
                              {userHasPermission('expenses.manage') && (
                                <button
                                  onClick={() => handleDeleteExpense(exp._id || exp.id)}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                    {!expensesLoading && expenses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-stone-500">
                          No operational expenses recorded yet. Click "Record Expense" to add entries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 17. REPORTS & ANALYTICS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Business Intelligence & Export Center</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Export verified audit reports, analyze sales velocities, and monitor product demand.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {analyticsLoading && <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
                  <select
                    value={analyticsDays}
                    onChange={(e) => setAnalyticsDays(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 text-xs focus:outline-none"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="365">Last 365 Days</option>
                  </select>
                  <button
                    onClick={() => handleExportCsv('sales')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Sales CSV</span>
                  </button>
                </div>
              </div>

              {/* Quick Export Hub */}
              <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-3">
                <h3 className="text-xs font-serif font-bold text-stone-300 uppercase tracking-wider">
                  Operational CSV Export Suite
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Sales & Invoices', type: 'sales' },
                    { label: 'Warehouse Stockroom', type: 'inventory' },
                    { label: 'Expenditures', type: 'expenses' },
                    { label: 'Cancellations', type: 'cancellations' },
                  ].map((exp) => (
                    <button
                      key={exp.type}
                      onClick={() => handleExportCsv(exp.type)}
                      disabled={isExportingCsv}
                      className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/40 text-stone-200 text-xs font-semibold flex items-center justify-between transition-all"
                    >
                      <span>{exp.label}</span>
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Selling Coffees */}
              {analyticsData?.topProducts && (
                <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-stone-200">
                    Top Specialty Coffees by Revenue ({analyticsDays} Days)
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.topProducts.map((p: any, idx: number) => (
                      <div key={p.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-200">
                            #{idx + 1} {p.name}
                          </span>
                          <span className="font-bold text-stone-100">{formatCurrency(p.revenue)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (p.revenue / (analyticsData.topProducts[0]?.revenue || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-stone-500">
                          {p.quantity} bags sold (~{Math.round(p.totalKg || 0)} kg roasted)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 18. AUDIT LOGS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'audit-logs' && (
            <div className="space-y-6">
              <ShopMaintenanceSection
                onNotify={(msg) => {
                  setNotification(msg);
                  setTimeout(() => setNotification(null), 4000);
                }}
                controlledTab="history"
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 19. NOTIFICATIONS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100">Live Roastery Operational Alerts</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    System notifications generated in real-time from active applications, requests, and inventory states.
                  </p>
                </div>
                <button
                  onClick={() => fetchNotifications()}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Alerts</span>
                </button>
              </div>

              {notificationsList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#1a130e] border border-stone-800 text-stone-400">
                  <CheckCircle className="w-10 h-10 text-emerald-500/60 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-200">No Active Alerts</p>
                  <p className="text-xs text-stone-500 mt-1">All roastery systems, applications, and stock levels are in nominal state.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800 hover:border-amber-700/50 transition-all flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === 'urgent'
                              ? 'bg-red-950 text-red-400 border border-red-800/40'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-100">{item.title}</p>
                          <p className="text-xs text-stone-300 mt-0.5">{item.message}</p>
                          <p className="text-[10px] text-stone-500 mt-1.5">
                            {new Date(item.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const tabTarget = item.link.replace('/admin?tab=', '') as AdminTab;
                          setActiveTab(tabTarget);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 text-xs font-bold shrink-0"
                      >
                        Action
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 20. BUSINESS SETTINGS MODULE */}
          {/* ============================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#1a130e] border border-stone-800">
                <h2 className="text-lg font-serif font-bold text-stone-100">Roastery Business Configuration</h2>
                <p className="text-xs text-stone-400 mt-1">
                  Configure corporate GSTIN, roastery facility address, shipping thresholds, and order prefixes.
                </p>
                {settingsData && (
                  <span className="text-[11px] font-mono text-amber-500 block mt-1">
                    Active Entity: {settingsData.businessName} (GSTIN: {settingsData.gstin})
                  </span>
                )}
              </div>

              {settingsLoading ? (
                <div className="p-12 text-center text-xs text-stone-500">Loading business configuration...</div>
              ) : (
                <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#1a130e] border border-stone-800 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Business Entity Name</label>
                      <input
                        type="text"
                        value={settingsForm.businessName || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, businessName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Corporate GSTIN</label>
                      <input
                        type="text"
                        value={settingsForm.gstin || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Contact Email</label>
                      <input
                        type="email"
                        value={settingsForm.contactEmail || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Contact Phone</label>
                      <input
                        type="text"
                        value={settingsForm.contactPhone || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Free Delivery Threshold (₹)</label>
                      <input
                        type="number"
                        value={settingsForm.freeShippingThreshold ?? 999}
                        onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Standard Shipping Fee (₹)</label>
                      <input
                        type="number"
                        value={settingsForm.standardShippingFee ?? 99}
                        onChange={(e) => setSettingsForm({ ...settingsForm, standardShippingFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Wholesale Minimum Order (kg)</label>
                      <input
                        type="number"
                        value={settingsForm.wholesaleMoqKg ?? 5}
                        onChange={(e) => setSettingsForm({ ...settingsForm, wholesaleMoqKg: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1 font-semibold">Roaster Capacity (kg/day)</label>
                      <input
                        type="number"
                        value={settingsForm.roasteryCapacityKgPerDay ?? 250}
                        onChange={(e) => setSettingsForm({ ...settingsForm, roasteryCapacityKgPerDay: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {userHasPermission('settings.manage') && (
                    <div className="pt-4 border-t border-stone-800 flex justify-end">
                      <button
                        type="submit"
                        disabled={settingsSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                      >
                        {settingsSubmitting ? 'Saving Settings...' : 'Save Configuration'}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODALS: CANCELLATION, RETURNS, REFUNDS, TRACKING, STAFF, INVITATIONS */}
      {/* ==================================================================== */}

      {/* Staff Approval Modal */}
      {staffApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">
              {staffApprovalModal.decision === 'approve' ? 'Approve Staff Application' : 'Decline Staff Application'}
            </h3>
            <p className="text-xs text-stone-400">
              Applicant: <span className="font-bold text-stone-200">{staffApprovalModal.user.name}</span> ({staffApprovalModal.user.email})
            </p>

            {staffApprovalModal.decision === 'approve' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Assign Role</label>
                  <select
                    value={staffApprovalRole}
                    onChange={(e) => setStaffApprovalRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  >
                    <option value="roastery_staff">Roastery Staff (Fulfillment & Roasting)</option>
                    <option value="store_manager">Store Manager (Operations & Orders)</option>
                    <option value="finance_manager">Finance Manager (Reconciliation & Refunds)</option>
                    <option value="customer_support">Customer Support (Returns & Enquiries)</option>
                    <option value="wholesale_manager">Wholesale Manager (B2B Accounts)</option>
                    <option value="marketing_manager">Marketing Manager (Content & Promos)</option>
                    <option value="analyst">Analyst / Viewer (Reports & Audit)</option>
                    {isOwner && <option value="owner">Owner / Super Admin (Full Governance)</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Approval Reason / Notes</label>
                  <input
                    type="text"
                    value={staffApprovalReason}
                    onChange={(e) => setStaffApprovalReason(e.target.value)}
                    placeholder="e.g. Roastery lead barista onboarding"
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={staffApprovalReason}
                    onChange={(e) => setStaffApprovalReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
              <button
                onClick={() => setStaffApprovalModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDecideStaffApp}
                disabled={isSubmittingStaffDecision}
                className={`px-4 py-2 rounded-xl text-stone-950 font-bold text-xs shadow-md transition-colors ${
                  staffApprovalModal.decision === 'approve' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {isSubmittingStaffDecision ? 'Processing...' : `Confirm ${staffApprovalModal.decision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Invitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">Generate Staff Invitation Token</h3>
            <p className="text-xs text-stone-400">
              Create a cryptographically secure, single-use invitation token with pre-assigned role privileges.
            </p>

            {inviteResult ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 space-y-3">
                <p className="text-xs font-bold text-amber-300">Invitation Ready:</p>
                <div className="p-3 rounded-xl bg-stone-950 font-mono text-sm text-amber-400 select-all break-all border border-amber-800/40">
                  {inviteResult.token}
                </div>
                <p className="text-[11px] text-stone-400">
                  Role: <span className="font-semibold text-stone-200">{inviteResult.role}</span> | Expires in 7 days
                </p>
                <button
                  onClick={() => {
                    setInviteModalOpen(false);
                    setInviteResult(null);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-600 text-stone-950 font-bold text-xs hover:bg-amber-500"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Assigned Staff Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  >
                    <option value="roastery_staff">Roastery Staff</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="wholesale_manager">Wholesale Manager</option>
                    <option value="marketing_manager">Marketing Manager</option>
                    <option value="analyst">Analyst / Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Restricted Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="staff@example.com (Leave blank for open token)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInvite}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md"
                  >
                    {isSubmittingInvite ? 'Generating...' : 'Create Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isRecordExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">Record Operational Expense</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                >
                  <option value="green_coffee">Green Coffee Sourcing</option>
                  <option value="packaging">Packaging Materials</option>
                  <option value="roastery_utilities">Roastery Gas & Utilities</option>
                  <option value="logistics">Courier & Freight Logistics</option>
                  <option value="equipment_maintenance">Roaster Maintenance & Parts</option>
                  <option value="marketing">Brand Marketing & Samples</option>
                  <option value="payroll">Roastery Payroll</option>
                  <option value="other">Other Overhead</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 50kg Washed Arabica microlot bag"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="credit_card">Corporate Credit Card</option>
                    <option value="upi">UPI / Instant</option>
                    <option value="cash">Petty Cash</option>
                    <option value="net_terms">Vendor Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Vendor / Estate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Silver Oak Estate"
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsRecordExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md"
                >
                  {isSubmittingExpense ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Decision Modal */}
      {cancellationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">
              {cancellationModal.decision === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}
            </h3>
            <p className="text-xs text-stone-400">
              Order <span className="font-mono font-bold text-amber-400">#{cancellationModal.order.orderNumber}</span> —{' '}
              {formatCurrency(cancellationModal.order.totalAmount)}
            </p>
            {cancellationModal.decision === 'approve' && (
              <p className="text-xs p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                Approving this cancellation will automatically restore allocated items to stockAvailable and transition payment to "refund_pending".
              </p>
            )}
            <div>
              <label className="block text-xs text-stone-400 mb-1 font-semibold">Decision Reason / Audit Note</label>
              <textarea
                rows={3}
                value={cancellationDecisionReason}
                onChange={(e) => setCancellationDecisionReason(e.target.value)}
                placeholder="Reason recorded in customer history and audit log..."
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none resize-none"
              />
            </div>
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
              <button
                onClick={() => setCancellationModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDecideCancellation}
                disabled={isDecidingCancellation}
                className={`px-4 py-2 rounded-xl text-stone-950 font-bold text-xs shadow-md ${
                  cancellationModal.decision === 'approve' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {isDecidingCancellation ? 'Processing...' : `Confirm ${cancellationModal.decision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Decision Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">
              {returnModal.decision === 'approve' ? 'Approve Customer Return' : 'Reject Customer Return'}
            </h3>
            <p className="text-xs text-stone-400">
              Order <span className="font-mono font-bold text-amber-400">#{returnModal.order.orderNumber}</span> —{' '}
              {formatCurrency(returnModal.order.totalAmount)}
            </p>
            {returnModal.decision === 'approve' && (
              <label className="flex items-center gap-2 text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={returnRestoreInventory}
                  onChange={(e) => setReturnRestoreInventory(e.target.checked)}
                  className="rounded bg-stone-900 border-stone-700 text-amber-600"
                />
                <span>Restore returned items to warehouse inventory</span>
              </label>
            )}
            <div>
              <label className="block text-xs text-stone-400 mb-1 font-semibold">Decision Reason</label>
              <textarea
                rows={3}
                value={returnDecisionReason}
                onChange={(e) => setReturnDecisionReason(e.target.value)}
                placeholder="Reason recorded in customer history..."
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none resize-none"
              />
            </div>
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
              <button
                onClick={() => setReturnModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDecideReturn}
                disabled={isDecidingReturn}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
              >
                {isDecidingReturn ? 'Processing...' : `Confirm ${returnModal.decision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">Disburse Order Refund</h3>
            <p className="text-xs text-stone-400">
              Order <span className="font-mono font-bold text-amber-400">#{refundModalOrder.orderNumber}</span> —{' '}
              Total: {formatCurrency(refundModalOrder.totalAmount)}
            </p>
            <form onSubmit={handleProcessRefund} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Refund Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  max={refundModalOrder.totalAmount}
                  value={refundFormAmount}
                  onChange={(e) => setRefundFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Refund Reason</label>
                <input
                  type="text"
                  value={refundFormReason}
                  onChange={(e) => setRefundFormReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  required
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md"
                >
                  {isSubmittingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-100">Update Courier Tracking</h3>
            <p className="text-xs text-stone-400">
              Order <span className="font-mono font-bold text-amber-400">#{trackingModalOrder.orderNumber}</span>
            </p>
            <form onSubmit={handleUpdateTracking} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Courier / Express Partner</label>
                <input
                  type="text"
                  value={trackingForm.courierName}
                  onChange={(e) => setTrackingForm({ ...trackingForm, courierName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Tracking / AWB Number</label>
                <input
                  type="text"
                  placeholder="e.g. BLU-982174"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Direct Tracking URL</label>
                <input
                  type="url"
                  placeholder="https://track.bluedart.com/awb=..."
                  value={trackingForm.trackingUrl}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={trackingForm.estimatedDeliveryDate}
                  onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTracking}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md"
                >
                  {isSubmittingTracking ? 'Saving...' : 'Save Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Order Drawer / Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-2xl w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <span className="font-mono font-bold text-amber-400 text-base">#{inspectingOrder.orderNumber}</span>
                <p className="text-xs text-stone-400 mt-0.5">
                  Placed on {new Date(inspectingOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-300 uppercase tracking-wider">Order Line Items:</p>
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-xs">
                {inspectingOrder.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-stone-800/60 last:border-0">
                    <div>
                      <p className="font-semibold text-stone-200">{it.productName}</p>
                      <p className="text-[10px] text-stone-400">
                        {it.size} | {it.grind} | Qty: {it.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-stone-100">{formatCurrency(it.lineTotal)}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-bold text-sm border-t border-stone-800">
                  <span className="text-amber-400">Total Amount:</span>
                  <span className="text-stone-100">{formatCurrency(inspectingOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-1 text-xs">
              <p className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Shipping Destination:</p>
              <p className="text-stone-200 font-semibold">{inspectingOrder.shippingAddress?.contactName}</p>
              <p className="text-stone-400">
                {inspectingOrder.shippingAddress?.street}, {inspectingOrder.shippingAddress?.city},{' '}
                {inspectingOrder.shippingAddress?.state} {inspectingOrder.shippingAddress?.postalCode}
              </p>
              <p className="text-stone-400">Phone: {inspectingOrder.shippingAddress?.phone}</p>
            </div>

            {/* Status History */}
            {Array.isArray(inspectingOrder.statusHistory) && inspectingOrder.statusHistory.length > 0 && (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Fulfillment Timeline:</p>
                <div className="space-y-1.5 pl-2 border-l border-amber-600/40">
                  {inspectingOrder.statusHistory.map((h: any, idx: number) => (
                    <div key={idx} className="relative pl-3">
                      <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-amber-500" />
                      <p className="text-stone-200 font-semibold">
                        {h.status?.toUpperCase()} — <span className="text-[10px] text-stone-400">{h.updatedBy || 'System'}</span>
                      </p>
                      {h.note && <p className="text-[11px] text-stone-400 italic">{h.note}</p>}
                      <p className="text-[10px] text-stone-500">
                        {new Date(h.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wholesale Decline Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-md w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Decline Application
              </h3>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Decline wholesale application for <strong className="text-amber-400">{rejectingUser.name}</strong>. Please record the official operational reason:
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-stone-400 font-semibold block">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectWholesale}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wholesale Dossier / Inspecting User Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-100">
                  {inspectingUser.wholesaleDetails?.businessName || inspectingUser.name}
                </h3>
                <p className="text-xs text-stone-400">Wholesale Commercial Partner Dossier</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Contact Name</span>
                <span className="font-semibold text-stone-200">{inspectingUser.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Email</span>
                <span className="font-semibold text-stone-200 break-all">{inspectingUser.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Phone</span>
                <span className="font-semibold text-stone-200">{inspectingUser.phone || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">GSTIN / Tax ID</span>
                <span className="font-mono font-semibold text-amber-400">{inspectingUser.wholesaleDetails?.taxId || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80 col-span-2">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Commercial Address</span>
                <span className="font-semibold text-stone-200">
                  {inspectingUser.wholesaleDetails?.deliveryAddress ? `${inspectingUser.wholesaleDetails.deliveryAddress.street}, ${inspectingUser.wholesaleDetails.deliveryAddress.city}` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Estimated Monthly Vol</span>
                <span className="font-semibold text-stone-200">{inspectingUser.wholesaleDetails?.monthlyVolumeKg ? `${inspectingUser.wholesaleDetails.monthlyVolumeKg} kg/mo` : 'Not specified'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Approval Status</span>
                <span className="font-bold uppercase text-[10px] text-amber-400">{inspectingUser.wholesaleDetails?.status || 'pending'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Role & Granular Permissions Modal */}
      {editPermissionsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-[#1a130e] border border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Edit Role & Granular Permissions
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Staff member: <span className="font-bold text-stone-200">{editPermissionsModalUser.name}</span> ({editPermissionsModalUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditPermissionsModalUser(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffRolePermissions} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 font-semibold mb-1">Staff Role</label>
                <select
                  value={editRoleValue}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditRoleValue(newRole);
                    if (newRole === 'owner') {
                      setEditPermissionsList(CANONICAL_PERMISSIONS.map((p) => p.id));
                    } else if (ROLE_PRESETS[newRole]) {
                      setEditPermissionsList(ROLE_PRESETS[newRole]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="owner">Owner / Super Admin</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="roastery_staff">Roastery & Inventory Staff</option>
                  <option value="customer_support">Customer Support</option>
                  <option value="wholesale_manager">Wholesale Manager</option>
                  <option value="marketing_manager">Marketing Manager</option>
                  <option value="analyst">Analyst / Viewer</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-stone-400 font-semibold">
                    Granular Permissions ({editPermissionsList.length} of {CANONICAL_PERMISSIONS.length} assigned)
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditPermissionsList(CANONICAL_PERMISSIONS.map((p) => p.id))}
                      className="text-amber-400 hover:underline"
                    >
                      All
                    </button>
                    <span className="text-stone-600">·</span>
                    <button
                      type="button"
                      onClick={() => setEditPermissionsList([])}
                      className="text-stone-400 hover:underline"
                    >
                      None
                    </button>
                    {ROLE_PRESETS[editRoleValue] && (
                      <>
                        <span className="text-stone-600">·</span>
                        <button
                          type="button"
                          onClick={() => setEditPermissionsList(ROLE_PRESETS[editRoleValue])}
                          className="text-amber-500 hover:underline"
                        >
                          Defaults
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 rounded-xl bg-stone-900/60 border border-stone-800">
                  {CANONICAL_PERMISSIONS.map((perm) => {
                    const isChecked = editPermissionsList.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditPermissionsList([...editPermissionsList, perm.id]);
                            } else {
                              setEditPermissionsList(editPermissionsList.filter((p) => p !== perm.id));
                            }
                          }}
                          className="rounded border-stone-700 text-amber-600 focus:ring-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-stone-200 leading-tight">{perm.label}</p>
                          <span className="font-mono text-[10px] text-stone-500">{perm.id}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditPermissionsModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoleEdit}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingRoleEdit ? 'Saving...' : 'Save Role & Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
