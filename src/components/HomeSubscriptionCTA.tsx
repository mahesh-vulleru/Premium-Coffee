import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check, RefreshCw, Truck } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';

export const HomeSubscriptionCTA: React.FC = () => {
  return (
    <section className="relative py-20 bg-[#1E100A] text-white overflow-hidden">
      {/* Background Photography with Rustic Table, Steaming Mug & Beans */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/subscription-steaming.jpg"
          alt="Steaming artisanal coffee with roasted beans"
          onError={handleImageError}
          className="w-full h-full object-cover opacity-30 filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#140A04] via-[#1E100A]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#140A04] via-transparent to-[#140A04]/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta-500/20 border border-terracotta-500/40 text-terracotta-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Tailored To Your Schedule</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Never Run Out Of Exceptional Specialty Coffee
            </h2>

            <p className="text-sm sm:text-base text-[#D5BC9F] max-w-xl leading-relaxed">
              Discover unparalleled single origin coffees and signature roaster blends delivered to your door on your terms. Save 15% on every shipment with zero commitments.
            </p>

            {/* Subscription Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-200">
              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Free Shipping</div>
                  <div className="text-[11px] text-slate-400">On every subscription</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Flexible Control</div>
                  <div className="text-[11px] text-slate-400">Pause or skip anytime</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Save 15% Every Drop</div>
                  <div className="text-[11px] text-slate-400">Subscriber-only pricing</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/subscribe"
                className="inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-terracotta-600 hover:bg-terracotta-500 text-white font-bold text-sm shadow-glow transition-all group"
              >
                <span>Customize Your Subscription</span>
                <span className="w-9 h-9 rounded-full bg-[#140A04] flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <span className="text-xs text-[#D5BC9F]">
                Starting from $110/bag • Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

