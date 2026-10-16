import React, { useState, useEffect, useId } from 'react';
import { ArrowRight, Building2, Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { handleImageError } from '../utils/imageFallback';

export const WholesalePartner: React.FC = () => {
  const { showToast } = useCart();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const titleId = useId();

  // Escape key handler
  useEffect(() => {
    if (!showInquiryModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInquiryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInquiryModal]);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      showToast(`Demo: Wholesale inquiry simulated for "${businessName}"`);
    }, 600);
  };

  const handleCloseModal = () => {
    setShowInquiryModal(false);
    setSubmittedSuccess(false);
    setBusinessName('');
    setEmail('');
  };

  return (
    <section id="wholesale" className="py-20 bg-white border-y border-[#EBDCCE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Pitch */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Become Partner</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#3A1E0E] tracking-tight leading-tight">
              Build A Stronger Business With Premium Coffee
            </h2>
          </div>

          <div className="space-y-4 max-w-md">
            <p className="text-xs sm:text-sm text-[#6E4022] leading-relaxed">
              Join our wholesale program and serve premium coffee blends with reliable quality,
              consistent supply, and a trusted partnership for your business.
            </p>

            <button
              type="button"
              onClick={() => setShowInquiryModal(true)}
              className="inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all group"
            >
              <span>Partner With Us</span>
              <span className="w-8 h-8 rounded-full bg-terracotta-600 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        {/* 4-Image Mosaic Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/barista-latte-art.jpg"
              alt="Barista crafting specialty latte"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">Barista Training & Dial-In</span>
            </div>
          </div>

          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/cafe-counter.jpg"
              alt="Artisan coffee bar setup"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">Commercial Equipment Supply</span>
            </div>
          </div>

          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/cafe-interior.jpg"
              alt="Sunny specialty cafe seating"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">Custom Cafe Layouts</span>
            </div>
          </div>

          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/woman-cafe-enjoy.jpg"
              alt="Customer savoring signature roast"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">High Customer Retention</span>
            </div>
          </div>
        </div>

        {/* Wholesale Benefits Bar */}
        <div className="mt-8 p-6 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className="font-serif font-extrabold text-2xl text-[#3A1E0E]">35% Off</div>
            <div className="text-xs text-[#6E4022]">Tiered wholesale volume pricing</div>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-x border-[#EBDCCE] pt-3 sm:pt-0">
            <div className="font-serif font-extrabold text-2xl text-[#3A1E0E]">24-Hour</div>
            <div className="text-xs text-[#6E4022]">Roast-to-dispatch turnaround</div>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 border-[#EBDCCE] pt-3 sm:pt-0">
            <div className="font-serif font-extrabold text-2xl text-[#3A1E0E]">1-on-1</div>
            <div className="text-xs text-[#6E4022]">Dedicated coffee consultant & cupping</div>
          </div>
        </div>
      </div>

      {/* Wholesale Inquiry Modal */}
      {showInquiryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 bg-[#140A04]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          {/* Backdrop Click */}
          <div onClick={handleCloseModal} className="fixed inset-0" aria-hidden="true" />

          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EBDCCE] space-y-4 animate-in fade-in zoom-in-95 relative z-10">
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close modal"
              className="absolute top-5 right-5 text-[#8A5934] hover:text-[#3A1E0E]"
            >
              <X className="w-5 h-5" />
            </button>

            {submittedSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold">
                  Demo Submission Simulated
                </div>
                <h3 className="font-serif text-lg font-bold text-[#3A1E0E]">
                  Inquiry Received for {businessName}
                </h3>
                <p className="text-xs text-[#6E4022] leading-relaxed">
                  In production, our wholesale concierge will dispatch a sample kit and pricing tiered to {email}. Backend API integration is required for live delivery.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 rounded-full bg-[#2B170E] text-white text-xs font-bold hover:bg-[#3A1E0E]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 id={titleId} className="font-serif text-xl font-bold text-[#3A1E0E]">
                    Wholesale Partnership Inquiry
                  </h3>
                  <p className="text-xs text-[#6E4022] mt-1">
                    Receive wholesale pricing, sample kits, and complimentary espresso dial-in support.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  <strong>Notice:</strong> This form demonstrates lead capture. A production endpoint will be configured for real mail delivery.
                </div>

                <form onSubmit={handleSubmitInquiry} className="space-y-3 pt-1">
                  <div>
                    <label htmlFor="business-name" className="text-xs font-bold text-[#532D16] block mb-1">
                      Business / Cafe Name
                    </label>
                    <input
                      id="business-name"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Blue Ridge Artisan Cafe"
                      className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="business-email" className="text-xs font-bold text-[#532D16] block mb-1">
                      Business Email
                    </label>
                    <input
                      id="business-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@cafename.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E4022] hover:bg-[#FAF6F0]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-soft flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isSubmitting ? 'Submitting...' : 'Request Wholesale Kit'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
