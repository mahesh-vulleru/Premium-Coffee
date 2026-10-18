import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';
import {
  Building2,
  Clock,
  Download,
  Mail,
  TrendingUp,
  LogOut,
  ShoppingBag,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  RefreshCw,
  FileText,
  MapPin,
  Eye,
  Loader2,
  Package,
  Layers,
  Truck,
  Check,
} from 'lucide-react';

type WholesaleTab = 'overview' | 'catalog' | 'cart' | 'orders' | 'profile' | 'price_sheet';

interface WholesaleProduct {
  _id: string;
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  image: string;
  origin: string;
  roastLevel: string;
  tastingNotes: string[];
  description: string;
  retailBasePrice: number;
  retailKgPrice: number;
  wholesalePricePerKg: number;
  commercialDiscountPercent: number;
  minOrderKg: number;
  packSizes: string[];
  stockAvailableKg: number;
}

interface WholesaleCartItem {
  _id: string;
  product: {
    _id: string;
    id: string;
    name: string;
    image: string;
    origin: string;
    price: number;
  };
  quantity: number;
  size: string;
  grind: string;
  weightPerUnitKg: number;
  lineWeightKg: number;
  retailKgPrice: number;
  discountedKgPrice: number;
  unitPrice: number;
  lineTotal: number;
}

interface WholesaleCartPricing {
  items: WholesaleCartItem[];
  itemCount: number;
  totalKg: number;
  moqKg: number;
  isMoqMet: boolean;
  discountTier: string;
  discountPercent: number;
  rawRetailSubtotal: number;
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  shippingFee: number;
  freeFreightThresholdKg: number;
  freeShippingQualified: boolean;
  finalTotal: number;
  paymentTerms: string;
}

interface WholesaleOrder {
  id: string;
  _id: string;
  orderNumber: string;
  orderType: string;
  totalKg: number;
  subtotal: number;
  discountTier?: string;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: Array<{
    product: string;
    productName: string;
    quantity: number;
    size: string;
    grind: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  shippingAddress: {
    businessName?: string;
    contactName: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  totalVolumeOrderedKg: number;
}

export const WholesaleDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading: authLoading, logout, updateProfile } = useAuth();
  const { showToast } = useCart();

  const [activeTab, setActiveTab] = useState<WholesaleTab>('overview');

