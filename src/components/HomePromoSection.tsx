import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame, Tag, Sparkles } from 'lucide-react';

export const HomePromoSection: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 18,
    mins: 42,
    secs: 20,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 bg-[#FAF6F0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Flash Offer with Live Countdown Timer */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#2B170E] via-[#3A1E0E] to-[#1E100A] text-white rounded-3xl p-6 sm:p-8 shadow-elevated flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-terracotta-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Limited Roaster Batch Drop</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Fuel Your Morning With Fresh Roast Drops
              </h3>

              <p className="text-xs sm:text-sm text-[#D5BC9F] max-w-lg leading-relaxed">
                Single-origin micro-lots cupped above 86 points, hand-roasted and shipped within 24 hours of cooling.
              </p>

              {/* Countdown Digits */}
              <div className="grid grid-cols-4 gap-2.5 max-w-sm pt-2">
                {[
                  { value: String(timeLeft.days).padStart(2, '0'), label: 'Days' },
                  { value: String(timeLeft.hours).padStart(2, '0'), label: 'Hours' },
                  { value: String(timeLeft.mins).padStart(2, '0'), label: 'Mins' },
                  { value: String(timeLeft.secs).padStart(2, '0'), label: 'Sec' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-center"
                  >
                    <div className="font-mono text-lg sm:text-xl font-black text-amber-400 leading-none">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/deals"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#2B170E] font-bold text-xs shadow-soft transition-all group/btn"
              >
                <span>View Flash Deals</span>
                <ArrowRight className="w-3.5 h-3.5 text-terracotta-600 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <span className="text-xs text-[#D5BC9F] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-terracotta-400" />
                Dispatches fresh from today&apos;s batch
              </span>
            </div>
          </div>

          {/* Card 2: Special Promo Offer & Coupon Banner */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Special Promotion</span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#3A1E0E] leading-snug">
                Save 15% on First Order + Free Express Shipping
              </h3>

              <p className="text-xs text-[#6E4022] leading-relaxed">
                Use code <strong className="text-[#3A1E0E] font-mono">FIREDUP15</strong> during checkout. Free doorstep delivery unlocked on all coffee orders over ₹999.
              </p>

              {/* Promo code badge */}
              <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#3A1E0E]">
                  <Tag className="w-4 h-4 text-terracotta-600" />
                  <span className="font-mono font-bold">FIREDUP15</span>
                </div>
                <span className="text-[11px] text-terracotta-600 font-semibold">15% Discount</span>
              </div>
            </div>

            <div className="pt-6 border-t border-[#EBDCCE]/60 mt-4 flex items-center justify-between">
              <Link
                to="/deals"
                className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 inline-flex items-center gap-1 group"
              >
                <span>Browse All Active Offers</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="px-4 py-2 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

