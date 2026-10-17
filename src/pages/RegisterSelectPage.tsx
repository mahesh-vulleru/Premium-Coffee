import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, ShieldCheck, ArrowRight, Sparkles, Check, KeyRound } from 'lucide-react';

export const RegisterSelectPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#231208] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 hover:text-terracotta-700 uppercase tracking-widest">
            ← Return to Roastery Storefront
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Select Your Account Portal</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#2B170E] tracking-tight">
            Create Your Firedup Account
          </h1>
          <p className="text-xs sm:text-sm text-[#6E4022] max-w-xl mx-auto leading-relaxed">
            Select the account profile tailored to your coffee journey — from passionate home enthusiasts to commercial cafe partners.
          </p>
        </div>

        {/* 3 Attractive Registration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          
          {/* Card 1: Customer */}
          <div className="bg-white rounded-3xl border border-[#EBDCCE] p-6 sm:p-7 flex flex-col justify-between shadow-soft hover:shadow-elevated hover:border-terracotta-400 transition-all group relative">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-terracotta-600">
                  Individual Drinker
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#3A1E0E] mt-0.5">
                  Customer
                </h2>
                <p className="text-xs text-[#6E4022] mt-1.5 leading-relaxed">
                  For home brewers, coffee lovers, and single-bag subscribers enjoying peak-fresh micro-lots.
                </p>
              </div>

              {/* Perks */}
              <div className="space-y-2 border-t border-[#FAF6F0] pt-4 text-xs text-[#532D16]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Save delivery and shipping addresses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>15% recurring subscription discount</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Saved roasts wishlist & rapid re-order</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Free shipping on orders over ₹999</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/register/customer"
                className="w-full py-3 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow transition-all"
              >
                <span>Register as Customer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Wholesale / Business */}
          <div className="bg-white rounded-3xl border-2 border-terracotta-500/40 p-6 sm:p-7 flex flex-col justify-between shadow-elevated relative group">
            {/* Best Value / Partner Pill */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-terracotta-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              Commercial Partners
            </div>

            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                  Business & Hospitality
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#3A1E0E] mt-0.5">
                  Wholesale Partner
                </h2>
                <p className="text-xs text-[#6E4022] mt-1.5 leading-relaxed">
                  For cafes, roasters, restaurants, and corporate spaces serving specialty volume.
                </p>
              </div>

              {/* Perks */}
              <div className="space-y-2 border-t border-[#FAF6F0] pt-4 text-xs text-[#532D16]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>35% Tiered volume pricing schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>24-Hour roast-to-dispatch turnaround</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>1-on-1 Barista dial-in cupping consultant</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-[11px]">
                  <span>*Requires admin review prior to discount unlock</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/wholesale/register"
                className="w-full py-3 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                <span>Apply for Wholesale</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Admin (Restricted & Secure) */}
          <div className="bg-gradient-to-b from-[#2B170E] to-[#1E100A] text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-elevated border border-[#532D16] relative group">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center border border-white/15">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  Invitation Only
                </span>
                <h2 className="font-serif text-2xl font-bold text-white mt-0.5">
                  Roastery Admin
                </h2>
                <p className="text-xs text-[#D5BC9F] mt-1.5 leading-relaxed">
                  Strictly reserved for internal staff, head roasters, and verification managers.
                </p>
              </div>

              {/* Security Policy Details */}
              <div className="space-y-2 border-t border-white/10 pt-4 text-xs text-[#D5BC9F]">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] leading-relaxed">
                  Public registrations are blocked. An authorized cryptographic invitation token issued by the system owner is mandatory.
                </div>
                <div className="text-[11px] text-amber-300">
                  Demo token: <code className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">FIREDUP-ADMIN-SECURE-2026</code>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/register/admin"
                className="w-full py-3 rounded-full bg-white hover:bg-slate-100 text-[#2B170E] font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                <span>Enter Admin Invite Setup</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Existing account prompt */}
        <div className="text-center text-xs text-[#6E4022] pt-4">
          Already registered with Firedup Coffee?{' '}
          <Link to="/login" className="font-bold text-terracotta-600 hover:text-terracotta-700 underline">
            Sign In to your account →
          </Link>
        </div>

      </div>
    </div>
  );
};

