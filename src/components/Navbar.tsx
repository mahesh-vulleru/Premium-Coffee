import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  Flame,
  Menu,
  X,
  ArrowRight,
  ShieldAlert,
  LogOut,
  CheckCircle,
  Clock,
  MapPin,
  User,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { COFFEE_PRODUCTS } from '../data/coffeeData';
import { formatCurrency, calculateProductPrice } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    cartTotal,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    setQuickViewProduct,
    showToast,
  } = useCart();

  const { currentUser, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [topAnnouncement, setTopAnnouncement] = useState('Freshly Roasted This Morning • Free Express Shipping on Orders Over ₹999');

  useEffect(() => {
    let isMounted = true;
    async function loadAnnouncement() {
      try {
        const res = await fetch('/api/v1/content');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.content)) {
            const announcement = data.content.find((c: any) => c.contentType === 'announcement' || c.key === 'announcement_bar');
            if (announcement && isMounted) {
              setTopAnnouncement(announcement.title);
            }
          }
        }
      } catch {
        // Fallback to default
      }
    }
    loadAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  const searchResults = searchQuery.trim()
    ? COFFEE_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.roastLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tastingNotes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 4)
    : [];

  const handleAccountClick = () => {
    setShowAccountModal(true);
  };

  const handleSignOut = () => {
    logout();
    setShowAccountModal(false);
    showToast('Signed out of session', 'info');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#EBDCCE]/60 transition-all">
      {/* Top Banner Bar */}
      <div className="bg-[#2B170E] text-[#D5BC9F] text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 animate-pulse" />
        <span>
          {topAnnouncement}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-terracotta-500/10 flex items-center justify-center text-terracotta-600 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-terracotta-500 text-terracotta-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3A1E0E] leading-none">
                Firedup
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-terracotta-600 mt-0.5">
                Specialty Coffee
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#532D16]">
            <Link to="/shop" className="hover:text-terracotta-600 transition-colors">
              Shop
            </Link>
            <Link to="/deals" className="hover:text-terracotta-600 transition-colors">
              Deals
            </Link>
            <Link to="/subscribe" className="hover:text-terracotta-600 transition-colors">
              Subscribe
            </Link>
            <Link to="/our-story" className="hover:text-terracotta-600 transition-colors">
              Our Story
            </Link>
            <Link to="/wholesale" className="hover:text-terracotta-600 transition-colors flex items-center gap-1">
              <span>Wholesale</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                B2B
              </span>
            </Link>
          </nav>

          {/* Search Bar & Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Desktop Search Input Box */}
            <div className="relative hidden md:block">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                  placeholder="Search roasts, blends, notes..."
                  aria-label="Search coffee catalogue"
                  className="w-44 lg:w-56 pl-9 pr-7 py-2 rounded-full bg-[#F5ECE1]/80 border border-[#EBDCCE] text-xs text-[#2B170E] placeholder-[#AF8359] focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 transition-all"
                />
                <Search className="w-4 h-4 text-[#AF8359] absolute left-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="absolute right-2.5 text-[#AF8359] hover:text-[#532D16]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search dropdown results */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-72 right-0 bg-white rounded-2xl shadow-elevated border border-[#EBDCCE] p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#AF8359] px-3 py-1">
                    Matching Blends
                  </div>
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      onMouseDown={() => {
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-[#FAF6F0] rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={handleImageError}
                        className="w-10 h-10 object-cover rounded-lg border border-[#EBDCCE]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#3A1E0E] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#8A5934]">
                          {formatCurrency(calculateProductPrice(item.price, '250g'))} • {item.roastLevel} Roast
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-terracotta-500 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Authentication / Account Profile */}
            {currentUser ? (
              <button
                type="button"
                onClick={handleAccountClick}
                title={`Account: ${currentUser.name} (${currentUser.role})`}
                aria-label={`User account for ${currentUser.name}`}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#F5ECE1] hover:bg-[#ebdccf] text-[#3A1E0E] text-xs font-semibold transition-colors border border-[#EBDCCE]"
              >
                <div className="w-6 h-6 rounded-full bg-terracotta-500 text-white flex items-center justify-center text-[11px] font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">{currentUser.name.split(' ')[0]}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-900 text-purple-200'
                      : currentUser.role === 'wholesale'
                      ? 'bg-amber-900 text-amber-200'
                      : 'bg-stone-300 text-stone-800'
                  }`}
                >
                  {currentUser.role === 'wholesale' ? 'B2B' : currentUser.role}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-[#532D16] hover:bg-[#F5ECE1] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-[#2B170E] hover:bg-[#3A1E0E] text-white transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Wishlist Icon with badge */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              title="Saved Beans Wishlist"
              aria-label={`Saved Beans Wishlist, ${wishlist.length} items`}
              className="relative p-2 rounded-full hover:bg-[#F5ECE1] text-[#532D16] transition-colors focus-visible:ring-2 focus-visible:ring-terracotta-500"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-terracotta-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping Cart, ${cartCount} items, total ${formatCurrency(cartTotal)}`}
              className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-soft group focus-visible:ring-2 focus-visible:ring-terracotta-500"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-terracotta-400 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-terracotta-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{formatCurrency(cartTotal)}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden p-2 rounded-lg text-[#532D16] hover:bg-[#F5ECE1]"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EBDCCE] bg-[#FAF6F0] px-4 pt-3 pb-6 space-y-3">
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roasts & beans..."
              aria-label="Mobile search"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#EBDCCE] text-sm text-[#2B170E]"
            />
            <Search className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5" />

            {/* Mobile search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-xl shadow-md border border-[#EBDCCE] p-2 space-y-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setQuickViewProduct(item);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left p-2 hover:bg-[#FAF6F0] rounded-lg flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#3A1E0E]">{item.name}</span>
                    <span className="text-[#8A5934]">{formatCurrency(calculateProductPrice(item.price, '250g'))}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 font-semibold text-[#532D16]">
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Shop All Coffee
            </Link>
            <Link
              to="/deals"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Special Deals & Offers
            </Link>
            <Link
              to="/subscribe"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Coffee Subscriptions
            </Link>
            <Link
              to="/our-story"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Our Story & Mission
            </Link>
            <Link
              to="/wholesale"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg flex items-center justify-between"
            >
              <span>Wholesale Partner Portal</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                B2B Program
              </span>
            </Link>

            <div className="pt-2 border-t border-[#EBDCCE] flex flex-col gap-2">
              {currentUser ? (
                <>
                  <div className="p-2 bg-[#F5ECE1] rounded-lg text-xs text-[#3A1E0E]">
                    Signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
                  </div>
                  {currentUser.role === 'admin' && (
                    <Link
                      to="/dashboard/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 bg-stone-900 text-white rounded-lg text-xs font-bold text-center"
                    >
                      Open Admin Dashboard
                    </Link>
                  )}
                  {currentUser.role === 'wholesale' && (
                    <Link
                      to="/dashboard/wholesale"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 bg-amber-900 text-white rounded-lg text-xs font-bold text-center"
                    >
                      Open Wholesale Dashboard
                    </Link>
                  )}
                  {currentUser.role === 'customer' && (
                    <Link
                      to="/dashboard/customer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 bg-[#2B170E] text-white rounded-lg text-xs font-bold text-center"
                    >
                      Open Customer Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="p-2 text-xs font-bold text-red-700 hover:bg-red-50 rounded-lg text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-center text-xs font-bold rounded-lg border border-[#EBDCCE] bg-white text-[#532D16]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-center text-xs font-bold rounded-lg bg-[#2B170E] text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Profile Modal / Dropdown */}
      {showAccountModal && currentUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="User Account Summary"
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Subtle backdrop: clicking outside closes popup */}
          <div
            onClick={() => setShowAccountModal(false)}
            className="fixed inset-0 bg-[#140A04]/30 backdrop-blur-[2px] transition-opacity"
            aria-hidden="true"
          />

          {/* Account popup container: positioned directly below the navbar, staying within viewport with internal scroll */}
          <div className="fixed top-[92px] sm:top-[104px] right-3 sm:right-6 lg:right-8 left-3 sm:left-auto w-auto sm:w-[420px] max-w-md max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain z-50 bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#EBDCCE] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EBDCCE]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg font-serif shadow-md border border-white/20 flex-shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#3A1E0E] leading-tight">
                    {currentUser.name}
                  </h3>
                  <p className="text-xs text-[#8A5934] break-all">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-[11px] text-[#6E4022] font-medium">{currentUser.phone}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1 rounded-xl text-[#8A5934] hover:text-[#3A1E0E] hover:bg-[#FAF6F0] transition-colors"
                aria-label="Close account modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role & Privileges Box */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs space-y-3">
              {/* Account Role */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#8A5934] uppercase text-[10px] font-bold tracking-wider">
                  Account Role:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                      : currentUser.role === 'wholesale'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-terracotta-100 text-terracotta-800 border border-terracotta-200'
                  }`}
                >
                  {currentUser.role === 'wholesale'
                    ? 'Wholesale Partner'
                    : currentUser.role === 'admin'
                    ? 'Administrator'
                    : 'Customer Member'}
                </span>
              </div>

              {/* Wholesale Details */}
              {currentUser.role === 'wholesale' && (
                <div className="space-y-1.5 pt-2 border-t border-[#EBDCCE]">
                  <div className="flex justify-between">
                    <span className="text-[#8A5934]">Business:</span>
                    <strong className="text-[#3A1E0E]">{currentUser.wholesaleDetails?.businessName || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A5934]">Tax ID / GST:</span>
                    <strong className="text-[#3A1E0E] font-mono">{currentUser.wholesaleDetails?.taxId || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8A5934]">Status:</span>
                    {currentUser.wholesaleDetails?.status === 'approved' ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved (35% Off)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Under Review
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Default Delivery Address Card */}
              {currentUser.role === 'customer' && (
                <div className="pt-2 border-t border-[#EBDCCE] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A5934] uppercase text-[10px] font-bold tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
                      Default Delivery Address:
                    </span>
                    <Link
                      to="/dashboard/customer"
                      onClick={() => setShowAccountModal(false)}
                      className="text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700 hover:underline"
                    >
                      Edit →
                    </Link>
                  </div>

                  {currentUser.shippingAddress?.street ? (
                    <div className="p-3.5 rounded-2xl bg-white border border-[#EBDCCE] text-xs text-[#3A1E0E] leading-relaxed space-y-1 shadow-xs">
                      <div className="font-bold text-[#2B170E] flex items-center justify-between pb-1 border-b border-[#FAF6F0]">
                        <span>{currentUser.name}</span>
                        {currentUser.phone && (
                          <span className="text-[#8A5934] font-normal">{currentUser.phone}</span>
                        )}
                      </div>
                      <div className="pt-0.5 text-[#2B170E] font-medium leading-snug">
                        {currentUser.shippingAddress.street}
                      </div>
                      {currentUser.shippingAddress.apartment && (
                        <div className="text-[#6E4022] leading-snug">
                          {currentUser.shippingAddress.apartment}
                        </div>
                      )}
                      <div className="text-[#532D16] font-medium">
                        {currentUser.shippingAddress.city}, {currentUser.shippingAddress.state}
                        {currentUser.shippingAddress.postalCode ? ` - ${currentUser.shippingAddress.postalCode}` : ''}
                      </div>
                      {currentUser.shippingAddress.country && (
                        <div className="text-[10px] text-[#8A5934] font-semibold uppercase tracking-wider pt-0.5">
                          {currentUser.shippingAddress.country}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white border border-dashed border-[#EBDCCE] text-center">
                      <p className="text-xs text-[#8A5934]">No delivery address saved yet.</p>
                      <Link
                        to="/dashboard/customer"
                        onClick={() => setShowAccountModal(false)}
                        className="mt-1 inline-block text-[11px] font-bold text-terracotta-600 hover:underline"
                      >
                        + Add Delivery Address
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="space-y-2.5 pt-1">
              {currentUser.role === 'admin' && (
                <Link
                  to="/dashboard/admin"
                  onClick={() => setShowAccountModal(false)}
                  className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Admin Operations Command</span>
                </Link>
              )}

              {currentUser.role === 'wholesale' && (
                <Link
                  to="/dashboard/wholesale"
                  onClick={() => setShowAccountModal(false)}
                  className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  <span>Wholesale Partner Portal</span>
                </Link>
              )}

              {currentUser.role === 'customer' && (
                <Link
                  to="/dashboard/customer"
                  onClick={() => setShowAccountModal(false)}
                  className="w-full py-3 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold flex items-center justify-between px-4 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>My Account Dashboard</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D5BC9F] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
