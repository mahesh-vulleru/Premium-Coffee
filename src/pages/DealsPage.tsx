import React from 'react';
import { Link } from 'react-router-dom';
import { DealsGrid } from '../components/DealsGrid';
import { Sparkles, ArrowLeft, Tag, Check, Truck, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const DealsPage: React.FC = () => {
  const { showToast } = useCart();

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText?.(code);
    showToast(`Copied promo code "${code}" to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8A5934] mb-4">
          <Link to="/" className="hover:text-[#3A1E0E] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-[#3A1E0E]">Promotions & Deals</span>
        </div>

        {/* Page Banner */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-elevated">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Special Offers & Bundles</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Exclusive Coffee Deals
            </h1>

            <p className="text-xs sm:text-sm text-[#D5BC9F] leading-relaxed">
              Take advantage of limited-time batch drops, introductory coupons, bundle savings, and subscriber discounts.
            </p>
          </div>
        </div>

        {/* Active Promotional Coupons Box */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-terracotta-600 bg-terracotta-50 px-2 py-0.5 rounded">
                First Order Discount
              </span>
              <Tag className="w-4 h-4 text-terracotta-500" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">15% OFF</div>
            <p className="text-xs text-[#6E4022]">
              Valid on all single-bag and taster pack purchases.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <code className="font-mono text-xs font-bold text-[#2B170E] bg-[#FAF6F0] px-2 py-1 rounded border border-[#EBDCCE]">
                FIREDUP15
              </code>
              <button
                type="button"
                onClick={() => handleCopyCode('FIREDUP15')}
                className="text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700 underline"
              >
                Copy Code
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Free Express Delivery
              </span>
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">FREE SHIPPING</div>
            <p className="text-xs text-[#6E4022]">
              Automatically applied on orders exceeding ₹999.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Auto-applied at checkout</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                Recurring Subscriptions
              </span>
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">15% RECURRING</div>
            <p className="text-xs text-[#6E4022]">
              Never run out. Save 15% on every weekly or monthly roast drop.
            </p>
            <div className="pt-2">
              <Link
                to="/subscribe"
                className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
              >
                Explore Subscriptions →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* The 4-Card Promotional Grid */}
      <DealsGrid />
    </div>
  );
};

