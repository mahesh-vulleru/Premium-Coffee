import React, { useState } from 'react';
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
} from 'lucide-react';

type DashboardTab = 'overview' | 'profile' | 'orders' | 'wishlist' | 'subscriptions' | 'settings';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, logout, updateProfile } = useAuth();
  const { wishlist, cartCount, addToCart, toggleWishlist, setIsCartOpen, showToast } = useCart();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

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
              to="/login"
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const result = await updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      shippingAddress: {
        street: profileForm.street,
        apartment: profileForm.apartment,
        city: profileForm.city,
        state: profileForm.state,
        postalCode: profileForm.postalCode,
        country: profileForm.country,
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
              <span>Explore Roasts</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="text-[11px] text-terracotta-600 hover:underline font-bold flex items-center gap-1"
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
                    <button
                      type="button"
                      onClick={() => setActiveTab('wishlist')}
                      className="text-[11px] text-terracotta-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>View saved items</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#8A5934]">
                      <span>Roaster Club Points</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-[#3A1E0E]">150 Beans</div>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      {formatCurrency(150)} reward credit on your next order
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
                        Edit →
                      </button>
                    </div>

                    {currentUser.shippingAddress?.street ? (
                      <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#532D16] space-y-1">
                        <div className="font-bold text-[#3A1E0E]">{currentUser.name}</div>
                        <div className="text-[#6E4022]">{currentUser.phone}</div>
                        <div className="pt-1">{currentUser.shippingAddress.street}</div>
                        {currentUser.shippingAddress.apartment && (
                          <div>{currentUser.shippingAddress.apartment}</div>
                        )}
                        <div>
                          {currentUser.shippingAddress.city}, {currentUser.shippingAddress.state}{' '}
                          {currentUser.shippingAddress.postalCode}
                        </div>
                        <div className="text-[#8A5934] font-medium pt-1">
                          {currentUser.shippingAddress.country}
                        </div>
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

                  {/* Honest Roast Dispatch Notification */}
                  <div className="bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                          <Package className="w-4 h-4 text-terracotta-600" />
                          Live Roaster Dispatch
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Roastery Active
                        </span>
                      </div>
                      <p className="text-xs text-[#6E4022] leading-relaxed">
                        No active roast batches currently in transit for your account. When you place an order, live roast dates, cupping notes, and courier dispatch tracking will update right here.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <Link
                        to="/shop"
                        className="flex-1 py-2.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        <span>Order Fresh Roast</span>
                      </Link>
                      <Link
                        to="/subscribe"
                        className="flex-1 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-all text-center"
                      >
                        Start Subscription (15% Off)
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Roaster Quality Standard Banner */}
                <div className="bg-gradient-to-r from-[#2B170E] to-[#4A2411] text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-serif text-lg font-bold">Firedup Coffee Quality Promise</h4>
                    <p className="text-xs text-[#D5BC9F] max-w-xl">
                      Each batch is roasted on our Giesen drum roaster in micro-batches and shipped within 48 hours with single-way degassing valves to preserve aromatic peak freshness.
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
                    Manage your name, contact phone number, and default delivery address for instant checkout.
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
                        placeholder="Flat / House No., Building Name, Street"
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
                          placeholder="Near Central Park"
                        />
                      </div>

                      <div>
                        <label htmlFor="city" className="text-xs font-bold text-[#532D16] block mb-1">
                          City *
                        </label>
                        <input
                          id="city"
                          type="text"
                          required
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                          placeholder="Bengaluru"
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
                          placeholder="Karnataka"
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
                          placeholder="560001"
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
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
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
                      Roastery Order History
                    </h2>
                    <p className="text-xs text-[#6E4022] mt-0.5">
                      View all past shipments, tracking updates, and roast date records.
                    </p>
                  </div>
                  <Link
                    to="/shop"
                    className="text-xs font-bold text-terracotta-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Browse Catalog</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Honest Empty State */}
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
                      <span>Add more from shop</span>
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
                      Never run out of freshly roasted beans with automated doorstep deliveries.
                    </p>
                  </div>
                </div>

                {/* Status Notice */}
                <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#3A1E0E]">No Active Recurring Plan</div>
                      <div className="text-[11px] text-[#8A5934]">
                        You are currently purchasing batches on-demand.
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/subscribe"
                    className="px-4 py-2 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs transition-all shadow-soft whitespace-nowrap"
                  >
                    Subscribe Now
                  </Link>
                </div>

                {/* Subscription Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-xs">
                      15%
                    </div>
                    <div className="font-bold text-xs text-[#3A1E0E]">15% Off Every Shipment</div>
                    <p className="text-[11px] text-[#6E4022]">
                      Subscribers enjoy guaranteed preferential pricing on every recurring roast.
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
                      Pause shipments, adjust grind sizes, or switch frequency anytime with no fees.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center sm:text-left">
                  <Link
                    to="/subscribe"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-md"
                  >
                    <span>Customise Your Coffee Subscription</span>
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
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-[#532D16]">Registered Date</span>
                      <span className="text-[#8A5934]">{memberSinceYear}</span>
                    </div>
                  </div>
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
    </div>
  );
};
