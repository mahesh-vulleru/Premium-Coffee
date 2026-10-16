import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Coffee,
  ShieldCheck,
  TrendingUp,
  Award,
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';

export const WholesalePage: React.FC = () => {
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
          <span className="font-bold text-[#3A1E0E]">Wholesale Partnerships</span>
        </div>

        {/* Hero Banner */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-elevated">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Commercial Roastery Program</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Power Your Business With Premium Specialty Coffee
            </h1>

            <p className="text-sm sm:text-base text-[#D5BC9F] leading-relaxed">
              We partner with specialty cafes, restaurants, hotels, and forward-thinking workplaces. Enjoy 35% commercial volume pricing, dedicated roaster support, and barista training.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/wholesale/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta-600 hover:bg-terracotta-500 text-white font-bold text-xs shadow-glow transition-all group"
              >
                <span>Apply for Wholesale Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
              >
                <span>Wholesale Partner Login</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Core Wholesale Advantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#3A1E0E]">35% Commercial Discount</h3>
            <p className="text-xs text-[#6E4022] leading-relaxed">
              Unlocked immediately upon commercial verification. Scalable tiers for multi-location cafes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#3A1E0E]">Barista & Dial-In Training</h3>
            <p className="text-xs text-[#6E4022] leading-relaxed">
              Hands-on espresso calibration, grind consistency, and milk steaming workshops for your staff.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#3A1E0E]">Reliable Weekly Supply</h3>
            <p className="text-xs text-[#6E4022] leading-relaxed">
              Guaranteed order fulfillment with customized dispatch schedules so you never run dry during weekend rushes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#3A1E0E]">Custom Signature Blends</h3>
            <p className="text-xs text-[#6E4022] leading-relaxed">
              Collaborate with our master roaster to engineer a proprietary house roast unique to your brand.
            </p>
          </div>
        </div>

        {/* Cafe Image Mosaic */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-bold text-[#3A1E0E]">
              Inside Our Partner Cafes & Roasteries
            </h3>
            <p className="text-xs text-[#6E4022]">
              Elevating the coffee ritual in over 85+ specialty hospitality locations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE]">
              <img
                src="/images/barista-latte-art.jpg"
                alt="Barista crafting latte"
                onError={handleImageError}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE]">
              <img
                src="/images/cafe-counter.jpg"
                alt="Cafe counter"
                onError={handleImageError}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE]">
              <img
                src="/images/sustainable-farm.jpg"
                alt="Direct trade farm"
                onError={handleImageError}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE]">
              <img
                src="/images/morning-fuel.jpg"
                alt="Fresh espresso pouring"
                onError={handleImageError}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* CTA Card to Registration */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#F5ECE1] border border-[#EBDCCE] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="font-serif text-2xl font-bold text-[#3A1E0E]">
              Ready to elevate your coffee offerings?
            </h3>
            <p className="text-xs text-[#6E4022]">
              Fill out our simple commercial application. Our wholesale team reviews all credentials within 1 business day.
            </p>
          </div>

          <Link
            to="/wholesale/register"
            className="px-8 py-3.5 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all whitespace-nowrap"
          >
            Apply For Wholesale Account Now →
          </Link>
        </div>
      </div>
    </div>
  );
};
