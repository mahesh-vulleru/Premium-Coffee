import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Check,
  RefreshCw,
  Truck,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { SUBSCRIPTION_FEATURED_PRODUCT } from '../data/coffeeData';
import { useCart } from '../context/CartContext';
import type { BagSize, GrindOption, SubscriptionFrequency } from '../types/coffee';
import { calculateProductPrice, formatCurrency } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const SubscribePage: React.FC = () => {
  const { addToCart, showToast } = useCart();
  const [selectedSize, setSelectedSize] = useState<BagSize>('250g');
  const [selectedGrind, setSelectedGrind] = useState<GrindOption>('Whole Bean');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('2_weeks');
  const [isAdded, setIsAdded] = useState(false);

  // 15% subscriber discount calculation
  const basePrice = calculateProductPrice(SUBSCRIPTION_FEATURED_PRODUCT.price, selectedSize);
  const subscriberPrice = Math.round(basePrice * 0.85);

  const handleSubscribe = () => {
    addToCart(SUBSCRIPTION_FEATURED_PRODUCT, 1, selectedGrind, selectedSize, frequency);
    setIsAdded(true);
    showToast(
      `Configured ${SUBSCRIPTION_FEATURED_PRODUCT.name} (${selectedSize}, ${selectedGrind}, every ${frequency.replace('_', ' ')}) to cart!`
    );
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8A5934]">
          <Link to="/" className="hover:text-[#3A1E0E] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-[#3A1E0E]">Subscriptions</span>
        </div>

        {/* Hero Banner */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-elevated">
          <div className="absolute right-0 top-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-500/20 text-terracotta-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Tailored To Your Palate</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Firedup Specialty Coffee Subscriptions
            </h1>

            <p className="text-sm sm:text-base text-[#D5BC9F] leading-relaxed">
              Freshly roasted single origins and signature roasts delivered directly to your door on your exact cadence. Enjoy 15% off every drop with zero commitments.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-stone-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                Free Express Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Pause or Cancel Anytime
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Save 15% On Every Order
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Customizer Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EBDCCE] shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Product Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF6F0] border border-[#EBDCCE] shadow-sm">
                <img
                  src="/images/subscription-steaming.jpg"
                  alt="Subscription Coffee Bag"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-terracotta-600 text-white text-xs font-bold shadow-md">
                  15% Subscriber Savings
                </div>
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-1">
                <h3 className="font-serif font-bold text-base text-[#3A1E0E]">
                  {SUBSCRIPTION_FEATURED_PRODUCT.name}
                </h3>
                <p className="text-xs text-[#6E4022]">
                  {SUBSCRIPTION_FEATURED_PRODUCT.subtitle}
                </p>
                <div className="text-[11px] text-[#8A5934] pt-1">
                  Origin: {SUBSCRIPTION_FEATURED_PRODUCT.origin} • Cupping Notes:{' '}
                  {SUBSCRIPTION_FEATURED_PRODUCT.tastingNotes.join(', ')}
                </div>
              </div>
            </div>

            {/* Right: Customization Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#3A1E0E]">
                  Build Your Subscription
                </h3>
                <p className="text-xs text-[#6E4022] mt-1">
                  Select your bag size, grind style, and delivery cadence.
                </p>
              </div>

              {/* 1. Bag Size */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#532D16] uppercase tracking-wider">
                  1. Bag Size
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(['250g', '500g', '1kg'] as const).map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#2B170E] border-[#2B170E] text-white shadow-soft'
                            : 'bg-[#FAF6F0]/60 border-[#EBDCCE] text-[#3A1E0E] hover:bg-[#F5ECE1]'
                        }`}
                      >
                        <div className="font-bold text-sm">{size}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          {size === '250g'
                            ? '~16 Cups'
                            : size === '500g'
                            ? '~32 Cups'
                            : '~64 Cups'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Grind Option */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#532D16] uppercase tracking-wider">
                  2. Grind Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'] as const).map((grind) => {
                    const isSelected = selectedGrind === grind;
                    return (
                      <button
                        key={grind}
                        type="button"
                        onClick={() => setSelectedGrind(grind)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-terracotta-600 border-terracotta-600 text-white shadow-sm'
                            : 'bg-[#FAF6F0]/60 border-[#EBDCCE] text-[#532D16] hover:bg-[#F5ECE1]'
                        }`}
                      >
                        {grind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Delivery Frequency */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#532D16] uppercase tracking-wider">
                  3. Delivery Frequency
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: '2_weeks', label: 'Every 2 Weeks', note: 'Most Popular' },
                    { id: '3_weeks', label: 'Every 3 Weeks', note: 'Balanced' },
                    { id: '4_weeks', label: 'Every 4 Weeks', note: 'Monthly Drop' },
                  ].map((freq) => {
                    const isSelected = frequency === freq.id;
                    return (
                      <button
                        key={freq.id}
                        type="button"
                        onClick={() => setFrequency(freq.id as SubscriptionFrequency)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#3A1E0E] border-[#3A1E0E] text-white shadow-soft'
                            : 'bg-[#FAF6F0]/60 border-[#EBDCCE] text-[#3A1E0E] hover:bg-[#F5ECE1]'
                        }`}
                      >
                        <div className="font-bold text-xs">{freq.label}</div>
                        <div className="text-[10px] text-amber-500 font-medium mt-0.5">
                          {freq.note}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Add to Cart Action */}
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#3A1E0E]">
                      {formatCurrency(subscriberPrice)}
                    </span>
                    <span className="text-xs text-[#AF8359] line-through">
                      {formatCurrency(basePrice)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Save 15%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8A5934] mt-0.5">
                    Billed per shipment • Free express shipping included
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isAdded}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-terracotta-600 hover:bg-terracotta-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAdded ? 'Added To Cart!' : 'Start Subscription'}</span>
                </button>
              </div>

              {/* Prototype Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>
                  *Demonstration mode: Your subscription preferences are stored directly in your cart order summary. Production recurring billing integrates via Stripe Billing webhooks.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="font-serif text-2xl font-bold text-[#3A1E0E]">
              How Firedup Subscriptions Work
            </h3>
            <p className="text-xs text-[#6E4022]">
              Three simple steps to peak freshness in your morning cup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-terracotta-50 text-terracotta-600 font-black text-base mx-auto flex items-center justify-center">
                01
              </div>
              <h4 className="font-bold text-sm text-[#3A1E0E]">Choose Your Coffee</h4>
              <p className="text-xs text-[#6E4022]">
                Select between our signature roaster blend or rotating micro-lot single origins.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-terracotta-50 text-terracotta-600 font-black text-base mx-auto flex items-center justify-center">
                02
              </div>
              <h4 className="font-bold text-sm text-[#3A1E0E]">Set Your Cadence</h4>
              <p className="text-xs text-[#6E4022]">
                Whether you drink 1 cup or 4 cups a day, adjust your frequency to match your consumption.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-terracotta-50 text-terracotta-600 font-black text-base mx-auto flex items-center justify-center">
                03
              </div>
              <h4 className="font-bold text-sm text-[#3A1E0E]">Roasted & Dispatched Fresh</h4>
              <p className="text-xs text-[#6E4022]">
                We roast your batch to order and ship with free express delivery directly to your door.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
