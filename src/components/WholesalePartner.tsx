import React, { useState } from 'react';
import { ArrowRight, Building2, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const WholesalePartner: React.FC = () => {
  const { showToast } = useCart();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setShowInquiryModal(false);
    showToast(`Thank you! Wholesale catalog sent to ${email}`);
    setBusinessName('');
    setEmail('');
  };

  return (
    <section id="wholesale" className="py-20 bg-white border-y border-[#EBDCCE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header & Pitch matching screenshot */}
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

        {/* 4-Image Mosaic Gallery matching the screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Tile 1: Barista steaming milk */}
          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/barista-latte-art.jpg"
              alt="Barista crafting specialty latte"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">Barista Training & Dial-In</span>
            </div>
          </div>

          {/* Tile 2: Cafe interior counter */}
          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/cafe-counter.jpg"
              alt="Artisan coffee bar setup"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">Commercial Equipment Supply</span>
            </div>
          </div>

          {/* Tile 3: Specialty cafe interior */}
          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/cafe-interior.jpg"
              alt="Sunny specialty cafe seating"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold">Custom Cafe Layouts</span>
            </div>
          </div>

          {/* Tile 4: Customer enjoying coffee */}
          <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft border border-[#EBDCCE] bg-[#F5ECE1]">
            <img
              src="/images/woman-cafe-enjoy.jpg"
              alt="Customer savoring signature roast"
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
        <div className="fixed inset-0 z-50 bg-[#140A04]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EBDCCE] space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-[#3A1E0E]">
                Wholesale Partnership Inquiry
              </h3>
              <p className="text-xs text-[#6E4022] mt-1">
                Receive wholesale pricing, sample kits, and complimentary espresso dial-in support.
              </p>
            </div>

            <form onSubmit={handleSubmitInquiry} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-[#532D16] block mb-1">
                  Business / Cafe Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Blue Ridge Artisan Cafe"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#532D16] block mb-1">
                  Business Email
                </label>
                <input
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
                  onClick={() => setShowInquiryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E4022] hover:bg-[#FAF6F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-soft"
                >
                  Request Wholesale Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
