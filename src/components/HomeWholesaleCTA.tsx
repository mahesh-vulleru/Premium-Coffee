import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle, Sparkles } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';

export const HomeWholesaleCTA: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-white border-y border-[#EBDCCE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF6F0] rounded-3xl border border-[#EBDCCE] p-8 sm:p-12 overflow-hidden shadow-soft relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Commercial B2B Program</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#3A1E0E] tracking-tight leading-tight">
                Serve Extraordinary Coffee In Your Cafe, Restaurant, Or Office
              </h2>

              <p className="text-xs sm:text-sm text-[#6E4022] leading-relaxed">
                Join our partner roastery network. We supply award-winning espresso blends, single origins, barista training, and dedicated espresso machine dialing support.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-[#532D16]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>35% Commercial Discount Tier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Fresh Weekly Roasting Schedules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Barista Training & Dial-In Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Low Minimum Order Quantities</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  to="/wholesale"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all group"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Learn About Wholesale</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/wholesale/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#F5ECE1] text-[#3A1E0E] font-bold text-xs border border-[#EBDCCE] shadow-soft transition-all"
                >
                  <span>Apply for Wholesale Account</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Cafe Barista Image Mosaic */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#EBDCCE] shadow-soft">
                <img
                  src="/images/barista-latte-art.jpg"
                  alt="Barista crafting latte"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#EBDCCE] shadow-soft mt-6">
                <img
                  src="/images/cafe-counter.jpg"
                  alt="Specialty cafe bar"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