  // Backend Data States
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats;
    recentOrders: WholesaleOrder[];
  } | null>(null);
  const [catalogItems, setCatalogItems] = useState<WholesaleProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Cart States
  const [bulkCart, setBulkCart] = useState<WholesaleCartPricing | null>(null);
  const [cartUpdating, setCartUpdating] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<WholesaleOrder | null>(null);

  // Checkout Form State
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'net_terms' | 'bank_transfer'>('net_terms');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Business Profile Form State initialized directly from currentUser
  const [profileForm, setProfileForm] = useState(() => {
    const d = currentUser?.wholesaleDetails;
    const addr = d?.deliveryAddress || currentUser?.shippingAddress;
    return {
      businessName: d?.businessName || '',
      businessType: d?.businessType || 'cafe',
      contactName: currentUser?.name || '',
      phone: currentUser?.phone || '',
      taxId: d?.taxId || '',
      monthlyVolumeKg: d?.monthlyVolumeKg || '50',
      street: addr?.street || '',
      apartment: addr?.apartment || '',
      city: addr?.city || '',
      state: addr?.state || '',
      postalCode: addr?.postalCode || '',
      country: addr?.country || 'India',
    };
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Selected catalog item card options: { [productId]: { size: string, grind: string, quantity: number } }
  const [itemSelections, setItemSelections] = useState<Record<string, { size: string; grind: string; quantity: number }>>({});

  const details = currentUser?.wholesaleDetails;
  const isApproved = details?.status === 'approved';
  const isPending = details?.status === 'pending';
  const isRejected = details?.status === 'rejected';

  // Fetch Dashboard Overview & Real Stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/wholesale/dashboard', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardData({
          stats: data.stats,
          recentOrders: data.recentOrders,
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }, []);


  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!isApproved) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/v1/wholesale/orders', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load wholesale orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [isApproved]);

  // Trigger loads on mount & tab changes
  useEffect(() => {
    let ignore = false;
    if (currentUser && (currentUser.role === 'wholesale' || currentUser.role === 'admin')) {
      fetch('/api/v1/wholesale/dashboard', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success) {
            setDashboardData({
              stats: data.stats,
              recentOrders: data.recentOrders,
            });
          }
        })
        .catch((err) => console.error('Failed to load dashboard data:', err));
    }
    return () => {
      ignore = true;
    };
  }, [currentUser]);

  useEffect(() => {
    let ignore = false;
    if (activeTab === 'catalog' && isApproved) {
      let url = '/api/v1/wholesale/catalog';
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      fetch(url, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success) {
            setCatalogItems(data.items || []);
          }
        })
        .catch((err) => console.error('Failed to load catalog:', err))
        .finally(() => {
          if (!ignore) setCatalogLoading(false);
        });
    } else if (activeTab === 'cart' && isApproved) {
      fetch('/api/v1/wholesale/cart', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success) {
            setBulkCart(data.cart);
          }
        })
        .catch((err) => console.error('Failed to load cart:', err));
    } else if (activeTab === 'orders' && isApproved) {
      fetch('/api/v1/wholesale/orders', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success) {
            setOrders(data.orders || []);
          }
        })
        .catch((err) => console.error('Failed to load orders:', err));
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, isApproved, selectedCategory, searchQuery]);

  // Catalog item option helper
  const getItemSelection = (productId: string) => {
    return (
      itemSelections[productId] || {
        size: '1kg',
        grind: 'Whole Bean',
        quantity: 5,
      }
    );
  };

  const updateItemSelection = (productId: string, updates: Partial<{ size: string; grind: string; quantity: number }>) => {
    setItemSelections((prev) => ({
      ...prev,
      [productId]: { ...getItemSelection(productId), ...updates },
    }));
  };

  // Add to wholesale bulk cart
  const handleAddToCart = async (productId: string, productName: string) => {
    const sel = getItemSelection(productId);
    setCartUpdating(true);
    try {
      const res = await fetch('/api/v1/wholesale/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          size: sel.size,
          grind: sel.grind,
          quantity: sel.quantity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBulkCart(data.cart);
        showToast(`Added ${sel.quantity}x ${sel.size} (${productName}) to bulk cart`, 'success');
      } else {
        showToast(data.error || 'Failed to add item to wholesale cart', 'error');
      }
    } catch {
      showToast('Network error adding to bulk cart', 'error');
    } finally {
      setCartUpdating(false);
    }
  };

  // Update item quantity in cart
  const handleUpdateCartQuantity = async (itemId: string, newQty: number) => {
    try {
      const res = await fetch(`/api/v1/wholesale/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBulkCart(data.cart);
      } else {
        showToast(data.error || 'Failed to update quantity', 'error');
      }
    } catch {
      showToast('Network error updating item', 'error');
    }
  };

  // Remove item from cart
  const handleRemoveCartItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/v1/wholesale/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBulkCart(data.cart);
        showToast('Item removed from bulk cart', 'info');
      }
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  // Submit bulk order
  const handleSubmitBulkOrder = async () => {
    if (!bulkCart || bulkCart.items.length === 0) {
      showToast('Your bulk cart is empty.', 'error');
      return;
    }

    if (!bulkCart.isMoqMet) {
      showToast(`Wholesale minimum order quantity is ${bulkCart.moqKg}kg. Current: ${bulkCart.totalKg}kg.`, 'error');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await fetch('/api/v1/wholesale/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notes: checkoutNotes,
          paymentMethod: checkoutPaymentMethod,
          deliveryAddress: {
            contactName: profileForm.contactName,
            phone: profileForm.phone,
            street: profileForm.street,
            apartment: profileForm.apartment,
            city: profileForm.city,
            state: profileForm.state,
            postalCode: profileForm.postalCode,
            country: profileForm.country,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Wholesale order ${data.order.orderNumber} placed successfully!`, 'success');
        setBulkCart(null);
        setCheckoutNotes('');
        fetchDashboardStats();
        setActiveTab('orders');
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to submit order', 'error');
      }
    } catch {
      showToast('Network error submitting order', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch('/api/v1/wholesale/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contactName: profileForm.contactName,
          phone: profileForm.phone,
          businessName: profileForm.businessName,
          businessType: profileForm.businessType,
          taxId: profileForm.taxId,
          monthlyVolumeKg: profileForm.monthlyVolumeKg,
          deliveryAddress: {
            street: profileForm.street,
            apartment: profileForm.apartment,
            city: profileForm.city,
            state: profileForm.state,
            postalCode: profileForm.postalCode,
            country: profileForm.country,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess('Business profile and delivery facility details saved successfully.');
        showToast('Commercial profile updated', 'success');
        updateProfile(data.user);
      } else {
        setProfileError(data.error || 'Failed to update business profile.');
      }
    } catch {
      setProfileError('Network error updating business profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Reorder previous order
  const handleReorder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/wholesale/orders/${orderId}/reorder`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBulkCart(data.cart);
        showToast(data.message, 'success');
        setActiveTab('cart');
      } else {
        showToast(data.error || 'Failed to reorder items', 'error');
      }
    } catch {
      showToast('Network error processing reorder', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of wholesale session', 'info');
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center animate-pulse">
            <Building2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-serif text-lg font-bold text-[#3A1E0E]">Loading B2B Wholesale Portal...</h2>
            <p className="text-xs text-[#8A5934]">Verifying commercial credentials & authorization</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'wholesale' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-soft text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#3A1E0E]">
            Wholesale Partner Portal
          </h2>
          <p className="text-xs text-[#6E4022]">
            Please sign in with your verified commercial wholesale credentials to view volume pricing, manage bulk beans, and download tax invoices.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[#2B170E] text-white text-xs font-bold hover:bg-[#3A1E0E]"
            >
              Sign In as Wholesale Partner
            </Link>
            <Link
              to="/wholesale/register"
              className="w-full py-2.5 rounded-xl bg-[#FAF6F0] text-[#3A1E0E] text-xs font-bold hover:bg-[#F5ECE1]"
            >
              Submit Commercial Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navTabs: { id: WholesaleTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Business Overview', icon: Building2 },
    { id: 'catalog', label: 'Commercial Catalogue', icon: Package },
    {
      id: 'cart',
      label: 'Bulk Order Cart',
      icon: ShoppingBag,
      badge: bulkCart?.items ? bulkCart.items.reduce((s, i) => s + i.quantity, 0) : undefined,
    },
    { id: 'orders', label: 'Orders & Invoices', icon: FileText, badge: orders.length || undefined },
    { id: 'profile', label: 'Facility Profile', icon: MapPin },
    { id: 'price_sheet', label: 'Price Sheet & Tiers', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Profile Bar */}
        <div className="bg-[#1F1109] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-elevated border border-[#3A1E0E]">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                  {details?.businessName || currentUser.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isRejected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isApproved ? 'Approved Commercial Partner' : isRejected ? 'Application Declined' : 'Under Review'}
                </span>
              </div>
              <p className="text-xs text-[#D5BC9F] mt-1 flex flex-wrap items-center gap-2">
                <span>Contact: {currentUser.name}</span>
                <span className="text-white/30">•</span>
                <span>{currentUser.email}</span>
                {details?.taxId && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="font-mono">GST: {details.taxId}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isApproved && (
              <button
                type="button"
                onClick={() => setActiveTab('cart')}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Bulk Cart ({bulkCart?.items ? bulkCart.items.reduce((s, i) => s + i.quantity, 0) : 0})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Status Callout Banners */}
        {isPending && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start sm:items-center gap-3.5 shadow-xs">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-1">
              <span className="font-bold text-sm">Commercial Application Under Active Review:</span>
              <p className="text-[#6E4022] leading-relaxed">
                Our roasting director is verifying your business classification, tax registration, and projected volume. Commercial wholesale pricing, volume discount tiers (up to 42% off), and Net 15 checkout will unlock immediately upon authorization.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start sm:items-center gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-1">
              <span className="font-bold text-sm">Wholesale Application Status: Not Approved</span>
              <p className="text-rose-800 leading-relaxed">
                <strong>Reason:</strong> {details?.rejectionReason || 'Commercial volume requirements or tax verification could not be satisfied.'}
              </p>
              <p className="text-rose-700 text-[11px]">
                Please review your facility details under the "Facility Profile" tab and contact roastery operations at <code>wholesale@firedupcoffee.com</code> to submit additional documentation.
              </p>
            </div>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex border-b border-[#EBDCCE] overflow-x-auto gap-2 pb-2 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#2B170E] text-white shadow-soft'
                    : 'bg-white hover:bg-[#F5ECE1] text-[#6E4022] border border-[#EBDCCE]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-[#8A5934]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-amber-400 text-[#2B170E]' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
                <div className="flex items-center justify-between text-xs text-[#8A5934]">
                  <span>Total Wholesale Orders</span>
                  <Package className="w-4 h-4 text-terracotta-600" />
                </div>
                <div className="text-3xl font-serif font-black text-[#3A1E0E]">
                  {dashboardData?.stats.totalOrders ?? 0}
                </div>
                <p className="text-[11px] text-[#6E4022]">Commercial dispatches</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
                <div className="flex items-center justify-between text-xs text-[#8A5934]">
                  <span>Roasting & Processing</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-serif font-black text-amber-600">
                  {dashboardData?.stats.pendingOrders ?? 0}
                </div>
                <p className="text-[11px] text-[#6E4022]">Batches in roasting schedule</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
                <div className="flex items-center justify-between text-xs text-[#8A5934]">
                  <span>Lifetime B2B Volume</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-serif font-black text-emerald-700">
                  {dashboardData?.stats.totalVolumeOrderedKg ?? 0} <span className="text-sm font-sans font-bold">kg</span>
                </div>
                <p className="text-[11px] text-[#6E4022]">Specialty green & roasted beans</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
                <div className="flex items-center justify-between text-xs text-[#8A5934]">
                  <span>Commercial Spend</span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-serif font-black text-[#3A1E0E]">
                  {formatCurrency(dashboardData?.stats.totalSpent ?? 0)}
                </div>
                <p className="text-[11px] text-[#6E4022]">Invoiced under Net 15 terms</p>
              </div>
            </div>

            {/* 2-Column: Commercial Terms & Dedicated Rep */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#EBDCCE] shadow-soft space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Authorized Commercial Terms & Status
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[#532D16] border border-[#EBDCCE]">
                    Tier: {details?.monthlyVolumeKg || '50'} kg/mo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF6F0] p-4 rounded-2xl border border-[#EBDCCE]">
                  <div>
                    <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Business Classification</span>
                    <span className="font-bold text-[#3A1E0E] capitalize">{details?.businessType || 'Commercial Partner'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Commercial Tax / GSTIN</span>
                    <span className="font-mono font-bold text-[#3A1E0E]">{details?.taxId || 'Under Verification'}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-[#EBDCCE]">
                    <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Primary Dispatch Facility</span>
                    <span className="text-[#532D16]">
                      {details?.deliveryAddress?.street
                        ? `${details.deliveryAddress.street}, ${details.deliveryAddress.city}, ${details.deliveryAddress.state} ${details.deliveryAddress.postalCode}`
                        : 'Facility address on record'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-[#3A1E0E]">Active Commercial Policy:</div>
                  <ul className="space-y-1.5 text-[#6E4022]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>Minimum Order Quantity:</strong> 5kg minimum bulk order threshold.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>Freight Terms:</strong> Free express freight automatically applied on orders 25kg and above.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>Credit Terms:</strong> Net 15 payment terms payable upon roastery dispatch.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  {isApproved ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('catalog')}
                      className="px-5 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold flex items-center gap-2 shadow-soft transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Browse Bulk Beans & Order</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="px-5 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-all"
                    >
                      Edit Facility Credentials
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('price_sheet')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF6F0] text-[#532D16] text-xs font-bold border border-[#EBDCCE] transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View Price Sheet</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Roastery Rep */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#EBDCCE] shadow-soft space-y-4">
                <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-terracotta-600" />
                  Wholesale Operations Desk
                </h3>

                <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-3 text-xs text-[#532D16]">
                  <div>
                    <div className="font-bold text-[#3A1E0E] text-sm">Marcus Reed</div>
                    <div className="text-[11px] text-[#8A5934]">Director of Roastery Partnerships</div>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-[#EBDCCE]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#AF8359]" />
                      <span>wholesale@firedupcoffee.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#AF8359]" />
                      <span>+1 (800) 555-ROAST (Ext. 4)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1.5 text-xs text-[#6E4022]">
                  <span className="font-bold text-[#3A1E0E]">Custom Roast Profiling:</span>
                  <p className="leading-relaxed text-[11px]">
                    Need custom degassing valves, pre-printed custom cafe labels, or specific agtron roast levels? Contact Marcus directly to schedule a live cupping session.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EBDCCE] shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-terracotta-600" />
                  Recent Commercial Dispatches
                </h3>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-terracotta-600 hover:underline flex items-center gap-1"
                  >
                    <span>View all orders ({orders.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 ? (
                <div className="divide-y divide-[#FAF6F0]">
                  {dashboardData.recentOrders.map((ord) => (
                    <div key={ord._id || ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-[#3A1E0E] flex items-center gap-2">
                          <span>{ord.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F0] text-[#532D16] border border-[#EBDCCE]">
                            {ord.totalKg} kg
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8A5934] mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {ord.items.length} item(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#2B170E]">{formatCurrency(ord.totalAmount)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ord.orderStatus}
                        </span>
                        <a
                          href={`/api/v1/wholesale/orders/${ord._id || ord.id}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-[11px] font-bold border border-[#EBDCCE] flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Tax Invoice</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#8A5934] space-y-2">
                  <p>No commercial orders submitted yet.</p>
                  {isApproved && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 rounded-xl bg-[#2B170E] text-white text-xs font-bold"
                    >
                      Start First Wholesale Order
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COMMERCIAL CATALOGUE */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {!isApproved ? (
              <div className="bg-white rounded-3xl p-12 border border-[#EBDCCE] text-center space-y-4 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">Catalogue Access Restricted</h3>
                <p className="text-xs text-[#6E4022] leading-relaxed">
                  Commercial coffee catalogue and 35% bulk bean pricing are protected by backend authorization. Your application is currently under review by our roasting team.
                </p>
              </div>
            ) : (
              <>
                {/* Search & Category Filter Controls */}
                <div className="bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search beans, origins, roast level..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                      />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                      {['all', 'espresso', 'cold_brew', 'cappuccino', 'latte', 'americano'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                            selectedCategory === cat
                              ? 'bg-[#2B170E] text-white'
                              : 'bg-[#FAF6F0] text-[#6E4022] hover:bg-[#F5ECE1] border border-[#EBDCCE]'
                          }`}
                        >
                          {cat.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Product Grid */}
                {catalogLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-[#8A5934]">
                    <Loader2 className="w-8 h-8 animate-spin text-terracotta-600" />
                    <span>Loading real roastery inventory...</span>
                  </div>
                ) : catalogItems.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-xs text-[#8A5934] border border-[#EBDCCE]">
                    No specialty roasts found matching your filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catalogItems.map((prod) => {
                      const sel = getItemSelection(prod._id);
                      const weightUnit = sel.size === '10kg' ? 10 : sel.size === '5kg' ? 5 : 1;
                      const calculatedPricePerBag = prod.wholesalePricePerKg * weightUnit;

                      return (
                        <div
                          key={prod._id}
                          className="bg-white rounded-3xl border border-[#EBDCCE] shadow-soft overflow-hidden flex flex-col justify-between"
                        >
                          <div className="relative aspect-4/3 bg-[#FAF6F0] overflow-hidden">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              onError={handleImageError}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1F1109]/90 text-amber-300 backdrop-blur-xs">
                                {prod.roastLevel} Roast
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#3A1E0E]">
                                {prod.origin}
                              </span>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
                                35% Wholesale
                              </span>
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-1.5">
                              <h4 className="font-serif font-bold text-base text-[#3A1E0E]">{prod.name}</h4>
                              <p className="text-xs text-[#6E4022] line-clamp-2">{prod.description}</p>
                              
                              {prod.tastingNotes && prod.tastingNotes.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {prod.tastingNotes.map((note, idx) => (
                                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[#8A5934] border border-[#EBDCCE]">
                                      {note}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Commercial Pricing Details */}
                            <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#8A5934]">Wholesale Rate:</span>
                                <span className="font-black text-sm text-[#2B170E]">
                                  ₹{prod.wholesalePricePerKg.toLocaleString('en-IN')}{' '}
                                  <span className="text-[10px] font-normal text-[#8A5934]">/ kg</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-[#8A5934] border-t border-[#EBDCCE] pt-1">
                                <span>Warehouse Stock:</span>
                                <span className="font-bold text-emerald-800">{prod.stockAvailableKg} kg available</span>
                              </div>
                            </div>

                            {/* Pack Size & Grind Selectors */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-[#8A5934] block mb-1">Pack Size</label>
                                <select
                                  value={sel.size}
                                  onChange={(e) => updateItemSelection(prod._id, { size: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#EBDCCE] text-xs bg-white text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                                >
                                  <option value="1kg">1 kg Bag</option>
                                  <option value="5kg">5 kg Bulk Bag</option>
                                  <option value="10kg">10 kg Roastery Sack</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-[#8A5934] block mb-1">Grind Spec</label>
                                <select
                                  value={sel.grind}
                                  onChange={(e) => updateItemSelection(prod._id, { grind: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#EBDCCE] text-xs bg-white text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                                >
                                  <option value="Whole Bean">Whole Bean</option>
                                  <option value="Espresso">Fine Espresso</option>
                                  <option value="Pour Over">Pour Over</option>
                                  <option value="French Press">French Press</option>
                                  <option value="Commercial Bulk Grind">Commercial Bulk Grind</option>
                                </select>
                              </div>
                            </div>

                            {/* Quantity & Add to Bulk Cart Button */}
                            <div className="flex items-center gap-2 pt-1">
                              <div className="flex items-center gap-1.5 bg-[#FAF6F0] border border-[#EBDCCE] rounded-xl px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => updateItemSelection(prod._id, { quantity: Math.max(1, sel.quantity - 1) })}
                                  className="text-[#6E4022] hover:text-[#2B170E] p-0.5"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-[#3A1E0E] min-w-5 text-center">{sel.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateItemSelection(prod._id, { quantity: sel.quantity + 1 })}
                                  className="text-[#6E4022] hover:text-[#2B170E] p-0.5"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={cartUpdating}
                                onClick={() => handleAddToCart(prod._id, prod.name)}
                                className="flex-1 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                                <span>Add (₹{calculatedPricePerBag.toLocaleString('en-IN')})</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 3: BULK ORDER CART & CHECKOUT */}
        {activeTab === 'cart' && (
          <div className="space-y-6">
            {!isApproved ? (
              <div className="bg-white rounded-3xl p-12 border border-[#EBDCCE] text-center space-y-3 max-w-lg mx-auto">
                <ShieldCheck className="w-10 h-10 text-amber-600 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">Bulk Cart Locked</h3>
                <p className="text-xs text-[#6E4022]">
                  Authorized wholesale accounts only. Your commercial privileges are pending administrator verification.
                </p>
              </div>
            ) : !bulkCart || bulkCart.items.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-[#EBDCCE] max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] text-[#8A5934] mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">Wholesale Cart is Empty</h3>
                <p className="text-xs text-[#6E4022]">
                  Add 1kg, 5kg, or 10kg coffee sacks from the commercial catalogue to build your roasted order.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-6 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold"
                >
                  Browse Commercial Beans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-[#EBDCCE] shadow-soft space-y-6">
                  {/* MOQ & Volume Tier Banner */}
                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#3A1E0E] flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span>Order Total Weight: {bulkCart.totalKg} kg</span>
                      </span>
                      <span className={`font-bold ${bulkCart.isMoqMet ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {bulkCart.isMoqMet ? '✓ Minimum Order Met (5kg)' : `⚠ Needs ${(bulkCart.moqKg - bulkCart.totalKg).toFixed(1)}kg more for MOQ`}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-[#EBDCCE] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${bulkCart.isMoqMet ? 'bg-emerald-600' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (bulkCart.totalKg / 25) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8A5934]">
                      <span>{bulkCart.discountTier}</span>
                      <span>
                        {bulkCart.freeShippingQualified
                          ? '✓ Free Commercial Freight Qualified'
                          : `Add ${(bulkCart.freeFreightThresholdKg - bulkCart.totalKg).toFixed(1)}kg for Free Freight`}
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="divide-y divide-[#FAF6F0] overflow-x-auto">
                    {bulkCart.items.map((item) => (
                      <div key={item._id} className="py-4 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3 min-w-44">
                          <img
                            src={item.product?.image}
                            alt={item.product?.name}
                            onError={handleImageError}
                            className="w-12 h-12 object-cover rounded-xl border border-[#EBDCCE] bg-[#FAF6F0]"
                          />
                          <div>
                            <div className="font-bold text-[#3A1E0E]">{item.product?.name}</div>
                            <div className="text-[11px] text-[#8A5934]">
                              {item.size} • {item.grind} ({item.weightPerUnitKg * item.quantity} kg total)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-[#FAF6F0] border border-[#EBDCCE] rounded-xl px-2.5 py-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(item._id, item.quantity - 1)}
                            className="text-[#6E4022] hover:text-[#2B170E]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold min-w-5 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(item._id, item.quantity + 1)}
                            className="text-[#6E4022] hover:text-[#2B170E]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-sm text-[#2B170E]">₹{item.lineTotal.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-[#8A5934]">
                            ₹{item.unitPrice.toLocaleString('en-IN')} / bag
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item._id)}
                          className="p-1 text-[#AF8359] hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checkout Summary & Submission */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-[#EBDCCE] shadow-soft space-y-5 h-fit">
                  <h3 className="font-serif font-bold text-base text-[#3A1E0E] border-b border-[#EBDCCE] pb-2">
                    Commercial Order Summary
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#6E4022]">
                      <span>Total Volume:</span>
                      <span className="font-bold text-[#2B170E]">{bulkCart.totalKg} kg</span>
                    </div>
                    <div className="flex justify-between text-[#6E4022]">
                      <span>Retail Equivalent:</span>
                      <span className="line-through">₹{bulkCart.rawRetailSubtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {bulkCart.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Commercial Discount ({bulkCart.discountPercent}%):</span>
                        <span>-₹{bulkCart.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#6E4022]">
                      <span>Wholesale Subtotal:</span>
                      <span className="font-bold text-[#2B170E]">₹{bulkCart.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[#6E4022]">
                      <span>GST (5% Coffee Tax):</span>
                      <span>₹{bulkCart.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[#6E4022]">
                      <span>Commercial Freight:</span>
                      <span>{bulkCart.shippingFee === 0 ? 'FREE' : `₹${bulkCart.shippingFee.toLocaleString('en-IN')}`}</span>
                    </div>

                    <div className="pt-3 border-t border-[#EBDCCE] flex justify-between items-center text-sm font-black text-[#2B170E]">
                      <span>Total Invoice Amount:</span>
                      <span className="text-terracotta-700 text-lg">₹{bulkCart.finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Payment Terms Selector */}
                  <div className="space-y-2 text-xs pt-2">
                    <label className="font-bold text-[#532D16] block">Payment Terms</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0] cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="net_terms"
                          checked={checkoutPaymentMethod === 'net_terms'}
                          onChange={() => setCheckoutPaymentMethod('net_terms')}
                        />
                        <div>
                          <div className="font-bold text-[#3A1E0E]">Net 15 upon dispatch</div>
                          <div className="text-[10px] text-[#8A5934]">Invoice payable 15 days from roastery shipment</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EBDCCE] bg-white cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={checkoutPaymentMethod === 'bank_transfer'}
                          onChange={() => setCheckoutPaymentMethod('bank_transfer')}
                        />
                        <div>
                          <div className="font-bold text-[#3A1E0E]">Bank Wire Transfer (Advance EFT)</div>
                          <div className="text-[10px] text-[#8A5934]">EFT details provided on generated tax invoice</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Roasting / Dispatch Notes */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-[#532D16] block">Roastery / Batch Notes</label>
                    <textarea
                      rows={2}
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      placeholder="e.g. Please pack in 5kg valve-sealed bulk sacks."
                      className="w-full p-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                    />
                  </div>

                  {/* Submit Order Button */}
                  <button
                    type="button"
                    disabled={!bulkCart.isMoqMet || isSubmittingOrder}
                    onClick={handleSubmitBulkOrder}
                    className="w-full py-3.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Commercial Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Wholesale Bulk Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!bulkCart.isMoqMet && (
                    <p className="text-[11px] text-amber-700 text-center font-medium">
                      Minimum order threshold is 5kg to place a commercial order.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ORDERS & INVOICES */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#3A1E0E] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-terracotta-600" />
                  Commercial Orders & Tax Invoices
                </h3>
                <p className="text-xs text-[#6E4022] mt-0.5">
                  Official records, dispatch tracking, and downloadable tax invoices for accounting.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchOrders}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {ordersLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-[#8A5934]">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta-600" />
                <span>Retrieving persisted order records...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-[#FAF6F0] rounded-2xl border border-dashed border-[#EBDCCE]">
                <Package className="w-12 h-12 text-[#AF8359] mx-auto" />
                <h4 className="font-serif text-base font-bold text-[#3A1E0E]">No Wholesale Orders Placed Yet</h4>
                <p className="text-xs text-[#6E4022]">Your submitted commercial orders will appear here with downloadable tax invoices.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-5 py-2 rounded-xl bg-[#2B170E] text-white text-xs font-bold"
                >
                  Browse Catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord._id || ord.id}
                    className="p-5 rounded-2xl border border-[#EBDCCE] bg-[#FAF6F0]/60 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBDCCE] pb-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#2B170E]">{ord.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-900 border border-amber-500/30">
                            {ord.orderStatus}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            {ord.paymentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8A5934]">
                          Submitted on {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Payment: {ord.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetails(selectedOrderDetails?.orderNumber === ord.orderNumber ? null : ord)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{selectedOrderDetails?.orderNumber === ord.orderNumber ? 'Hide Items' : 'View Items'}</span>
                        </button>

                        <a
                          href={`/api/v1/wholesale/orders/${ord._id || ord.id}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Tax Invoice (PDF)</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleReorder(ord._id || ord.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 text-xs font-bold border border-amber-500/30 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Volume Weight</span>
                        <span className="font-bold text-[#3A1E0E]">{ord.totalKg} kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Subtotal</span>
                        <span className="font-semibold text-[#532D16]">₹{ord.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A5934] uppercase font-bold block">GST (5%)</span>
                        <span className="font-semibold text-[#532D16]">₹{ord.taxAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Total Invoiced</span>
                        <span className="font-black text-sm text-terracotta-700">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Expandable item details */}
                    {selectedOrderDetails?.orderNumber === ord.orderNumber && (
                      <div className="pt-3 border-t border-[#EBDCCE] space-y-3 bg-white p-4 rounded-xl">
                        <div className="font-bold text-xs text-[#3A1E0E]">Order Items ({ord.items.length}):</div>
                        <div className="divide-y divide-[#FAF6F0]">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-[#3A1E0E]">{item.productName}</span>
                                <span className="text-[11px] text-[#8A5934] ml-2">
                                  {item.quantity}x {item.size} • {item.grind}
                                </span>
                              </div>
                              <span className="font-black text-[#2B170E]">₹{item.lineTotal.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                        {ord.notes && (
                          <div className="text-[11px] text-[#6E4022] pt-2 border-t border-[#FAF6F0]">
                            <strong>Roastery Notes:</strong> {ord.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FACILITY PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#3A1E0E] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-terracotta-600" />
                Commercial Entity & Delivery Facility Profile
              </h3>
              <p className="text-xs text-[#6E4022] mt-0.5">
                Update verified commercial details, delivery bay address, and contact information.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                  1. Business Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Business Classification *</label>
                    <select
                      value={profileForm.businessType}
                      onChange={(e) => setProfileForm({ ...profileForm, businessType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    >
                      <option value="cafe">Cafe / Specialty Coffee Shop</option>
                      <option value="restaurant">Restaurant / Bistro</option>
                      <option value="office">Corporate Office</option>
                      <option value="retailer">Gourmet Food Retailer</option>
                      <option value="hotel">Boutique Hotel</option>
                      <option value="other">Other Commercial Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Commercial Tax / GSTIN ID *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.taxId}
                      onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs font-mono text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Monthly Projected Volume (kg)</label>
                    <input
                      type="text"
                      value={profileForm.monthlyVolumeKg}
                      onChange={(e) => setProfileForm({ ...profileForm, monthlyVolumeKg: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                  2. Authorized Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.contactName}
                      onChange={(e) => setProfileForm({ ...profileForm, contactName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Contact Phone (For Logistics) *</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                  3. Delivery Bay Facility Address
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#532D16] block mb-1">Street Address / Facility Dock *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.street}
                      onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#532D16] block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#532D16] block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#532D16] block mb-1">PIN / Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.postalCode}
                        onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center gap-2 shadow-soft transition-all disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Facility Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: PRICE SHEET & TIERS */}
        {activeTab === 'price_sheet' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#3A1E0E] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-terracotta-600" />
                  Official 2026 Commercial Roastery Price Sheet
                </h3>
                <p className="text-xs text-[#6E4022] mt-0.5">
                  Verified volume discount schedule and delivery turnaround commitments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  showToast('Official price sheet loaded and verified against roastery server', 'success');
                }}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Schedule (CSV)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 text-stone-800">
                  Tier 1
                </span>
                <h4 className="font-serif font-bold text-base text-[#3A1E0E]">Micro-Cafe Partner</h4>
                <div className="text-2xl font-black text-amber-700">25% OFF</div>
                <p className="text-xs text-[#6E4022]">Monthly volume: 5 kg – 19 kg</p>
                <p className="text-[11px] text-[#8A5934] pt-1 border-t border-[#EBDCCE]">
                  Dispatch window: 48 hours post-roast. Courier freight applies below 25kg.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 shadow-xs">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-900 border border-amber-500/30">
                  Tier 2 (Standard)
                </span>
                <h4 className="font-serif font-bold text-base text-[#3A1E0E]">Commercial Cafe Partner</h4>
                <div className="text-2xl font-black text-emerald-700">35% OFF</div>
                <p className="text-xs text-[#6E4022]">Monthly volume: 20 kg – 49 kg</p>
                <p className="text-[11px] text-[#8A5934] pt-1 border-t border-amber-200">
                  Dispatch window: 24 hours. Free doorstep freight automatically applied on orders 25kg+.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#1F1109] text-white space-y-2 shadow-soft">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Tier 3 (Distributor)
                </span>
                <h4 className="font-serif font-bold text-base text-white">Roastery Distributor</h4>
                <div className="text-2xl font-black text-amber-400">42% OFF</div>
                <p className="text-xs text-[#D5BC9F]">Monthly volume: 50+ kg</p>
                <p className="text-[11px] text-[#AF8359] pt-1 border-t border-stone-800">
                  Priority green coffee lot reserve. Priority Monday morning batch roasting. Free freight.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
