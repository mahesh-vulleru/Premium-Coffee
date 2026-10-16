import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/CartContext';
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Sparkles,
  Package,
  LogOut,
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { wishlist, cartCount, showToast } = useCart();

  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-soft text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-50 text-terracotta-600 mx-auto flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#3A1E0E]">
            Customer Portal Access
          </h2>
          <p className="text-xs text-[#6E4022]">
            Please sign in to view your order history, delivery addresses, and bean loyalty points.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[#2B170E] text-white text-xs font-bold hover:bg-[#3A1E0E]"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/register/customer"
              className="w-full py-2.5 rounded-xl bg-[#FAF6F0] text-[#3A1E0E] text-xs font-bold hover:bg-[#F5ECE1]"
            >
              Create Customer Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    showToast('Signed out of session', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Profile Bar */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-elevated">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-500/20 text-terracotta-400 border border-terracotta-500/30 flex items-center justify-center text-xl font-bold font-serif">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  Welcome, {currentUser.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-terracotta-500/20 text-terracotta-300 border border-terracotta-500/30">
                  Roaster Club VIP
                </span>
              </div>
              <p className="text-xs text-[#D5BC9F] mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-colors"
            >
              Browse Roasts
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/40 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8A5934]">
              <span>Bean Loyalty Points</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">320 Beans</div>
            <p className="text-[11px] text-emerald-700 font-semibold">$15 reward credit ready to redeem</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8A5934]">
              <span>Saved Wishlist Roasts</span>
              <Heart className="w-4 h-4 text-terracotta-500" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">{wishlist.length} Items</div>
            <p className="text-[11px] text-[#6E4022]">Saved micro-lots and blends</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8A5934]">
              <span>Active Cart Items</span>
              <ShoppingBag className="w-4 h-4 text-terracotta-600" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">{cartCount} Items</div>
            <p className="text-[11px] text-[#6E4022]">Ready for doorstep roast dispatch</p>
          </div>
        </div>

        {/* 2-Column: Saved Delivery Address & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Saved Address */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-terracotta-600" />
                Default Delivery Address
              </h3>
              <span className="text-[10px] text-terracotta-600 font-bold uppercase tracking-wider bg-terracotta-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            {currentUser.shippingAddress ? (
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#532D16] space-y-1">
                <div className="font-bold text-[#3A1E0E]">{currentUser.name}</div>
                <div>{currentUser.shippingAddress.street}</div>
                {currentUser.shippingAddress.apartment && (
                  <div>{currentUser.shippingAddress.apartment}</div>
                )}
                <div>
                  {currentUser.shippingAddress.city}, {currentUser.shippingAddress.state}{' '}
                  {currentUser.shippingAddress.postalCode}
                </div>
                <div className="text-[#8A5934] pt-1">{currentUser.shippingAddress.country}</div>
              </div>
            ) : (
              <p className="text-xs text-[#8A5934]">No address configured yet.</p>
            )}

            <div className="text-[11px] text-[#8A5934]">
              Orders are automatically dispatched to this address with tamper-evident valved aroma packaging.
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
                <Package className="w-4 h-4 text-terracotta-600" />
                Order History & Deliveries
              </h3>
              <Link to="/shop" className="text-xs font-bold text-terracotta-600 hover:underline">
                Reorder Roasts →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#3A1E0E]">Order #FD-8921</div>
                  <div className="text-[11px] text-[#8A5934]">
                    Delivered • 2× Aurora Signature Blend (250g, Whole Bean)
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#3A1E0E]">$42.50</div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Delivered
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#3A1E0E]">Order #FD-8740</div>
                  <div className="text-[11px] text-[#8A5934]">
                    Delivered • 1× Ethiopia Yirgacheffe Washed Lot (500g, Drip)
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#3A1E0E]">$36.00</div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Delivered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
