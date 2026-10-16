import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User, Flame, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { COFFEE_PRODUCTS } from '../data/coffeeData';

export const Navbar: React.FC = () => {
  const { cartCount, cartTotal, wishlist, setIsCartOpen, setIsWishlistOpen, setQuickViewProduct } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchResults = searchQuery.trim()
    ? COFFEE_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tastingNotes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 4)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#EBDCCE]/60 transition-all">
      {/* Top Banner Bar */}
      <div className="bg-[#2B170E] text-[#D5BC9F] text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 animate-pulse" />
        <span>Freshly Roasted This Morning • Free Express Shipping Over $75 with code <strong className="text-white font-bold">FIREDUP15</strong></span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
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
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#532D16]">
            <a href="#best-sellers" className="hover:text-terracotta-600 transition-colors">
              Shop
            </a>
            <a href="#best-sellers" className="hover:text-terracotta-600 transition-colors">
              Best Seller
            </a>
            <a href="#best-sellers" className="hover:text-terracotta-600 transition-colors">
              New Arrivals
            </a>
            <a href="#subscriptions" className="hover:text-terracotta-600 transition-colors">
              Subscribe
            </a>
            <a href="#story" className="hover:text-terracotta-600 transition-colors">
              Our Story
            </a>
            <a href="#wholesale" className="hover:text-terracotta-600 transition-colors">
              Wholesale
            </a>
          </nav>

          {/* Search Bar & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input Box */}
            <div className="relative hidden md:block">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                  placeholder="Search roasts, blends, beans..."
                  className="w-48 lg:w-64 pl-9 pr-4 py-2 rounded-full bg-[#F5ECE1]/80 border border-[#EBDCCE] text-xs text-[#2B170E] placeholder-[#AF8359] focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 transition-all"
                />
                <Search className="w-4 h-4 text-[#AF8359] absolute left-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
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
                    <button
                      key={item.id}
                      onClick={() => setQuickViewProduct(item)}
                      className="w-full text-left p-2.5 hover:bg-[#FAF6F0] rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-[#EBDCCE]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#3A1E0E] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#8A5934]">${item.price} • {item.roastLevel} Roast</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-terracotta-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account Icon */}
            <button
              type="button"
              title="Customer Account"
              className="p-2.5 rounded-full hover:bg-[#F5ECE1] text-[#532D16] transition-colors"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Wishlist Icon with badge */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              title="Saved Beans Wishlist"
              className="relative p-2.5 rounded-full hover:bg-[#F5ECE1] text-[#532D16] transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-terracotta-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-soft group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-terracotta-400 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-terracotta-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">${cartTotal.toFixed(0)}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#EBDCCE] text-sm text-[#2B170E]"
            />
            <Search className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5" />
          </div>
          <div className="flex flex-col gap-2 font-semibold text-[#532D16]">
            <a
              href="#best-sellers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Shop All Coffee
            </a>
            <a
              href="#best-sellers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Best Seller
            </a>
            <a
              href="#deals"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Special Deals & Offers
            </a>
            <a
              href="#subscriptions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Coffee Subscriptions
            </a>
            <a
              href="#story"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Our Story & Mission
            </a>
            <a
              href="#wholesale"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F5ECE1] rounded-lg"
            >
              Wholesale Partner
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

