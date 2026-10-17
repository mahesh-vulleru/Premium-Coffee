import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, ShoppingBag } from 'lucide-react';
import { BEST_DEAL_CAROUSEL_PRODUCTS } from '../data/coffeeData';
import { useCart } from '../context/CartContext';
import { handleImageError } from '../utils/imageFallback';
import { formatCurrency } from '../utils/pricing';

export const DealsGrid: React.FC = () => {
  const { addToCart } = useCart();

  // Carousel index for Best Deal card
  const [dealIndex, setDealIndex] = useState(0);

  // Real-time ticking Countdown Timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 14,
    mins: 32,
    secs: 45,
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

  const nextDeal = () => {
    setDealIndex((prev) => (prev + 1) % BEST_DEAL_CAROUSEL_PRODUCTS.length);
  };

  const prevDeal = () => {
    setDealIndex((prev) => (prev - 1 + BEST_DEAL_CAROUSEL_PRODUCTS.length) % BEST_DEAL_CAROUSEL_PRODUCTS.length);
  };

  return (
    <section id="deals" className="py-12 bg-[#FAF6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 2 Cards: Quality Coffee Delivery & Fuel Your Day Countdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Card 1: HOME DELIVERY (Quality coffee delivered to your door) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
            <div className="space-y-4 max-w-md z-10">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-terracotta-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500" />
                Home Delivery
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#3A1E0E] leading-snug">
                Quality coffee delivered to your door
              </h2>

              <p className="text-xs sm:text-sm text-[#6E4022] leading-relaxed">
                Try a bright spectrum of aromas, essences and varieties cultivated into existence
                by the committed expertise of our producing partners around the world.
              </p>

              <div className="pt-2">
                <a
                  href="#subscriptions"
                  className="inline-flex items-center gap-2.5 pl-5 pr-1.5 py-1.5 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs shadow-soft transition-all group"
                >
                  <span>Subscriptions</span>
                  <span className="w-7 h-7 rounded-full bg-[#2B170E] flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
            </div>

            {/* Delivery Spoon & Beans image */}
            <div className="relative w-full sm:w-56 h-48 sm:h-56 rounded-2xl overflow-hidden flex-shrink-0 border border-[#EBDCCE]">
              <img
                src="/images/delivery-spoon.jpg"
                alt="Coffee beans on wooden spoon"
                onError={handleImageError}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 2: Countdown Timer Deal (Fuel Your Day With Premium Coffee) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2B170E] via-[#3A1E0E] to-[#1E100A] text-white rounded-3xl p-6 sm:p-8 shadow-elevated flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="/images/morning-fuel.jpg"
                alt="Morning coffee steam"
                className="w-full h-full object-cover mix-blend-overlay"
              />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Flash Offer</span>
              </div>

              <h3 className="font-serif text-2xl font-bold tracking-tight text-white leading-tight">
                Fuel Your Day With Premium Coffee
              </h3>

              <div className="text-xs text-[#D5BC9F] flex items-center gap-1.5">
                <span>Hurry Up!</span>
                <span className="text-terracotta-400 font-bold">Offer Ends In:</span>
              </div>

              {/* Countdown Digits */}
              <div className="grid grid-cols-4 gap-2 pt-2 pb-1">
                {[
                  { value: String(timeLeft.days).padStart(2, '0'), label: 'Days' },
                  { value: String(timeLeft.hours).padStart(2, '0'), label: 'Hours' },
                  { value: String(timeLeft.mins).padStart(2, '0'), label: 'Mins' },
                  { value: String(timeLeft.secs).padStart(2, '0'), label: 'Sec' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-center"
                  >
                    <div className="font-mono text-lg font-black text-amber-400 leading-none">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-4">
              <a
                href="#best-sellers"
                className="inline-flex items-center gap-2.5 pl-5 pr-1.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#2B170E] font-bold text-xs shadow-soft transition-all group"
              >
                <span>Shop Now</span>
                <span className="w-7 h-7 rounded-full bg-terracotta-600 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom 2 Cards: 30% OFF Special Offer & Best Deal Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 3: Special Offer (30% OFF) */}
          <div className="lg:col-span-5 bg-gradient-to-tr from-[#1E100A] to-[#3A1E0E] text-white rounded-3xl p-6 sm:p-8 shadow-elevated flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-4 right-4 z-20 w-14 h-14 rounded-full border-2 border-dashed border-amber-400/80 bg-amber-500/10 backdrop-blur-md flex flex-col items-center justify-center text-center rotate-12">
              <span className="text-[9px] uppercase font-bold text-amber-300">Save</span>
              <span className="text-xs font-black text-white">30%</span>
            </div>

            <div className="relative z-10 space-y-3 max-w-xs">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Special Offer
              </span>

              <h3 className="font-serif text-2xl font-bold tracking-tight text-white leading-snug">
                Fuel Your Day With Premium Coffee
              </h3>

              <p className="text-xs text-[#D5BC9F] leading-relaxed">
                Freshly roasted specialty coffee, crafted for true coffee lovers.
              </p>

              <div className="pt-3">
                <a
                  href="#best-sellers"
                  className="inline-flex items-center gap-2.5 pl-5 pr-1.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#2B170E] font-bold text-xs shadow-soft transition-all group"
                >
                  <span>Shop Now</span>
                  <span className="w-7 h-7 rounded-full bg-terracotta-600 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
            </div>

            {/* Coffee Pouch Image Overlay */}
            <div className="absolute -bottom-4 right-0 w-44 sm:w-48 h-48 sm:h-52 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-500">
              <img
                src="/images/special-offer-pouch.jpg"
                alt="Firedup specialty pouch"
                onError={handleImageError}
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Card 4: Best Deal (Carousel with 3 Products) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft flex flex-col justify-between space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-extrabold text-[#3A1E0E]">
                  Best Deal
                </h3>
                <p className="text-xs text-[#6E4022] mt-1">
                  The latest, freshest season coffees that have just landed in the roastery.
                </p>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={prevDeal}
                  className="p-1.5 rounded-full border border-[#D5BC9F] hover:bg-[#FAF6F0] text-[#3A1E0E] transition-colors"
                  aria-label="Previous deal"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextDeal}
                  className="p-1.5 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white transition-colors"
                  aria-label="Next deal"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 Featured Deal Cards Grid (matching screenshot) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BEST_DEAL_CAROUSEL_PRODUCTS.map((prod, idx) => {
                const isActive = idx === dealIndex;

                return (
                  <div
                    key={prod.id}
                    className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between gap-2 relative group ${
                      isActive
                        ? 'border-terracotta-500 bg-[#FAF6F0] shadow-sm'
                        : 'border-[#EBDCCE] bg-white hover:border-[#D5BC9F]'
                    }`}
                  >
                    {prod.isSale && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                        Sale
                      </span>
                    )}

                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F5ECE1] flex items-center justify-center p-2 mb-1">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#3A1E0E] truncate">
                        {prod.name}
                      </h4>
                      <div className="text-xs font-black text-terracotta-600 mt-0.5">
                        {formatCurrency(prod.price)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(prod, 1, 'Whole Bean', '250g')}
                      className="w-full py-1.5 px-2 rounded-lg bg-[#2B170E] hover:bg-terracotta-600 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1 mt-1"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add (250g)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
