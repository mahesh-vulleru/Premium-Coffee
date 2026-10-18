      import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  KeyRound,
  LogOut,
  Store,
  Calendar,
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
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../utils/pricing';

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

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    isLoading,
    allUsers,
    approveWholesaleUser,
    rejectWholesaleUser,
    logout,
  } = useAuth();

  const [notification, setNotification] = useState<string | null>(null);

  // Server-Authoritative Metrics
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Wholesale Applications State
  const [appFilter, setAppFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [appSearch, setAppSearch] = useState('');
  const [rejectingUser, setRejectingUser] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Volume under commercial minimum or documentation incomplete.');
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);

  // Orders State
  const [wholesaleOrders, setWholesaleOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [inspectingOrder, setInspectingOrder] = useState<any | null>(null);

  // Terminal Order Transition State
  const [transitionPrompt, setTransitionPrompt] = useState<{
    orderId: string;
    orderNumber: string;
    field: 'orderStatus' | 'paymentStatus';
    newValue: string;
  } | null>(null);
  const [transitionReason, setTransitionReason] = useState('');

  // User Accounts State
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'wholesale' | 'admin'>('all');
  const [userSearch, setUserSearch] = useState('');

  const fetchAdminMetrics = useCallback(async () => {
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

  const fetchWholesaleOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/v1/admin/orders?orderType=wholesale', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setWholesaleOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin wholesale orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (currentUser?.role === 'admin') {
      fetch('/api/v1/admin/metrics', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success && data.metrics) {
            setMetrics(data.metrics);
          }
        })
        .catch((err) => console.error('Failed to load metrics:', err));

      fetch('/api/v1/admin/orders?orderType=wholesale', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success) {
            setWholesaleOrders(data.orders || []);
          }
        })
        .catch((err) => console.error('Failed to load wholesale orders:', err));
    }
    return () => {
      ignore = true;
    };
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-4 bg-stone-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-800 text-amber-400 flex items-center justify-center border border-stone-700 animate-pulse">
            <ShieldAlert className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-100">Accessing Command Center...</h2>
            <p className="text-xs text-stone-400 mt-1">Verifying administrative security credentials</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen py-20 px-4 bg-[#FAF6F0] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              Access Restricted
            </h1>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              You must possess verified administrative credentials to access the Firedup Operations Command Center.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
            >
              Sign In with Staff Account
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Application filtering
  const wholesaleUsers = allUsers.filter((u) => u.role === 'wholesale');
  const pendingWholesale = wholesaleUsers.filter((u) => u.wholesaleDetails?.status === 'pending');
  const approvedWholesale = wholesaleUsers.filter((u) => u.wholesaleDetails?.status === 'approved');
  const rejectedWholesale = wholesaleUsers.filter((u) => u.wholesaleDetails?.status === 'rejected');
  const regularCustomers = allUsers.filter((u) => u.role === 'customer');

  const filteredApplications = wholesaleUsers.filter((u) => {
    const matchesFilter = appFilter === 'all' || u.wholesaleDetails?.status === appFilter;
    if (!matchesFilter) return false;
    if (!appSearch.trim()) return true;
    const q = appSearch.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.wholesaleDetails?.businessName && u.wholesaleDetails.businessName.toLowerCase().includes(q)) ||
      (u.wholesaleDetails?.taxId && u.wholesaleDetails.taxId.toLowerCase().includes(q))
    );
  });

  // Orders filtering
  const filteredOrders = wholesaleOrders.filter((ord) => {
    const matchesStatus = orderStatusFilter === 'all' || ord.orderStatus === orderStatusFilter;
    if (!matchesStatus) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase().trim();
    return (
      ord.orderNumber.toLowerCase().includes(q) ||
      (ord.shippingAddress?.businessName && ord.shippingAddress.businessName.toLowerCase().includes(q)) ||
      (ord.shippingAddress?.contactName && ord.shippingAddress.contactName.toLowerCase().includes(q))
    );
  });

  // Users filtering
  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    if (!matchesRole) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.wholesaleDetails?.businessName && u.wholesaleDetails.businessName.toLowerCase().includes(q))
    );
  });

  const handleApprove = (userId: string, businessName?: string) => {
    approveWholesaleUser(userId);
    setNotification(
      `Wholesale application for "${businessName || 'Partner'}" approved. 35% commercial volume pricing active.`
    );
    fetchAdminMetrics();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    rejectWholesaleUser(rejectingUser.id, rejectionReason);
    setNotification(`Application for "${rejectingUser.name}" declined.`);
    setRejectingUser(null);
    setRejectionReason('Volume under commercial minimum or documentation incomplete.');
    fetchAdminMetrics();
    setTimeout(() => setNotification(null), 4000);
  };

  const executeOrderStatusUpdate = async (
    orderId: string,
    updates: { orderStatus?: string; paymentStatus?: string; transitionReason?: string }
  ) => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`Order status updated successfully`);
        fetchWholesaleOrders();
        fetchAdminMetrics();
        if (inspectingOrder && (inspectingOrder._id === orderId || inspectingOrder.id === orderId)) {
          setInspectingOrder(data.order);
        }
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification(data.error || 'Failed to update order status');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch {
      setNotification('Failed to update order status');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleUpdateOrderStatus = (order: any, newStatus: string) => {
    // If order is currently delivered or cancelled and status is changing, prompt for administrative reason
    if ((order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && newStatus !== order.orderStatus) {
      setTransitionPrompt({
        orderId: order._id || order.id,
        orderNumber: order.orderNumber,
        field: 'orderStatus',
        newValue: newStatus,
      });
      setTransitionReason('');
      return;
    }
    executeOrderStatusUpdate(order._id || order.id, { orderStatus: newStatus });
  };

  const handleUpdatePaymentStatus = (order: any, newPaymentStatus: string) => {
    // If order payment is currently paid and reverting, prompt for administrative reason
    if (order.paymentStatus === 'paid' && newPaymentStatus !== 'paid') {
      setTransitionPrompt({
        orderId: order._id || order.id,
        orderNumber: order.orderNumber,
        field: 'paymentStatus',
        newValue: newPaymentStatus,
      });
      setTransitionReason('');
      return;
    }
    executeOrderStatusUpdate(order._id || order.id, { paymentStatus: newPaymentStatus });
  };

  const handleConfirmTransition = () => {
    if (!transitionPrompt) return;
    if (!transitionReason.trim()) {
      alert('Please provide an administrative reason for reopening a terminal status.');
      return;
    }
    executeOrderStatusUpdate(transitionPrompt.orderId, {
      [transitionPrompt.field]: transitionPrompt.newValue,
      transitionReason: transitionReason.trim(),
    });
    setTransitionPrompt(null);
    setTransitionReason('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Operational Nav */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  Operations & Wholesale Command
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Logged in as <strong className="text-stone-200">{currentUser.name}</strong> ({currentUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchAdminMetrics();
                fetchWholesaleOrders();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-xs font-semibold text-red-300 transition-colors border border-red-800/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Global Notification */}
        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Server-Authoritative KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-amber-400">
              {metrics ? metrics.applications.pending : pendingWholesale.length}
            </div>
            <p className="text-[11px] text-stone-400">Awaiting commercial qualification</p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Active Wholesale</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-emerald-400">
              {metrics ? metrics.applications.approved : approvedWholesale.length}
            </div>
            <p className="text-[11px] text-stone-400">Authorized B2B partners</p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Wholesale Revenue</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-serif font-bold text-purple-400">
              {metrics ? formatCurrency(metrics.orders.totalRevenue) : '₹0'}
            </div>
            <p className="text-[11px] text-stone-400">
              {metrics ? `${metrics.orders.wholesale} orders (${metrics.orders.totalKg} kg)` : `${wholesaleOrders.length} orders`}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Warehouse Inventory</span>
              <Boxes className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-serif font-bold text-cyan-400">
              {metrics ? `${metrics.inventory.totalStockBags} Bags` : 'Available'}
            </div>
            <p className="text-[11px] text-stone-400">
              {metrics ? `${metrics.inventory.totalProducts} SKUs (${metrics.inventory.lowStockProducts} low stock)` : `${regularCustomers.length} retail users`}
            </p>
          </div>
        </div>

        {/* Section 1: Wholesale Applications Management */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Commercial Wholesale Applications
              </h2>
              <p className="text-xs text-stone-400">
                Review commercial tax identifiers, projected monthly volume, and facility delivery addresses before granting commercial access.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search partner or Tax ID..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
                />
              </div>

              <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700">
                {[
                  { id: 'pending', label: `Pending (${pendingWholesale.length})` },
                  { id: 'approved', label: `Approved (${approvedWholesale.length})` },
                  { id: 'rejected', label: `Declined (${rejectedWholesale.length})` },
                  { id: 'all', label: `All (${wholesaleUsers.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAppFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      appFilter === tab.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="p-8 rounded-2xl bg-stone-800/40 border border-stone-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">
                No wholesale applications match the current filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredApplications.map((user) => {
                const details = user.wholesaleDetails;
                const status = details?.status || 'pending';

                return (
                  <div
                    key={user.id}
                    className="p-5 rounded-2xl bg-stone-800/90 border border-stone-700 space-y-4 hover:border-stone-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-stone-100">
                            {details?.businessName || user.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              status === 'approved'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : status === 'rejected'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Classification: <span className="text-stone-200 capitalize font-medium">{details?.businessType || 'Cafe'}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectingUser(user)}
                        className="px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-700/60 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Contact Person</span>
                        <span className="text-stone-200 font-medium">{user.name}</span>
                        <span className="text-[11px] text-stone-400 block">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Projected Volume</span>
                        <span className="text-amber-300 font-bold">{details?.monthlyVolumeKg || '50'} kg / month</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Commercial Tax / GST</span>
                        <span className="font-mono text-stone-300 font-bold">{details?.taxId || 'Under Verification'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Contact Phone</span>
                        <span className="text-stone-300">{user.phone}</span>
                      </div>
                    </div>

                    {details?.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px]">
                        <strong>Decline Reason on Record:</strong> {details.rejectionReason}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(user.id, details?.businessName)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Wholesale</span>
                        </button>
                      )}
                      {status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => setRejectingUser({ id: user.id, name: details?.businessName || user.name })}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-800/60"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline Application</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Wholesale Orders & Roast Dispatch Management */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Commercial Roastery Dispatches & Orders
              </h2>
              <p className="text-xs text-stone-400">
                Manage commercial bulk coffee batches, update fulfillment schedules, and verify payment terms.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order # or partner..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Fulfillment</option>
                <option value="received">Received</option>
                <option value="processing">Processing</option>
                <option value="roasting">Batch Roasting</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={fetchWholesaleOrders}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 border border-stone-700"
              >
                <RefreshCw className={`w-3 h-3 ${ordersLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading commercial orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-stone-800/40 border border-stone-800 text-center text-xs text-stone-400">
              No commercial wholesale orders matching the current criteria.
            </div>
          ) : (
            <div className="bg-stone-800 rounded-2xl border border-stone-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-700">
                    <tr>
                      <th className="py-3 px-4">Order / Business</th>
                      <th className="py-3 px-4">Volume (kg)</th>
                      <th className="py-3 px-4">Amount / Terms</th>
                      <th className="py-3 px-4">Fulfillment Status</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-700/60 font-sans">
                    {filteredOrders.map((ord) => (
                      <tr key={ord._id || ord.id} className="hover:bg-stone-750/50">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-stone-200">{ord.orderNumber}</div>
                          <div className="text-[11px] text-stone-400">
                            {ord.shippingAddress?.businessName || ord.shippingAddress?.contactName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-300">
                          {ord.totalKg} kg
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-100">{formatCurrency(ord.totalAmount)}</div>
                          <div className="text-[10px] text-stone-400 capitalize">{ord.paymentMethod?.replace('_', ' ')}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ord.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(ord, e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-xs font-semibold text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="received">Received</option>
                            <option value="processing">Processing</option>
                            <option value="roasting">Batch Roasting</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ord.paymentStatus}
                            onChange={(e) => handleUpdatePaymentStatus(ord, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg bg-stone-900 border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              ord.paymentStatus === 'paid'
                                ? 'border-emerald-600 text-emerald-300'
                                : ord.paymentStatus === 'terms_approved'
                                ? 'border-blue-600 text-blue-300'
                                : ord.paymentStatus === 'failed'
                                ? 'border-rose-600 text-rose-300'
                                : 'border-stone-700 text-stone-300'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="terms_approved">Terms Approved (Net 15)</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectingOrder(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                            <a
                              href={`/api/v1/wholesale/orders/${ord._id || ord.id}/invoice`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-900 text-xs font-bold"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Invoice</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: All Provisioned Accounts Audit */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-400" />
                All User Accounts & Role Matrix
              </h2>
              <p className="text-xs text-stone-400">
                Live audit view of all provisioned accounts in the application store.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
                />
              </div>

              <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700">
                {[
                  { id: 'all', label: `All (${allUsers.length})` },
                  { id: 'customer', label: `Retail (${regularCustomers.length})` },
                  { id: 'wholesale', label: `Wholesale (${wholesaleUsers.length})` },
                  { id: 'admin', label: `Admins (${allUsers.filter((u) => u.role === 'admin').length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUserRoleFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userRoleFilter === tab.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-stone-800 rounded-2xl border border-stone-700/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">User / Contact</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Organization / Notes</th>
                    <th className="py-3 px-4">Status / Discount</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {filteredUsers.map((user) => {
                    return (
                      <tr key={user.id} className="hover:bg-stone-750/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-200">{user.name}</div>
                          <div className="text-[11px] text-stone-400">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : user.role === 'wholesale'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-stone-700 text-stone-300'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-300">
                          {user.wholesaleDetails?.businessName ? (
                            <div>
                              <span className="font-semibold">{user.wholesaleDetails.businessName}</span>
                              <span className="text-[11px] text-stone-400 block">
                                {user.wholesaleDetails.businessType}
                              </span>
                            </div>
                          ) : user.role === 'admin' ? (
                            <span className="text-stone-400 font-mono">Headquarters Admin</span>
                          ) : (
                            <span className="text-stone-400">Retail Direct Customer</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.role === 'wholesale' ? (
                            user.wholesaleDetails?.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approved (35% Tier)
                              </span>
                            ) : user.wholesaleDetails?.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                Pending Review
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                                <XCircle className="w-3.5 h-3.5" />
                                Declined
                              </span>
                            )
                          ) : user.role === 'admin' ? (
                            <span className="text-purple-300 font-semibold">System Administrator</span>
                          ) : (
                            <span className="text-stone-400">Standard Pricing</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {user.createdAt ? user.createdAt.slice(0, 10) : 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4: Security Policy */}
        <section className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 space-y-3">
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-serif font-bold text-stone-200">
                Staff Invitation Token Security Policy
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Administrative provisioning secrets are managed strictly via server-side environment configuration and single-use cryptographically verified database tokens. In production and development environments, provisioning secrets are never rendered in client bundles or disclosed in public API responses.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Decline Reason Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
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
              Decline wholesale application for <strong className="text-amber-300">{rejectingUser.name}</strong>. Please record the official operational reason:
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-stone-400 font-semibold block">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="flex-1 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Application Details Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-100">
                  {inspectingUser.wholesaleDetails?.businessName || inspectingUser.name}
                </h3>
                <span className="text-xs text-amber-300 font-mono">Status: {inspectingUser.wholesaleDetails?.status}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-900 rounded-xl">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Contact Person</span>
                  <span className="text-stone-200 font-bold">{inspectingUser.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Email</span>
                  <span className="text-stone-300">{inspectingUser.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Phone</span>
                  <span className="text-stone-300">{inspectingUser.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Business Type</span>
                  <span className="text-stone-300 capitalize">{inspectingUser.wholesaleDetails?.businessType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Commercial Tax / GST</span>
                  <span className="text-stone-200 font-mono font-bold">{inspectingUser.wholesaleDetails?.taxId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Projected Volume</span>
                  <span className="text-amber-300 font-bold">{inspectingUser.wholesaleDetails?.monthlyVolumeKg} kg / month</span>
                </div>
              </div>

              {inspectingUser.wholesaleDetails?.deliveryAddress && (
                <div className="p-3 bg-stone-900 rounded-xl space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Delivery Facility Address</span>
                  <p className="text-stone-200">
                    {inspectingUser.wholesaleDetails.deliveryAddress.street}
                    {inspectingUser.wholesaleDetails.deliveryAddress.apartment ? `, ${inspectingUser.wholesaleDetails.deliveryAddress.apartment}` : ''}
                  </p>
                  <p className="text-stone-400">
                    {inspectingUser.wholesaleDetails.deliveryAddress.city}, {inspectingUser.wholesaleDetails.deliveryAddress.state} {inspectingUser.wholesaleDetails.deliveryAddress.postalCode}
                  </p>
                  <p className="text-stone-400">{inspectingUser.wholesaleDetails.deliveryAddress.country}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="px-5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Wholesale Order Details Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-stone-100">
                    Order {inspectingOrder.orderNumber}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {inspectingOrder.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Placed by {inspectingOrder.shippingAddress?.businessName || inspectingOrder.shippingAddress?.contactName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Financial & Terms Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-stone-900 rounded-xl">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Batch Weight</span>
                  <span className="text-amber-300 font-bold text-sm">{inspectingOrder.totalKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Volume Tier</span>
                  <span className="text-stone-200 font-medium">{inspectingOrder.discountTier || 'Wholesale Standard'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Payment Terms</span>
                  <span className="text-stone-200 capitalize font-medium">{inspectingOrder.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Total Invoice</span>
                  <span className="text-emerald-400 font-bold text-sm">{formatCurrency(inspectingOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">Ordered Items</span>
                <div className="bg-stone-900 rounded-xl overflow-hidden border border-stone-700/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-950 text-stone-400 text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3">Size / Grind</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {inspectingOrder.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="text-stone-200">
                          <td className="py-2 px-3 font-semibold">{item.productName}</td>
                          <td className="py-2 px-3 text-stone-400">{item.size} • {item.grind}</td>
                          <td className="py-2 px-3 text-center font-bold text-amber-300">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-stone-300">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2 px-3 text-right font-bold text-stone-100">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Facility */}
              {inspectingOrder.shippingAddress && (
                <div className="p-3 bg-stone-900 rounded-xl space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Roastery Delivery Destination</span>
                  <p className="text-stone-200 font-semibold">{inspectingOrder.shippingAddress.businessName || inspectingOrder.shippingAddress.contactName}</p>
                  <p className="text-stone-300">
                    {inspectingOrder.shippingAddress.street}
                    {inspectingOrder.shippingAddress.apartment ? `, ${inspectingOrder.shippingAddress.apartment}` : ''}
                  </p>
                  <p className="text-stone-400">
                    {inspectingOrder.shippingAddress.city}, {inspectingOrder.shippingAddress.state} {inspectingOrder.shippingAddress.postalCode} • {inspectingOrder.shippingAddress.country}
                  </p>
                  <p className="text-stone-400">Phone: {inspectingOrder.shippingAddress.phone}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-700">
              <a
                href={`/api/v1/wholesale/orders/${inspectingOrder._id || inspectingOrder.id}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Tax Invoice PDF</span>
              </a>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="px-5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Order Status Reopen / Payment Revert Prompt Modal */}
      {transitionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Administrative Transition Reason Required
              </h3>
              <button
                type="button"
                onClick={() => setTransitionPrompt(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Updating Order <strong className="text-amber-300">{transitionPrompt.orderNumber}</strong> {transitionPrompt.field === 'orderStatus' ? 'fulfillment status' : 'payment status'} to <span className="font-mono text-amber-400 uppercase font-bold">{transitionPrompt.newValue}</span> requires an official audit reason.
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-stone-400 font-semibold block">Audit Log Reason</label>
              <textarea
                rows={3}
                placeholder="e.g., Customer requested rescheduling before final dispatch / roastery batch adjustment..."
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransitionPrompt(null)}
                className="flex-1 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
