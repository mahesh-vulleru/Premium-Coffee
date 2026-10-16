import React, { useState } from 'react';
import { ArrowRight, ShoppingBag, Sparkles, Check, RefreshCw, Info } from 'lucide-react';
import { SUBSCRIPTION_FEATURED_PRODUCT } from '../data/coffeeData';
import { useCart } from '../context/CartContext';
import type { BagSize, GrindOption, SubscriptionFrequency } from '../types/coffee';
import { calculateProductPrice, formatCurrency } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const SubscriptionBanner: React.FC = () => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<BagSize>('250g');
  const [selectedGrind, setSelectedGrind] = useState<GrindOption>('Whole Bean');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('2_weeks');

  // Shared base price with 15% subscriber discount
  const basePrice = calculateProductPrice(SUBSCRIPTION_FEATURED_PRODUCT.price, selectedSize);
  const subscriberPrice = Math.round(basePrice * 0.85);

  const handleSubscribe = () => {
    addToCart(SUBSCRIPTION_FEATURED_PRODUCT, 1, selectedGrind, selectedSize, frequency);
  };

  return (
    <section id="subscriptions" className="relative py-20 bg-[#1E100A] text-white overflow-hidden">
      {/* Background Photography with Rustic Table, Steaming Mug & Beans */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/subscription-steaming.jpg"
          alt="Steaming fresh artisanal coffee with roasted beans"
          onError={handleImageError}
          className="w-full h-full object-cover opacity-35 filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#140A04] via-[#1E100A]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#140A04] via-transparent to-[#140A04]/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta-500/20 border border-terracotta-500/40 text-terracotta-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Tailored To Your Palate</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Firedup at Home Specialty Coffee Subscriptions
            </h2>

            <p className="text-sm sm:text-base text-[#D5BC9F] max-w-xl leading-relaxed">
              Discover unparalleled, freshly roasted single origin coffees, signature blends,
              and micro-lots — with a flexible delivery schedule you can pause, change,
              or cancel anytime with zero commitments.
            </p>

            {/* Prototype Demo Banner */}
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm max-w-xl flex items-start gap-2.5 text-xs text-[#D5BC9F]">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Subscription Preview:</strong> Real automated recurring billing will be activated upon merchant gateway connection. Adding this card configures your selected size, grind, and frequency directly to your cart.
              </span>
            </div>

            {/* Subscription Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <span>Free Doorstep Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <RefreshCw className="w-3 h-3" />
                </div>
                <span>Pause or Skip Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <span>Save 15% Every Delivery</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={handleSubscribe}
                className="inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-terracotta-600 hover:bg-terracotta-500 text-white font-bold text-sm shadow-glow transition-all group"
              >
                <span>Add Subscription to Cart</span>
                <span className="w-9 h-9 rounded-full bg-[#140A04] flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Floating Interactive Subscription Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#2B170E]/90 backdrop-blur-md rounded-3xl p-6 border border-[#532D16] shadow-2xl space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-24 rounded-2xl overflow-hidden bg-[#1E100A] border border-[#532D16] flex-shrink-0 p-1">
                  <img
                    src="/images/special-offer-pouch.jpg"
                    alt={SUBSCRIPTION_FEATURED_PRODUCT.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Roaster&apos;s Pick • 15% Subscriber Savings
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {SUBSCRIPTION_FEATURED_PRODUCT.name}
                  </h3>
                  <p className="text-xs text-[#D5BC9F] line-clamp-2">
                    {SUBSCRIPTION_FEATURED_PRODUCT.subtitle}
                  </p>
                </div>
              </div>

              {/* Weight Pill Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#D5BC9F] block">
                  Select Bag Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['250g', '500g', '1kg'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedSize === size
                          ? 'bg-terracotta-600 border-terracotta-500 text-white shadow-sm'
                          : 'bg-[#1E100A] border-[#532D16] text-[#D5BC9F] hover:bg-[#3A1E0E]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grind Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#D5BC9F] block">
                  Grind Preference
                </label>
                <select
                  value={selectedGrind}
                  onChange={(e) => setSelectedGrind(e.target.value as GrindOption)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#532D16] bg-[#1E100A] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                >
                  <option value="Whole Bean">Whole Bean (Recommended)</option>
                  <option value="French Press">French Press (Coarse)</option>
                  <option value="Pour Over">Pour Over (Medium)</option>
                  <option value="Espresso">Espresso (Fine)</option>
                  <option value="Cold Brew">Cold Brew (Extra Coarse)</option>
                </select>
              </div>

              {/* Frequency Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#D5BC9F] block">
                  Delivery Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '2_weeks', label: 'Every 2 Wks' },
                    { id: '3_weeks', label: 'Every 3 Wks' },
                    { id: '4_weeks', label: 'Every 4 Wks' },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setFrequency(freq.id as SubscriptionFrequency)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                        frequency === freq.id
                          ? 'bg-white text-[#2B170E] border-white'
                          : 'bg-[#1E100A] border-[#532D16] text-[#D5BC9F] hover:bg-[#3A1E0E]'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Price and Add to Cart */}
              <div className="pt-2 border-t border-[#532D16] flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-[#D5BC9F] block">Per Delivery</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-xl text-white">
                      {formatCurrency(subscriberPrice)}
                    </span>
                    <span className="text-xs text-[#AF8359] line-through">
                      {formatCurrency(basePrice)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-terracotta-600 hover:bg-terracotta-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
