import React, { useState, useEffect } from 'react';
import { ArrowRight, Leaf, ShieldCheck, HeartHandshake, X } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';

export const CraftedWithPurpose: React.FC = () => {
  const [showSustainabilityModal, setShowSustainabilityModal] = useState(false);

  // Escape key handler
  useEffect(() => {
    if (!showSustainabilityModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSustainabilityModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSustainabilityModal]);

  return (
    <section className="py-20 bg-[#FAF6F0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Text & Shop CTA */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#3A1E0E] tracking-tight leading-tight">
              The Finest Coffee, Crafted With Purpose
            </h2>

            <p className="text-xs sm:text-sm text-[#6E4022] leading-relaxed">
              Explore our premium coffee collection, made with responsibly sourced beans
              and perfected through expert roasting for an unforgettable taste.
            </p>

            <div>
              <a
                href="#best-sellers"
                className="inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all group"
              >
                <span>Discover Shop</span>
                <span className="w-8 h-8 rounded-full bg-terracotta-600 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </a>
            </div>
          </div>

          {/* Right Column: Sustainable Trade Sourcing Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-[#532D16] bg-[#1E100A] text-white p-8 sm:p-10 flex flex-col justify-between min-h-[340px] group">
              {/* Lush farm background */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/images/sustainable-farm.jpg"
                  alt="Sustainable coffee farm with ripe cherries"
                  onError={handleImageError}
                  className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 filter brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140A04] via-[#1E100A]/60 to-transparent" />
              </div>

              {/* Card Content */}
              <div className="relative z-10 space-y-3 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ethical Sourcing</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Sustainable Trade Sourcing.
                </h3>

                <p className="text-xs sm:text-sm text-[#D5BC9F] leading-relaxed">
                  Our Direct Trade philosophy is part commitment, part momentum, part exploration with the
                  goal of building strong relationships resulting in equitable prices being paid to farmers of
                  special coffees.
                </p>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-6">
                <button
                  type="button"
                  onClick={() => setShowSustainabilityModal(true)}
                  className="inline-flex items-center gap-2.5 pl-5 pr-1.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#2B170E] font-bold text-xs shadow-soft transition-all group/btn"
                >
                  <span>Learn More</span>
                  <span className="w-7 h-7 rounded-full bg-terracotta-600 flex items-center justify-center text-white group-hover/btn:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainable Sourcing Modal */}
      {showSustainabilityModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#140A04]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          {/* Backdrop Click */}
          <div onClick={() => setShowSustainabilityModal(false)} className="fixed inset-0" aria-hidden="true" />

          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EBDCCE] space-y-5 animate-in fade-in zoom-in-95 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">
                    Our Sourcing Standards
                  </h3>
                  <div className="text-[11px] text-[#6E4022]">Transparent, Direct, Regenerative</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSustainabilityModal(false)}
                aria-label="Close dialog"
                className="text-[#8A5934] hover:text-[#3A1E0E] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#6E4022] leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3A1E0E] block text-xs">Direct Premium Pricing</strong>
                  We pay 45% above Fair Trade minimums directly to farmers, eliminating predatory middlemen.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#3A1E0E] block text-xs">Regenerative Shade Growth</strong>
                  100% of our lots are grown under indigenous canopy cover, protecting migratory bird habitats and preventing soil erosion.
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowSustainabilityModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2B170E] text-white hover:bg-[#3A1E0E]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
