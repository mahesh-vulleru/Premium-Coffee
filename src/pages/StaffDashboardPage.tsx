import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { formatCurrency } from '../utils/pricing';
import {
  Package,
  Coffee,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  X,
  Eye,
  Lock,
  Box,
  Send,
} from 'lucide-react';

type FulfillmentTab = 'all' | 'processing' | 'roasting' | 'packed' | 'dispatched' | 'history';

interface StaffOrder {
  _id: string;
  id?: string;
  orderNumber: string;
  orderType: 'retail' | 'wholesale';
  orderStatus: 'received' | 'processing' | 'roasting' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';
  paymentStatus: string;
  cancellationStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'cancelled';
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  items: Array<{
    productName: string;
    quantity: number;
    size: string;
    grind: string;
    lineTotal: number;
  }>;
  totalAmount: number;
  totalKg?: number;
  shippingAddress: {
    contactName: string;
    businessName?: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const StaffDashboardPage: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<FulfillmentTab>('all');
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Inspected Order
  const [inspectingOrder, setInspectingOrder] = useState<StaffOrder | null>(null);

  // Dispatch Tracking Modal State
  const [dispatchModalOrder, setDispatchModalOrder] = useState<StaffOrder | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    courierName: 'BlueDart Express',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDeliveryDate: '',
    note: 'Dispatched via premium roastery courier service',
  });
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Fetch orders and metrics
  const fetchFulfillmentData = useCallback(async () => {
    if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) return;
    setLoading(true);
    try {
      const [ordersRes, metricsRes] = await Promise.all([
        fetch('/api/v1/staff/fulfillment/orders', { credentials: 'include' }),
        fetch('/api/v1/staff/fulfillment/metrics', { credentials: 'include' }),
      ]);

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (oData.success) {
          setOrders(oData.orders || []);
        }
      }

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        if (mData.success) {
          setMetrics(mData.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff fulfillment data:', err);
      setNotification({ text: 'Unable to sync fulfillment tasks with server', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin')) {
      fetchFulfillmentData();
    }
  }, [currentUser, fetchFulfillmentData]);

  // Handle fulfillment status transition
  const handleAdvanceStatus = async (order: StaffOrder, targetStatus: StaffOrder['orderStatus'], customNote?: string) => {
    // If target is dispatched, open dispatch modal for tracking details
    if (targetStatus === 'dispatched') {
      setDispatchModalOrder(order);
      setDispatchForm({
        courierName: order.courierName || 'BlueDart Express',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        estimatedDeliveryDate: order.estimatedDeliveryDate || '',
        note: customNote || 'Dispatched via specialty coffee express courier',
      });
      return;
    }

    try {
      const res = await fetch(`/api/v1/staff/fulfillment/${order._id || order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: targetStatus,
          note: customNote || `Status updated to ${targetStatus} by roastery staff`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          text: `Order ${order.orderNumber} successfully advanced to ${targetStatus.toUpperCase()}`,
          type: 'success',
        });
        fetchFulfillmentData();
        if (inspectingOrder && (inspectingOrder._id === order._id || inspectingOrder.id === order.id)) {
          setInspectingOrder(data.order);
        }
        setTimeout(() => setNotification(null), 3500);
      } else {
        setNotification({
          text: data.error || 'Failed to update order fulfillment status',
          type: 'error',
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error('Error updating fulfillment state:', err);
      setNotification({ text: 'Network error updating fulfillment state', type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Handle submit dispatch with tracking info
  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder) return;
    setIsSubmittingDispatch(true);

    try {
      const res = await fetch(`/api/v1/staff/fulfillment/${dispatchModalOrder._id || dispatchModalOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'dispatched',
          note: dispatchForm.note,
          courierName: dispatchForm.courierName,
          trackingNumber: dispatchForm.trackingNumber,
          trackingUrl: dispatchForm.trackingUrl,
          estimatedDeliveryDate: dispatchForm.estimatedDeliveryDate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          text: `Order ${dispatchModalOrder.orderNumber} marked as DISPATCHED with tracking`,
          type: 'success',
        });
        setDispatchModalOrder(null);
        fetchFulfillmentData();
        if (inspectingOrder && (inspectingOrder._id === dispatchModalOrder._id || inspectingOrder.id === dispatchModalOrder.id)) {
          setInspectingOrder(data.order);
        }
        setTimeout(() => setNotification(null), 3500);
      } else {
        setNotification({
          text: data.error || 'Failed to dispatch order',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error submitting dispatch details:', err);
      setNotification({ text: 'Network error submitting dispatch details', type: 'error' });
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#FAF6F0]">
        <div className="flex flex-col items-center gap-3">
          <Coffee className="w-8 h-8 animate-spin text-terracotta-600" />
          <p className="font-serif text-sm font-bold text-[#3A1E0E]">Connecting to Roastery Floor Queue...</p>
        </div>
      </div>
    );
  }

  // Access guard: Staff & Admin only
  if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#3A1E0E]">Roastery Staff Floor Access Only</h2>
          <p className="text-xs text-[#6E4022] leading-relaxed">
            This dashboard is dedicated to roastery floor operators and fulfillment technicians for order processing, batch roasting, and shipping.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-colors"
            >
              Sign In with Staff Account
            </Link>
            <Link
              to="/"
              className="py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtering orders
  const filteredOrders = orders.filter((ord) => {
    // Tab filter
    if (activeTab === 'processing' && ord.orderStatus !== 'processing' && ord.orderStatus !== 'received') return false;
    if (activeTab === 'roasting' && ord.orderStatus !== 'roasting') return false;
    if (activeTab === 'packed' && ord.orderStatus !== 'packed') return false;
    if (activeTab === 'dispatched' && ord.orderStatus !== 'dispatched') return false;
    if (activeTab === 'history' && ord.orderStatus !== 'delivered' && ord.orderStatus !== 'cancelled') return false;

    // Search filter
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      ord.orderNumber.toLowerCase().includes(q) ||
      (ord.shippingAddress?.contactName && ord.shippingAddress.contactName.toLowerCase().includes(q)) ||
      (ord.shippingAddress?.businessName && ord.shippingAddress.businessName.toLowerCase().includes(q)) ||
      ord.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-md ${
              notification.type === 'success'
                ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                : notification.type === 'error'
                ? 'bg-rose-800 text-rose-100 border border-rose-600'
                : 'bg-stone-800 text-stone-100 border border-stone-600'
            }`}
          >
            <span>{notification.text}</span>
            <button type="button" onClick={() => setNotification(null)} className="ml-3 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300">
                Staff Operations
              </span>
              <span className="text-xs text-[#8A5934]">
                Signed in as <strong className="text-[#3A1E0E]">{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#3A1E0E]">
              Roastery Fulfillment Queue
            </h1>
            <p className="text-xs text-[#6E4022]">
              Track live orders across roast scheduling, bagging & degas, dispatch packaging, and courier handoff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchFulfillmentData}
              className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
            {currentUser.role === 'admin' && (
              <Link
                to="/dashboard/admin"
                className="px-4 py-2 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Admin Command</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Metrics Overview Cards */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Received</span>
              <span className="text-xl font-serif font-bold text-[#3A1E0E]">{metrics.received || 0}</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Awaiting batching</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Processing</span>
              <span className="text-xl font-serif font-bold text-[#3A1E0E]">{metrics.processing || 0}</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Bean allocation</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Roasting</span>
              <span className="text-xl font-serif font-bold text-terracotta-600">{metrics.roasting || 0}</span>
              <span className="text-[10px] text-terracotta-700 block mt-0.5">In drum roaster</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Packed</span>
              <span className="text-xl font-serif font-bold text-amber-800">{metrics.packed || 0}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">Sealed & labeled</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Dispatched</span>
              <span className="text-xl font-serif font-bold text-blue-700">{metrics.dispatched || 0}</span>
              <span className="text-[10px] text-blue-600 block mt-0.5">In courier transit</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Delivered</span>
              <span className="text-xl font-serif font-bold text-emerald-700">{metrics.delivered || 0}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Fulfilled</span>
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
          {/* Controls & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF6F0] rounded-2xl border border-[#EBDCCE]">
              {[
                { id: 'all', label: 'All Tasks' },
                { id: 'processing', label: 'Processing' },
                { id: 'roasting', label: 'Roast Floor' },
                { id: 'packed', label: 'Packing' },
                { id: 'dispatched', label: 'Dispatched' },
                { id: 'history', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FulfillmentTab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#2B170E] text-white shadow-xs'
                      : 'text-[#6E4022] hover:text-[#2B170E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A5934] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, coffee..."
                className="pl-9 pr-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] placeholder-[#8A5934] focus:outline-none focus:ring-1 focus:ring-terracotta-500 w-full md:w-64"
              />
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="py-16 text-center text-xs text-[#8A5934] flex flex-col items-center gap-2">
              <Coffee className="w-6 h-6 animate-spin text-terracotta-600" />
              <span>Loading roastery fulfillment queue...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 px-4 rounded-3xl bg-[#FAF6F0] border border-dashed border-[#EBDCCE] text-center max-w-md mx-auto space-y-2">
              <Package className="w-8 h-8 text-[#8A5934] mx-auto" />
              <h3 className="font-serif text-base font-bold text-[#3A1E0E]">No Orders in This Station</h3>
              <p className="text-xs text-[#6E4022]">
                There are no orders currently awaiting action in this workflow stage.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => {
                const isCancellationRequested = ord.cancellationStatus === 'requested';
                return (
                  <div
                    key={ord._id || ord.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCancellationRequested
                        ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-[#FAF6F0] border-[#EBDCCE] hover:border-terracotta-300'
                    }`}
                  >
                    {/* Cancellation Warning Banner if on hold */}
                    {isCancellationRequested && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-100 border border-rose-300 flex items-start gap-2.5 text-xs text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold">
                            ⚠️ CANCELLATION REQUESTED BY CUSTOMER — PRODUCTION ON HOLD
                          </p>
                          <p className="text-[11px] text-rose-800">
                            Reason: "{ord.cancellationReason || 'No reason specified'}". Per roastery policy, staff cannot process cancellations or refunds. Awaiting Administrator decision. Do not roast or ship.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Order Top Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#EBDCCE] pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-[#2B170E] text-sm">
                            {ord.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 text-stone-800">
                            {ord.orderType}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                              ord.orderStatus === 'received'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : ord.orderStatus === 'processing'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : ord.orderStatus === 'roasting'
                                ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                : ord.orderStatus === 'packed'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : ord.orderStatus === 'dispatched'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : ord.orderStatus === 'delivered'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-[#8A5934]">
                            Payment: {ord.paymentStatus}
                          </span>
                        </div>
                        <div className="text-xs text-[#532D16] mt-1 flex flex-wrap items-center gap-x-3">
                          <span>
                            Customer: <strong>{ord.shippingAddress?.businessName || ord.shippingAddress?.contactName}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Placed: {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-[#2B170E]">{formatCurrency(ord.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Station Progression Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {ord.orderStatus === 'received' && (
                          <button
                            type="button"
                            disabled={isCancellationRequested}
                            onClick={() => handleAdvanceStatus(ord, 'processing', 'Started order batching & bean selection')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Start Processing</span>
                          </button>
                        )}

                        {ord.orderStatus === 'processing' && (
                          <button
                            type="button"
                            disabled={isCancellationRequested}
                            onClick={() => handleAdvanceStatus(ord, 'roasting', 'Loaded micro-lots into drum roaster')}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Start Roast Drum</span>
                          </button>
                        )}

                        {ord.orderStatus === 'roasting' && (
                          <button
                            type="button"
                            disabled={isCancellationRequested}
                            onClick={() => handleAdvanceStatus(ord, 'packed', 'Roast cooling completed; valve bags sealed')}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>Mark Packed & Sealed</span>
                          </button>
                        )}

                        {ord.orderStatus === 'packed' && (
                          <button
                            type="button"
                            disabled={isCancellationRequested}
                            onClick={() => handleAdvanceStatus(ord, 'dispatched')}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch & Enter Courier</span>
                          </button>
                        )}

                        {ord.orderStatus === 'dispatched' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStatus(ord, 'delivered', 'Confirmed doorstep delivery with courier')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Delivered</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setInspectingOrder(ord)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-white/80 border border-[#EBDCCE] text-xs font-bold text-[#3A1E0E] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>

                    {/* Items & Fulfillment Summary */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#8A5934] uppercase tracking-wider block mb-1">
                          Items to Roast & Pack ({ord.items.length})
                        </span>
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-[#EBDCCE]">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[#3A1E0E]">
                              <div>
                                <span className="font-bold">{item.productName}</span>
                                <span className="text-[11px] text-[#8A5934] ml-2 font-medium">
                                  {item.quantity}x {item.size} • {item.grind}
                                </span>
                              </div>
                              <span className="font-semibold text-[11px] text-stone-600">{formatCurrency(item.lineTotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#8A5934] uppercase tracking-wider block mb-1">
                          Delivery Destination
                        </span>
                        <div className="bg-white p-2.5 rounded-xl border border-[#EBDCCE] text-[#532D16] space-y-0.5">
                          <p className="font-bold text-[#3A1E0E]">
                            {ord.shippingAddress?.businessName || ord.shippingAddress?.contactName}
                          </p>
                          <p className="text-[11px]">
                            {ord.shippingAddress?.street}
                            {ord.shippingAddress?.apartment ? `, ${ord.shippingAddress.apartment}` : ''},{' '}
                            {ord.shippingAddress?.city}, {ord.shippingAddress?.state} {ord.shippingAddress?.postalCode}
                          </p>
                          {ord.shippingAddress?.phone && (
                            <p className="text-[11px] text-[#8A5934]">Contact: {ord.shippingAddress.phone}</p>
                          )}
                        </div>

                        {/* Tracking badge if dispatched */}
                        {ord.trackingNumber && (
                          <div className="mt-2 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold block">{ord.courierName || 'Courier'}: {ord.trackingNumber}</span>
                              {ord.estimatedDeliveryDate && (
                                <span className="text-[10px] text-blue-700">Est. Delivery: {ord.estimatedDeliveryDate}</span>
                              )}
                            </div>
                            {ord.trackingUrl && (
                              <a
                                href={ord.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1"
                              >
                                <span>Track</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Tracking Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-[#EBDCCE]">
            <div className="flex items-center justify-between border-b border-[#EBDCCE] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#3A1E0E] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Dispatch Order {dispatchModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#8A5934] mt-0.5">
                  Enter courier information to notify the customer and generate tracking updates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="text-[#8A5934] hover:text-[#3A1E0E] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-[#3A1E0E] block mb-1">Courier Service Name</label>
                <input
                  type="text"
                  value={dispatchForm.courierName}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, courierName: e.target.value })}
                  placeholder="e.g. BlueDart Express, Delhivery, DTDC"
                  className="w-full p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A1E0E] block mb-1">Tracking Number / AWB</label>
                <input
                  type="text"
                  value={dispatchForm.trackingNumber}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                  placeholder="e.g. BLU-982341982"
                  className="w-full p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A1E0E] block mb-1">Tracking URL (Optional)</label>
                <input
                  type="text"
                  value={dispatchForm.trackingUrl}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, trackingUrl: e.target.value })}
                  placeholder="https://track.bluedart.com/awb=..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A1E0E] block mb-1">Estimated Delivery Date (Optional)</label>
                <input
                  type="date"
                  value={dispatchForm.estimatedDeliveryDate}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, estimatedDeliveryDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A1E0E] block mb-1">Dispatch Note</label>
                <textarea
                  rows={2}
                  value={dispatchForm.note}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, note: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#EBDCCE]">
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="flex-1 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDispatch}
                onClick={handleConfirmDispatch}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isSubmittingDispatch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Order Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-white rounded-3xl p-6 space-y-5 shadow-2xl border border-[#EBDCCE] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EBDCCE] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-[#3A1E0E]">
                    Order {inspectingOrder.orderNumber}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-800 border border-stone-300">
                    {inspectingOrder.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-[#8A5934] mt-0.5">
                  Ordered by {inspectingOrder.shippingAddress?.businessName || inspectingOrder.shippingAddress?.contactName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="p-1 rounded-lg text-[#8A5934] hover:text-[#3A1E0E] hover:bg-[#FAF6F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Cancellation Notice if requested */}
              {inspectingOrder.cancellationStatus && inspectingOrder.cancellationStatus !== 'none' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-1">
                  <span className="font-bold text-amber-900 block uppercase text-[10px] tracking-wider">
                    Cancellation Status: {inspectingOrder.cancellationStatus.toUpperCase()}
                  </span>
                  {inspectingOrder.cancellationReason && (
                    <p className="text-amber-800">Customer Note: "{inspectingOrder.cancellationReason}"</p>
                  )}
                  {inspectingOrder.cancellationStatus === 'requested' && (
                    <p className="text-[11px] text-amber-700 italic">
                      Staff reminder: Cancellation and refunds can only be approved by system administrators.
                    </p>
                  )}
                </div>
              )}

              {/* Status History Timeline */}
              {inspectingOrder.statusHistory && inspectingOrder.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#8A5934] uppercase tracking-wider block">
                    Fulfillment History & Roastery Notes
                  </span>
                  <div className="space-y-2 bg-[#FAF6F0] p-3 rounded-xl border border-[#EBDCCE]">
                    {inspectingOrder.statusHistory.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-terracotta-500 mt-1 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#3A1E0E] uppercase">{item.status}</span>
                            <span className="text-[#8A5934] text-[10px]">
                              {new Date(item.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                            {item.updatedBy && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                                {item.updatedBy}
                              </span>
                            )}
                          </div>
                          {item.note && <p className="text-[#532D16] mt-0.5">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#8A5934] uppercase tracking-wider block">
                  Coffee Bags & Grind Specifications
                </span>
                <div className="bg-[#FAF6F0] rounded-xl p-3 divide-y divide-[#EBDCCE] border border-[#EBDCCE]">
                  {inspectingOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#3A1E0E]">{item.productName}</div>
                        <div className="text-[11px] text-[#8A5934]">
                          {item.quantity}x {item.size} • {item.grind}
                        </div>
                      </div>
                      <div className="font-extrabold text-[#2B170E]">{formatCurrency(item.lineTotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination Address */}
              {inspectingOrder.shippingAddress && (
                <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EBDCCE] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Shipping Address</span>
                  <p className="font-bold text-[#3A1E0E]">
                    {inspectingOrder.shippingAddress.businessName || inspectingOrder.shippingAddress.contactName}
                  </p>
                  <p className="text-[#532D16]">
                    {inspectingOrder.shippingAddress.street}
                    {inspectingOrder.shippingAddress.apartment ? `, ${inspectingOrder.shippingAddress.apartment}` : ''}
                  </p>
                  <p className="text-[#8A5934]">
                    {inspectingOrder.shippingAddress.city}, {inspectingOrder.shippingAddress.state} {inspectingOrder.shippingAddress.postalCode} • {inspectingOrder.shippingAddress.country}
                  </p>
                  {inspectingOrder.shippingAddress.phone && (
                    <p className="text-[#8A5934]">Phone: {inspectingOrder.shippingAddress.phone}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EBDCCE]">
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
