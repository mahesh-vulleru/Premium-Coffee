import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/pricing';
import type { CoffeeProduct } from '../types/coffee';
import {
  User as UserIcon,
  ShoppingBag,
  Heart,
  MapPin,
  Sparkles,
  Package,
  LogOut,
  Settings,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Coffee,
  Truck,
  ExternalLink,
  Mail,
  Eye,
  X,
  Compass,
  Flame,
  Box,
  Ban,
} from 'lucide-react';

type DashboardTab = 'overview' | 'profile' | 'orders' | 'wishlist' | 'subscriptions' | 'settings';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, logout, updateProfile } = useAuth();
  const {
    wishlist,
    cartCount,
    cartTotal,
    addToCart,
    toggleWishlist,
    setIsCartOpen,
    showToast,
  } = useCart();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Customer Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Order Cancellation State
  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Profile form state initialized from currentUser
  const [profileForm, setProfileForm] = useState(() => ({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    street: currentUser?.shippingAddress?.street || '',
    apartment: currentUser?.shippingAddress?.apartment || '',
    city: currentUser?.shippingAddress?.city || '',
    state: currentUser?.shippingAddress?.state || '',
    postalCode: currentUser?.shippingAddress?.postalCode || '',
    country: currentUser?.shippingAddress?.country || 'India',
  }));

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Address Country Confirmation State (for prompt when Indian state is paired with United States)
  const [isUpdatingCountry, setIsUpdatingCountry] = useState(false);

  // Newsletter State in Settings
  const [newsletterEmail, setNewsletterEmail] = useState(currentUser?.email || '');
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);
  const [isNewsletterLoading, setIsNewsletterLoading] = useState(false);

  // Sync profile form state whenever currentUser updates
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        street: currentUser.shippingAddress?.street || '',
        apartment: currentUser.shippingAddress?.apartment || '',
        city: currentUser.shippingAddress?.city || '',
        state: currentUser.shippingAddress?.state || '',
        postalCode: currentUser.shippingAddress?.postalCode || '',
        country: currentUser.shippingAddress?.country || 'India',
      });
      setNewsletterEmail(currentUser.email);
    }
  }, [currentUser]);

  // Load customer orders from server
  const fetchCustomerOrders = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'customer') return;
    setIsOrdersLoading(true);
    try {
      const res = await fetch('/api/v1/orders', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (err) {
      console.warn('[CustomerDashboard] Failed to fetch orders:', err);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [currentUser]);

  // Request order cancellation
  const handleCancelOrderSubmit = async () => {
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`/api/v1/orders/${cancellingOrder._id || cancellingOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Cancellation request submitted to roastery team', 'success');
        setCancellingOrder(null);
        setCancelReason('');
        fetchCustomerOrders();
        if (selectedOrder && (selectedOrder._id === cancellingOrder._id || selectedOrder.id === cancellingOrder.id)) {
          setSelectedOrder(data.order);
        }
      } else {
        showToast(data.error || 'Failed to submit cancellation request', 'error');
      }
    } catch {
      showToast('Error communicating with roastery server', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Load newsletter status
  const checkNewsletterStatus = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`/api/v1/newsletter/status?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.isSubscribed === 'boolean') {
          setIsNewsletterSubscribed(data.isSubscribed);
        }
      }
    } catch {
      // non-blocking
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'customer') {
      fetchCustomerOrders();
      checkNewsletterStatus();
    }
  }, [currentUser, fetchCustomerOrders, checkNewsletterStatus]);

  // Loading skeleton state while session is being verified
  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center animate-pulse">
            <Coffee className="w-8 h-8 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-serif text-lg font-bold text-[#3A1E0E]">Loading Customer Portal...</h2>
            <p className="text-xs text-[#8A5934]">Retrieving your specialty coffee profile & preferences</p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated guard
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-soft text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-terracotta-50 text-terracotta-600 mx-auto flex items-center justify-center shadow-inner">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-serif font-bold text-[#3A1E0E]">
              Customer Portal Access
            </h2>
            <p className="text-xs text-[#6E4022] leading-relaxed">
              Please sign in to view your roast order history, saved addresses, wishlist, and fresh batch dispatches.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/login?redirect=/dashboard/customer"
              className="w-full py-3 rounded-2xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register/customer"
              className="w-full py-3 rounded-2xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-all"
            >
              Create New Customer Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Role guard: if wholesale or admin, show friendly reroute
  if (currentUser.role !== 'customer') {
    const isWholesale = currentUser.role === 'wholesale';
    const targetPath = isWholesale ? '/dashboard/wholesale' : '/admin';
    const targetLabel = isWholesale ? 'Wholesale Partner Portal' : 'Admin Control Console';

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-soft text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-serif font-bold text-[#3A1E0E]">
              {currentUser.role === 'admin' ? 'Administrator Account Detected' : 'Wholesale Account Detected'}
            </h2>
            <p className="text-xs text-[#6E4022]">
              You are currently logged in as <span className="font-bold">{currentUser.email}</span> with{' '}
              <span className="font-bold uppercase tracking-wider text-terracotta-600">{currentUser.role}</span> privileges.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to={targetPath}
              className="w-full py-3 rounded-2xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Go to {targetLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full py-3 rounded-2xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-all"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    showToast('Signed out of session successfully', 'info');
    navigate('/');
  };

  // Form Validation & Submission for Profile / Address
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    // Strict Client Validation
    if (!profileForm.name || profileForm.name.trim().length < 2) {
      setProfileErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (!profileForm.phone || profileForm.phone.trim().length < 7) {
      setProfileErrorMsg('Please provide a valid contact phone number (at least 7 characters).');
      return;
    }
    if (!profileForm.street || profileForm.street.trim().length < 2) {
      setProfileErrorMsg('Street address is required.');
      return;
    }
    if (!profileForm.city || profileForm.city.trim().length < 2) {
      setProfileErrorMsg('City is required.');
      return;
    }
    if (!profileForm.state || profileForm.state.trim().length < 2) {
      setProfileErrorMsg('State / Province is required.');
      return;
    }
    if (!profileForm.postalCode || profileForm.postalCode.trim().length < 3) {
      setProfileErrorMsg('Valid Postal / PIN code is required.');
      return;
    }

    setIsSavingProfile(true);

    const result = await updateProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      shippingAddress: {
        street: profileForm.street.trim(),
        apartment: profileForm.apartment ? profileForm.apartment.trim() : '',
        city: profileForm.city.trim(),
        state: profileForm.state.trim(),
        postalCode: profileForm.postalCode.trim(),
        country: profileForm.country.trim() || 'India',
      },
    });

    setIsSavingProfile(false);

    if (result.success) {
      setProfileSuccessMsg('Your delivery profile has been saved successfully!');
      showToast('Profile updated successfully', 'success');
    } else {
      setProfileErrorMsg(result.error || 'Failed to update profile details.');
    }
  };

  // Customer One-Click Confirmation to update Country to India when Indian address detected with USA
  const handleConfirmCountryAsIndia = async () => {
    if (!currentUser.shippingAddress) return;
    setIsUpdatingCountry(true);
    const result = await updateProfile({
      shippingAddress: {
        ...currentUser.shippingAddress,
        country: 'India',
      },
    });
    setIsUpdatingCountry(false);
    if (result.success) {
      showToast('Delivery country updated to India successfully', 'success');
    } else {
      showToast('Failed to update delivery country', 'error');
    }
  };

  // Handle Newsletter Subscribe in Account Settings
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setIsNewsletterLoading(true);
    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim(), source: 'customer_dashboard' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsNewsletterSubscribed(true);
        showToast(data.message || 'Subscribed to Roaster Club Newsletter!', 'success');
      } else if (res.status === 409) {
        setIsNewsletterSubscribed(true);
        showToast('You are already enrolled in the Roaster Club Newsletter.', 'info');
      } else {
        showToast(data.error || 'Failed to enroll in newsletter.', 'error');
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsNewsletterLoading(false);
    }
  };

  // Detect whether saved address is in an Indian state while country is United States / USA
  const savedState = currentUser.shippingAddress?.state?.toLowerCase() || '';
  const savedCountry = currentUser.shippingAddress?.country || '';
  const isIndianAddressWithUsaCountry =
    (savedState.includes('andhra') ||
      savedState.includes('palnadu') ||
      savedState.includes('telangana') ||
      savedState.includes('karnataka') ||
      savedState.includes('tamil') ||
      savedState.includes('maharashtra') ||
      currentUser.shippingAddress?.postalCode === '522415') &&
    (savedCountry.toLowerCase() === 'united states' || savedCountry.toLowerCase() === 'usa');

  // Most recent active order
  const activeOrder = orders.find((o) =>
    ['received', 'processing', 'roasting', 'dispatched'].includes(o.orderStatus)
  );

  const memberSinceYear = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '2026';

  const navItems: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Coffee },
    { id: 'profile', label: 'Profile & Delivery', icon: MapPin },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'Saved Roasts', icon: Heart },
    { id: 'subscriptions', label: 'Coffee Subscriptions', icon: RefreshCw },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-elevated border border-[#3A1E0E]">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-terracotta-500 to-amber-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold font-serif shadow-md border border-white/20 flex-shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
                  Welcome back, {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-terracotta-500/20 text-terracotta-300 border border-terracotta-500/30">
                  Customer Member
                </span>
              </div>
              <p className="text-xs text-[#D5BC9F] flex items-center gap-2">
                <span>{currentUser.email}</span>
                <span className="text-white/30">•</span>
                <span>Member since {memberSinceYear}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/shop"
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Roasts</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-200 text-xs font-bold border border-red-800/30 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs Pills (Horizontal Scroll) */}
        <div className="flex lg:hidden overflow-x-auto pb-2 gap-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#2B170E] text-white shadow-soft'
                    : 'bg-white text-[#6E4022] border border-[#EBDCCE] hover:bg-[#FAF6F0]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-terracotta-400' : 'text-[#8A5934]'}`} />
                <span>{item.label}</span>
                {item.id === 'wishlist' && wishlist.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-terracotta-600 text-white' : 'bg-terracotta-100 text-terracotta-800'}`}>
                    {wishlist.length}
                  </span>
                )}
                {item.id === 'orders' && orders.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-terracotta-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {orders.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dashboard Content Grid: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 sticky top-24">
            <div className="bg-white rounded-3xl p-4 border border-[#EBDCCE] shadow-soft space-y-1">
              <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#8A5934]">
                Customer Menu
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-[#2B170E] text-white shadow-soft'
                        : 'text-[#532D16] hover:bg-[#FAF6F0] hover:text-[#2B170E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-terracotta-400' : 'text-[#8A5934]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'wishlist' && wishlist.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-terracotta-600 text-white' : 'bg-[#FAF6F0] text-terracotta-700 border border-[#EBDCCE]'}`}>
                        {wishlist.length}
                      </span>
                    )}
                    {item.id === 'orders' && orders.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-terracotta-600 text-white' : 'bg-[#FAF6F0] text-amber-800 border border-[#EBDCCE]'}`}>
                        {orders.length}
                      </span>
                    )}
                    {item.id === 'overview' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Roaster Support Card */}
            <div className="bg-gradient-to-br from-[#FAF6F0] to-[#F5ECE1] rounded-3xl p-5 border border-[#EBDCCE] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#3A1E0E]">
                <Truck className="w-4 h-4 text-terracotta-600" />
                <span>Fresh Roast Guarantee</span>
              </div>
              <p className="text-[11px] text-[#6E4022] leading-relaxed">
                All single-origins & blends are roasted to order and dispatched with degassing aroma valves.
              </p>
              <div className="pt-1">
                <Link
                  to="/shop"
                  className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
                >
                  <span>Explore Harvest Lot</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Tab Content */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#8A5934]">
                      <span>Active Cart</span>
                      <ShoppingBag className="w-4 h-4 text-terracotta-600" />
                    </div>
                    <div className="text-2xl font-black text-[#3A1E0E]">
                      {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                    </div>
                    <p className="text-[11px] text-[#6E4022] font-semibold">
                      {cartCount > 0 ? `Subtotal: ${formatCurrency(cartTotal)}` : 'Cart is currently empty'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="text-[11px] text-terracotta-600 hover:underline font-bold flex items-center gap-1 pt-1"
                    >
                      <span>Open cart drawer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#8A5934]">
                      <span>Saved Roasts</span>
                      <Heart className="w-4 h-4 text-terracotta-500" />
                    </div>
                    <div className="text-2xl font-black text-[#3A1E0E]">
                      {wishlist.length} {wishlist.length === 1 ? 'Roast' : 'Roasts'}
                    </div>
                    <p className="text-[11px] text-[#6E4022] font-semibold">
                      {wishlist.length > 0 ? 'Saved in your personal cellar' : 'No saved roasts yet'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('wishlist')}
                      className="text-[11px] text-terracotta-600 hover:underline font-bold flex items-center gap-1 pt-1"
                    >
                      <span>View saved items</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Roaster Club Rewards — Honest Status */}
                  <div className="p-5 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#8A5934]">
                      <span>Roaster Club Rewards</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-lg font-bold text-[#3A1E0E] flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E4022] leading-relaxed">
                      Earn 1 Bean per ₹10 spent on fresh roasts. Automated loyalty credits will unlock next season.
                    </p>
                  </div>
                </div>

                {/* 2-Column: Saved Address + Roast Dispatch Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Default Delivery Address Card */}
                  <div className="bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-terracotta-600" />
                        Default Delivery Address
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="text-xs font-bold text-terracotta-600 hover:underline"
                      >
                        Edit Address →
                      </button>
                    </div>

                    {currentUser.shippingAddress?.street ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#532D16] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#3A1E0E] text-sm">{currentUser.name}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-700 bg-terracotta-100/70 px-2 py-0.5 rounded border border-terracotta-200">
                              Primary
                            </span>
                          </div>
                          {currentUser.phone && (
                            <div className="text-xs text-[#6E4022] font-medium">{currentUser.phone}</div>
                          )}
                          <div className="pt-1 text-[#2B170E] font-medium leading-relaxed">
                            {currentUser.shippingAddress.street}
                          </div>
                          {currentUser.shippingAddress.apartment && (
                            <div className="text-[#6E4022]">{currentUser.shippingAddress.apartment}</div>
                          )}
                          <div className="text-[#3A1E0E]">
                            {currentUser.shippingAddress.city}, {currentUser.shippingAddress.state}
                            {currentUser.shippingAddress.postalCode ? ` - ${currentUser.shippingAddress.postalCode}` : ''}
                          </div>
                          <div className="text-[#8A5934] font-bold pt-0.5">
                            {currentUser.shippingAddress.country}
                          </div>
                        </div>

                        {/* Customer Confirmation Banner if Indian State has USA Country saved */}
                        {isIndianAddressWithUsaCountry && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-bold">
                                  Delivery Address Confirmation Needed
                                </p>
                                <p className="text-[11px] text-amber-900 leading-relaxed">
                                  Your saved address is located in <strong>{currentUser.shippingAddress?.state}</strong> (PIN {currentUser.shippingAddress?.postalCode}), but the country on record is <strong>"{currentUser.shippingAddress?.country}"</strong>. Would you like to confirm updating the country to <strong>India</strong>?
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                disabled={isUpdatingCountry}
                                onClick={handleConfirmCountryAsIndia}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                              >
                                {isUpdatingCountry ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Updating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Confirm Country as India</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-dashed border-[#EBDCCE] text-center space-y-2">
                        <p className="text-xs text-[#8A5934]">No delivery address saved yet.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('profile')}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#EBDCCE] text-xs font-bold text-[#3A1E0E] hover:bg-white/80"
                        >
                          Add Address Now
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-[#8A5934]">
                      Fast and tamper-proof doorstep delivery across India on orders over {formatCurrency(999)}.
                    </p>
                  </div>

                  {/* Real Live Roast Dispatch Notification */}
                  <div className="bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                          <Package className="w-4 h-4 text-terracotta-600" />
                          Live Roaster Dispatch
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          activeOrder
                            ? 'text-terracotta-700 bg-terracotta-50 border-terracotta-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}>
                          {activeOrder ? activeOrder.orderStatus : 'Roastery Active'}
                        </span>
                      </div>

                      {activeOrder ? (
                        <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-[#3A1E0E]">
                            <span className="font-mono">{activeOrder.orderNumber}</span>
                            <span className="text-[10px] uppercase text-terracotta-600 bg-terracotta-100 px-2 py-0.5 rounded">
                              {activeOrder.orderStatus}
                            </span>
                          </div>
                          <p className="text-[#6E4022]">
                            Placed on {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })} • {activeOrder.items?.length} {activeOrder.items?.length === 1 ? 'item' : 'items'} ({formatCurrency(activeOrder.totalAmount)})
                          </p>
                          {activeOrder.orderStatus === 'dispatched' ? (
                            <p className="text-emerald-700 font-medium text-[11px] pt-1">
                              Dispatched with express courier. Tracking updates are active.
                            </p>
                          ) : (
                            <p className="text-[#8A5934] text-[11px] pt-1">
                              Batch currently scheduled in drum roasting queue.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#6E4022] leading-relaxed">
                          No active roast batches currently in transit for your account. When you place an order, live roast status, batch updates, and courier dispatch tracking will display right here.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <Link
                        to="/shop"
                        className="flex-1 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        <span>Order Fresh Roast</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setActiveTab('subscriptions')}
                        className="flex-1 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-all text-center"
                      >
                        View Subscriptions
                      </button>
                    </div>
                  </div>
                </div>

                {/* Roaster Quality Standard Banner */}
                <div className="bg-gradient-to-r from-[#2B170E] to-[#4A2411] text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-serif text-lg font-bold">Firedup Coffee Quality Promise</h4>
                    <p className="text-xs text-[#D5BC9F] max-w-xl">
                      Each batch is roasted on our drum roaster in artisanal micro-lots and shipped within 48 hours with single-way degassing valves to preserve aromatic peak freshness.
                    </p>
                  </div>
                  <Link
                    to="/our-story"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>Our Sourcing Story</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE & DELIVERY ADDRESS */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#3A1E0E] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-terracotta-600" />
                    Personal Profile & Delivery Address
                  </h2>
                  <p className="text-xs text-[#6E4022] mt-1">
                    Manage your verified name, contact phone number, and default delivery address for instant checkout.
                  </p>
                </div>

                {/* Alerts */}
                {profileSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}
                {profileErrorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  {/* Personal Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                      1. Contact Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="text-xs font-bold text-[#532D16] block mb-1">
                          Full Name *
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="Your Name"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="text-xs font-bold text-[#532D16] block mb-1">
                          Email Address (Account Identifier)
                        </label>
                        <input
                          id="email"
                          type="email"
                          disabled
                          value={currentUser.email}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#8A5934] bg-[#FAF6F0]/60 cursor-not-allowed"
                        />
                        <span className="text-[10px] text-[#8A5934]">Email cannot be changed directly for security.</span>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="phone" className="text-xs font-bold text-[#532D16] block mb-1">
                          Phone Number (For Delivery Coordination) *
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Section */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                      2. Default Shipping Address
                    </h3>
                    
                    <div>
                      <label htmlFor="street" className="text-xs font-bold text-[#532D16] block mb-1">
                        Street Address *
                      </label>
                      <input
                        id="street"
                        type="text"
                        required
                        value={profileForm.street}
                        onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                        placeholder="House / Flat No., Village / Colony, Street"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="apartment" className="text-xs font-bold text-[#532D16] block mb-1">
                          Apartment / Suite / Landmark (Optional)
                        </label>
                        <input
                          id="apartment"
                          type="text"
                          value={profileForm.apartment}
                          onChange={(e) => setProfileForm({ ...profileForm, apartment: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="Near Main Bus Stand"
                        />
                      </div>

                      <div>
                        <label htmlFor="city" className="text-xs font-bold text-[#532D16] block mb-1">
                          City / Town *
                        </label>
                        <input
                          id="city"
                          type="text"
                          required
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="e.g. Gurzala / Bengaluru"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="state" className="text-xs font-bold text-[#532D16] block mb-1">
                          State / Province *
                        </label>
                        <input
                          id="state"
                          type="text"
                          required
                          value={profileForm.state}
                          onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="e.g. Andhra Pradesh"
                        />
                      </div>

                      <div>
                        <label htmlFor="postalCode" className="text-xs font-bold text-[#532D16] block mb-1">
                          Postal / PIN Code *
                        </label>
                        <input
                          id="postalCode"
                          type="text"
                          required
                          value={profileForm.postalCode}
                          onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="522415"
                        />
                      </div>

                      <div>
                        <label htmlFor="country" className="text-xs font-bold text-[#532D16] block mb-1">
                          Country *
                        </label>
                        <select
                          id="country"
                          value={profileForm.country}
                          onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Delivery Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#3A1E0E] flex items-center gap-2">
                      <Package className="w-5 h-5 text-terracotta-600" />
                      Roastery Order History ({orders.length})
                    </h2>
                    <p className="text-xs text-[#6E4022] mt-0.5">
                      View all past shipments, batch roasting records, and doorstep deliveries.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={fetchCustomerOrders}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isOrdersLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                    <Link
                      to="/shop"
                      className="text-xs font-bold text-terracotta-600 hover:underline flex items-center gap-1"
                    >
                      <span>Explore Roasts</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {isOrdersLoading ? (
                  <div className="py-16 text-center text-xs text-[#8A5934] flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-terracotta-600" />
                    <span>Loading your roastery orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  /* Honest Empty State */
                  <div className="py-12 px-4 rounded-3xl bg-[#FAF6F0] border border-dashed border-[#EBDCCE] text-center max-w-lg mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-white text-[#8A5934] mx-auto flex items-center justify-center shadow-soft">
                      <Package className="w-8 h-8 text-terracotta-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">
                        No Roastery Orders Placed Yet
                      </h3>
                      <p className="text-xs text-[#6E4022] leading-relaxed">
                        You haven't placed an order yet. Select from our artisanal single-origin harvest micro-lots or espresso blends, and we will roast fresh for your delivery.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                      <Link
                        to="/shop"
                        className="px-6 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-soft"
                      >
                        Explore Fresh Roasts
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsCartOpen(true)}
                        className="px-6 py-2.5 rounded-xl bg-white hover:bg-white/80 text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-all"
                      >
                        View Cart ({cartCount})
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const isEligibleForCancel =
                        ['received', 'processing'].includes(ord.orderStatus) &&
                        ord.cancellationStatus !== 'requested' &&
                        ord.cancellationStatus !== 'cancelled' &&
                        ord.orderStatus !== 'cancelled';
                      const isCancelRequested = ord.cancellationStatus === 'requested';

                      return (
                        <div
                          key={ord._id || ord.id}
                          className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-3 hover:border-terracotta-300 transition-colors"
                        >
                          {/* Cancellation Status Banner */}
                          {ord.cancellationStatus && ord.cancellationStatus !== 'none' && (
                            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              ord.cancellationStatus === 'requested'
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : ord.cancellationStatus === 'approved' || ord.cancellationStatus === 'cancelled'
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-stone-100 border-stone-300 text-stone-800'
                            }`}>
                              <div className="flex items-center gap-1.5 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {ord.cancellationStatus === 'requested' && 'Cancellation requested — Roastery team reviewing'}
                                  {ord.cancellationStatus === 'approved' && 'Cancellation approved — Refund pending'}
                                  {ord.cancellationStatus === 'rejected' && `Cancellation declined: ${ord.cancellationDecisionReason || 'Fulfillment already underway'}`}
                                  {ord.cancellationStatus === 'cancelled' && 'Order has been cancelled'}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80">
                                {ord.cancellationStatus}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBDCCE] pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#2B170E] text-sm">
                                  {ord.orderNumber}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  ord.orderStatus === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : ord.orderStatus === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {ord.orderStatus}
                                </span>
                                <span className="text-[10px] font-bold uppercase text-stone-500">
                                  {ord.paymentStatus}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#8A5934] mt-0.5 block">
                                Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-[#2B170E] block">
                                  {formatCurrency(ord.totalAmount)}
                                </span>
                                <span className="text-[10px] text-[#8A5934]">
                                  {ord.items?.length} {ord.items?.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-white/80 border border-[#EBDCCE] text-xs font-bold text-[#3A1E0E] flex items-center gap-1 shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details & Timeline</span>
                              </button>
                            </div>
                          </div>

                          {/* Tracking Banner if in transit */}
                          {ord.trackingNumber && (
                            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <span className="font-bold">{ord.courierName || 'Courier'}: {ord.trackingNumber}</span>
                                  {ord.estimatedDeliveryDate && (
                                    <span className="text-[10px] text-blue-700 ml-2">Est. Delivery: {ord.estimatedDeliveryDate}</span>
                                  )}
                                </div>
                              </div>
                              {ord.trackingUrl && (
                                <a
                                  href={ord.trackingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-blue-700 transition-colors"
                                >
                                  <span>Track Package</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Order Items Preview */}
                          <div className="divide-y divide-[#EBDCCE]/60 text-xs">
                            {ord.items?.map((item: any, idx: number) => (
                              <div key={idx} className="py-2 flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-[#3A1E0E]">{item.productName}</span>
                                  <span className="text-[11px] text-[#8A5934] ml-2">
                                    {item.quantity}x {item.size} • {item.grind}
                                  </span>
                                </div>
                                <span className="font-semibold text-[#2B170E]">
                                  {formatCurrency(item.lineTotal)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Cancellation Controls & Ineligibility Messages */}
                          <div className="pt-2 border-t border-[#EBDCCE]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              {isEligibleForCancel && (
                                <span className="text-[11px] text-amber-800 font-medium">
                                  Eligible for cancellation before roast scheduling begins.
                                </span>
                              )}
                              {!isEligibleForCancel && ord.orderStatus === 'roasting' && (
                                <span className="text-[11px] text-[#8A5934] italic">
                                  Cancellation unavailable: Batch is actively roasting in the roastery drum.
                                </span>
                              )}
                              {!isEligibleForCancel && ord.orderStatus === 'packed' && (
                                <span className="text-[11px] text-[#8A5934] italic">
                                  Cancellation unavailable: Coffee has been freshly sealed and packed for dispatch.
                                </span>
                              )}
                              {!isEligibleForCancel && ord.orderStatus === 'dispatched' && (
                                <span className="text-[11px] text-[#8A5934] italic">
                                  Cancellation unavailable: Coffee shipment is in transit with courier.
                                </span>
                              )}
                              {!isEligibleForCancel && ord.orderStatus === 'delivered' && (
                                <span className="text-[11px] text-emerald-800 font-medium">
                                  Delivered to doorstep. Reach out to roastery care for returns or support.
                                </span>
                              )}
                              {ord.orderStatus === 'cancelled' && (
                                <span className="text-[11px] text-rose-800 font-medium">
                                  Order has been cancelled.
                                </span>
                              )}
                              {isCancelRequested && (
                                <span className="text-[11px] text-amber-800 font-medium">
                                  Cancellation request pending admin review.
                                </span>
                              )}
                            </div>

                            {isEligibleForCancel && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingOrder(ord);
                                  setCancelReason('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Cancel Order</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#3A1E0E] flex items-center gap-2">
                      <Heart className="w-5 h-5 text-terracotta-500" />
                      Saved Roasts & Favorites ({wishlist.length})
                    </h2>
                    <p className="text-xs text-[#6E4022] mt-0.5">
                      Your hand-picked specialty coffees saved for easy reordering and discovery.
                    </p>
                  </div>
                  {wishlist.length > 0 && (
                    <Link
                      to="/shop"
                      className="text-xs font-bold text-terracotta-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                      <span>Explore Roasts</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((coffee: CoffeeProduct) => (
                      <div
                        key={coffee.id}
                        className="rounded-2xl border border-[#EBDCCE] bg-[#FAF6F0] p-4 flex flex-col justify-between space-y-3 group hover:border-terracotta-300 transition-all shadow-soft"
                      >
                        <div className="space-y-2">
                          <Link
                            to={`/product/${coffee.id}`}
                            className="block aspect-[4/3] rounded-xl overflow-hidden bg-white relative group/img"
                            title="View roast details"
                          >
                            <img
                              src={coffee.image}
                              alt={coffee.name}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2B170E]/80 text-white backdrop-blur-sm">
                              {coffee.roastLevel}
                            </span>
                          </Link>

                          <div>
                            <div className="text-[11px] font-bold text-terracotta-600 uppercase tracking-wider">
                              {coffee.origin}
                            </div>
                            <Link
                              to={`/product/${coffee.id}`}
                              className="font-serif font-bold text-sm text-[#3A1E0E] hover:text-terracotta-600 line-clamp-1 transition-colors block"
                            >
                              {coffee.name}
                            </Link>
                            <p className="text-xs font-bold text-[#2B170E] mt-0.5">
                              {formatCurrency(coffee.price)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(coffee, 1, 'Whole Bean', '250g');
                              showToast(`Added ${coffee.name} to cart`, 'success');
                            }}
                            className="flex-1 py-2 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-soft"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(coffee)}
                            className="p-2 rounded-xl bg-white border border-[#EBDCCE] hover:bg-rose-50 text-[#8A5934] hover:text-rose-600 transition-colors"
                            title="Remove from saved"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-4 rounded-3xl bg-[#FAF6F0] border border-dashed border-[#EBDCCE] text-center max-w-lg mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-white text-[#8A5934] mx-auto flex items-center justify-center shadow-soft">
                      <Heart className="w-8 h-8 text-terracotta-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">
                        Your Wishlist is Empty
                      </h3>
                      <p className="text-xs text-[#6E4022] leading-relaxed">
                        Tap the heart icon on any micro-lot or espresso blend to save your favorite roasts for future orders.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link
                        to="/shop"
                        className="px-6 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-soft inline-flex items-center gap-2"
                      >
                        <span>Discover Artisanal Roasts</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SUBSCRIPTIONS */}
            {activeTab === 'subscriptions' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#3A1E0E] flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-terracotta-600" />
                      Recurring Coffee Club Subscriptions
                    </h2>
                    <p className="text-xs text-[#6E4022] mt-0.5">
                      Automated recurring shipments direct to your door.
                    </p>
                  </div>
                </div>

                {/* Honest Integration Notice */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[#3A1E0E]">
                      Automated Recurring Billing Integration in Progress
                    </div>
                    <p className="text-[#6E4022] leading-relaxed">
                      Recurring subscription billing is currently completing PCI-compliant gateway certification with our banking partner. Recurring charges are temporarily unavailable.
                    </p>
                    <p className="text-[#6E4022] leading-relaxed">
                      You can continue enjoying our freshly roasted micro-lots on-demand with free doorstep delivery over {formatCurrency(999)}!
                    </p>
                  </div>
                </div>

                {/* Subscription Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-xs">
                      15%
                    </div>
                    <div className="font-bold text-xs text-[#3A1E0E]">15% Off Every Shipment</div>
                    <p className="text-[11px] text-[#6E4022]">
                      Subscribers will receive guaranteed preferential pricing on every recurring roast.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-[#3A1E0E]">Free Priority Courier</div>
                    <p className="text-[11px] text-[#6E4022]">
                      Complimentary tracked express shipping directly to your doorstep.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-[#3A1E0E]">Full Roaster Flexibility</div>
                    <p className="text-[11px] text-[#6E4022]">
                      Pause shipments, adjust grind sizes, or switch frequency anytime with zero penalty.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center sm:text-left">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>Order Fresh Roast On-Demand</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 6: ACCOUNT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                
                {/* Account Credentials & Role */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-4">
                  <h2 className="font-serif text-xl font-bold text-[#3A1E0E] flex items-center gap-2">
                    <Settings className="w-5 h-5 text-terracotta-600" />
                    Account Credentials & Security
                  </h2>
                  
                  <div className="divide-y divide-[#FAF6F0] text-xs">
                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-[#532D16]">Account ID</span>
                      <span className="font-mono text-[#8A5934]">{currentUser.id || 'N/A'}</span>
                    </div>

                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-[#532D16]">Primary Email</span>
                      <span className="text-[#3A1E0E] font-medium">{currentUser.email}</span>
                    </div>

                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-[#532D16]">Account Role</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-terracotta-50 text-terracotta-700 border border-terracotta-200 self-start sm:self-auto">
                        Customer Member
                      </span>
                    </div>

                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-[#532D16]">Registered Date</span>
                      <span className="text-[#8A5934]">{memberSinceYear}</span>
                    </div>
                  </div>
                </div>

                {/* Newsletter & Roaster Tasting Notes Enrollment */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-[#3A1E0E] flex items-center gap-2">
                      <Mail className="w-5 h-5 text-terracotta-600" />
                      Roaster Club Newsletter & Micro-Lot Alerts
                    </h3>
                    <p className="text-xs text-[#6E4022]">
                      Consent-based notifications for secret harvest lot drops, cupping scorecards, and roaster brew guides.
                    </p>
                  </div>

                  {isNewsletterSubscribed ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <strong>Enrolled in Roaster Club Newsletter!</strong>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Tasting notes and seasonal harvest alerts are sent to <strong>{currentUser.email}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="email"
                          required
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder="Your email address"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                        />
                        <button
                          type="submit"
                          disabled={isNewsletterLoading}
                          className="px-6 py-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-soft disabled:opacity-50"
                        >
                          {isNewsletterLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Enrolling...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Enroll in Newsletter</span>
                            </>
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-[#8A5934] block">
                        We respect your privacy. You can unsubscribe at any time.
                      </span>
                    </form>
                  )}
                </div>

                {/* Session Sign Out Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-soft space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-red-950 flex items-center gap-2">
                      <LogOut className="w-5 h-5 text-red-600" />
                      Session & Authentication
                    </h3>
                    <p className="text-xs text-[#6E4022] mt-0.5">
                      Signing out will securely clear your session authentication tokens from this browser.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-soft flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Firedup Coffee</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Customer Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white rounded-3xl p-6 space-y-5 shadow-2xl border border-[#EBDCCE] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EBDCCE] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-[#3A1E0E]">
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedOrder.orderStatus === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : selectedOrder.orderStatus === 'cancelled'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-[#8A5934] mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-[#8A5934] hover:text-[#3A1E0E] hover:bg-[#FAF6F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Cancellation Status Banner */}
              {selectedOrder.cancellationStatus && selectedOrder.cancellationStatus !== 'none' && (
                <div className={`p-3 rounded-xl border space-y-1 ${
                  selectedOrder.cancellationStatus === 'requested'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : selectedOrder.cancellationStatus === 'approved' || selectedOrder.cancellationStatus === 'cancelled'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-stone-100 border-stone-300 text-stone-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      Cancellation Status: {selectedOrder.cancellationStatus}
                    </span>
                    {selectedOrder.cancellationRequestedAt && (
                      <span className="text-[10px] opacity-75">
                        {new Date(selectedOrder.cancellationRequestedAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                  {selectedOrder.cancellationReason && (
                    <p className="text-[11px]">Reason: "{selectedOrder.cancellationReason}"</p>
                  )}
                  {selectedOrder.cancellationDecisionReason && (
                    <p className="text-[11px] font-medium">Roastery Decision Note: {selectedOrder.cancellationDecisionReason}</p>
                  )}
                </div>
              )}

              {/* Order Status Timeline */}
              <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#EBDCCE] space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8A5934] block">
                  Roastery Fulfillment Timeline
                </span>
                {selectedOrder.orderStatus === 'cancelled' ? (
                  <div className="flex items-center gap-3 p-3 bg-rose-100/70 rounded-xl border border-rose-200 text-rose-900">
                    <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block">Order Cancelled</span>
                      <span className="text-[11px] text-rose-800">
                        {selectedOrder.paymentStatus === 'refund_pending'
                          ? 'Inventory restored to stock. Refund processing with accounts.'
                          : 'Order was cancelled before roast production.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {[
                      { key: 'received', label: 'Received', icon: Clock },
                      { key: 'processing', label: 'Processing', icon: Package },
                      { key: 'roasting', label: 'Roasting', icon: Flame },
                      { key: 'packed', label: 'Packed', icon: Box },
                      { key: 'dispatched', label: 'Dispatched', icon: Truck },
                    ].map((step) => {
                      const stages = ['received', 'processing', 'roasting', 'packed', 'dispatched', 'delivered'];
                      const currentIdx = stages.indexOf(selectedOrder.orderStatus);
                      const stepIdx = stages.indexOf(step.key);
                      const isComplete = currentIdx >= stepIdx;
                      const isCurrent = currentIdx === stepIdx;
                      const IconComp = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isCurrent
                                ? 'bg-terracotta-600 text-white ring-4 ring-terracotta-200 shadow-xs'
                                : isComplete
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-200 text-stone-400'
                            }`}
                          >
                            {isComplete && !isCurrent ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <IconComp className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 font-bold leading-tight ${
                              isCurrent
                                ? 'text-terracotta-700'
                                : isComplete
                                ? 'text-emerald-800'
                                : 'text-stone-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Courier & Tracking Details */}
              {selectedOrder.trackingNumber && (
                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-700" />
                      <span className="font-bold text-xs">Tracking Information</span>
                    </div>
                    {selectedOrder.trackingUrl && (
                      <a
                        href={selectedOrder.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <span>Live Tracking</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-blue-700 block">Courier</span>
                      <span className="font-bold text-blue-950">{selectedOrder.courierName || 'Standard Roastery Express'}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 block">Tracking Number / AWB</span>
                      <span className="font-mono font-bold text-blue-950">{selectedOrder.trackingNumber}</span>
                    </div>
                    {selectedOrder.estimatedDeliveryDate && (
                      <div className="col-span-2">
                        <span className="text-blue-700 block">Estimated Arrival</span>
                        <span className="font-semibold text-blue-950">{selectedOrder.estimatedDeliveryDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#8A5934] uppercase tracking-wider block">
                  Ordered Coffee Batches
                </span>
                <div className="bg-[#FAF6F0] rounded-xl p-3 divide-y divide-[#EBDCCE] border border-[#EBDCCE]">
                  {selectedOrder.items?.map((item: any, idx: number) => (
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

              {/* Financial Breakdown */}
              <div className="space-y-1.5 p-3.5 bg-[#FAF6F0] rounded-xl border border-[#EBDCCE]">
                <div className="flex justify-between text-[#6E4022]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#2B170E]">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({selectedOrder.discountPercent}%):</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6E4022]">
                  <span>Doorstep Courier:</span>
                  <span className="font-semibold text-[#2B170E]">
                    {selectedOrder.shippingFee === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#2B170E] pt-2 border-t border-[#EBDCCE]">
                  <span>Total Amount:</span>
                  <span className="text-terracotta-700">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Status History Timeline Log */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#8A5934] uppercase tracking-wider block">
                    Fulfillment Milestones
                  </span>
                  <div className="bg-[#FAF6F0] rounded-xl p-3 space-y-2 border border-[#EBDCCE]">
                    {selectedOrder.statusHistory.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#3A1E0E] uppercase">{item.status}</span>
                            <span className="text-[10px] text-[#8A5934]">
                              {new Date(item.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          {item.note && <p className="text-[#6E4022] mt-0.5">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {selectedOrder.shippingAddress && (
                <div className="p-3.5 bg-[#FAF6F0] rounded-xl border border-[#EBDCCE] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Delivery Address</span>
                  <p className="font-bold text-[#3A1E0E]">{selectedOrder.shippingAddress.contactName}</p>
                  <p className="text-[#532D16]">
                    {selectedOrder.shippingAddress.street}
                    {selectedOrder.shippingAddress.apartment ? `, ${selectedOrder.shippingAddress.apartment}` : ''}
                  </p>
                  <p className="text-[#8A5934]">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode} • {selectedOrder.shippingAddress.country}
                  </p>
                  {selectedOrder.shippingAddress.phone && (
                    <p className="text-[#8A5934]">Phone: {selectedOrder.shippingAddress.phone}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EBDCCE]">
              <div>
                {['received', 'processing'].includes(selectedOrder.orderStatus) &&
                  selectedOrder.cancellationStatus !== 'requested' &&
                  selectedOrder.orderStatus !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancellingOrder(selectedOrder);
                        setCancelReason('');
                      }}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Request Order Cancellation</span>
                    </button>
                  )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Cancellation Request Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-[#EBDCCE]">
            <div className="flex items-center justify-between border-b border-[#EBDCCE] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#3A1E0E] flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                Cancel Order {cancellingOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="text-[#8A5934] hover:text-[#3A1E0E] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#532D16]">
              <p className="leading-relaxed">
                Orders can be cancelled before roast production begins. Once submitted, our roastery team will review your cancellation request and halt batch scheduling.
              </p>

              <div>
                <label className="text-xs font-bold text-[#3A1E0E] block mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Ordered incorrect grind size, need to update delivery address, duplicate order..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#EBDCCE]">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="flex-1 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE]"
              >
                Nevermind, Keep Order
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleCancelOrderSubmit}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isSubmittingCancel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
