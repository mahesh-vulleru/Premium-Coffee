import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/CartContext';
import {
  Building2,
  Clock,
  Download,
  Mail,
  TrendingUp,
  LogOut,
  ShoppingBag,
  Sparkles,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export const WholesaleDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, logout } = useAuth();
  const { showToast } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center animate-pulse">
            <Building2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-serif text-lg font-bold text-[#3A1E0E]">Loading Wholesale Portal...</h2>
            <p className="text-xs text-[#8A5934]">Verifying commercial credentials & authorization</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'wholesale' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-soft text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#3A1E0E]">
            Wholesale Partner Portal
          </h2>
          <p className="text-xs text-[#6E4022]">
            Please sign in with your approved commercial wholesale credentials to view volume pricing and price sheets.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[#2B170E] text-white text-xs font-bold hover:bg-[#3A1E0E]"
            >
              Sign In as Wholesale Partner
            </Link>
            <Link
              to="/wholesale/register"
              className="w-full py-2.5 rounded-xl bg-[#FAF6F0] text-[#3A1E0E] text-xs font-bold hover:bg-[#F5ECE1]"
            >
              Submit Commercial Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const details = currentUser.wholesaleDetails;
  const isApproved = details?.status === 'approved';

  const handleDownloadPriceSheet = async () => {
    try {
      const res = await fetch('/api/v1/wholesale/price-sheet', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Commercial Price Sheet loaded: ${data.tiers.length} verified volume tiers`, 'success');
      } else {
        showToast(data.error || 'Access restricted: Commercial partner verification required.', 'error');
      }
    } catch {
      showToast('Unable to reach wholesale server.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of wholesale session', 'info');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Profile Bar */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-elevated">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  {details?.businessName || currentUser.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isApproved ? 'Approved Partner' : 'Review Pending'}
                </span>
              </div>
              <p className="text-xs text-[#D5BC9F] mt-0.5">
                Primary Contact: {currentUser.name} ({currentUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Wholesale Order</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/40 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Status Callout Banner */}
        {!isApproved && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Application In Review:</span> Our roasting director is verifying your business credentials and tax ID. Once approved, the 35% commercial volume pricing will automatically apply to all bulk beans in your cart.
            </div>
          </div>
        )}

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8A5934]">
              <span>Commercial Discount Tier</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">
              {isApproved ? '35% OFF' : 'Standard (Reviewing)'}
            </div>
            <p className="text-[11px] text-[#6E4022]">Applied automatically on checkout</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8A5934]">
              <span>Projected Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[#3A1E0E]">
              {details?.monthlyVolumeKg || '50'} kg / month
            </div>
            <p className="text-[11px] text-[#6E4022]">Weekly fresh roast allocation</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8A5934]">
              <span>Commercial Tax Identifier</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-mono font-bold text-[#3A1E0E]">
              {details?.taxId || 'Pending'}
            </div>
            <p className="text-[11px] text-[#6E4022]">State tax exemption active</p>
          </div>
        </div>

        {/* 2-Column: Commercial Business Profile & Account Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4">
            <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700" />
              Verified Commercial Profile
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF6F0] p-4 rounded-2xl border border-[#EBDCCE]">
              <div>
                <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Business Entity</span>
                <span className="font-bold text-[#3A1E0E]">{details?.businessName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Business Classification</span>
                <span className="capitalize font-semibold text-[#532D16]">{details?.businessType}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#EBDCCE]">
                <span className="text-[10px] text-[#8A5934] uppercase font-bold block">Delivery Facility</span>
                <span className="text-[#532D16]">
                  {details?.deliveryAddress
                    ? `${details.deliveryAddress.street}, ${details.deliveryAddress.city}, ${details.deliveryAddress.state} ${details.deliveryAddress.postalCode}`
                    : 'Address on file'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPriceSheet}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Wholesale Price Sheet (PDF)</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EBDCCE] shadow-soft space-y-4">
            <h3 className="font-serif font-bold text-base text-[#3A1E0E] flex items-center gap-2">
              <Mail className="w-4 h-4 text-terracotta-600" />
              Dedicated Roastery Rep
            </h3>

            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] space-y-2 text-xs text-[#532D16]">
              <div className="font-bold text-[#3A1E0E]">Marcus Reed</div>
              <div className="text-[11px] text-[#8A5934]">Director of Wholesale Partnerships</div>
              <div className="pt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#AF8359]" />
                  <span>wholesale@firedupcoffee.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#AF8359]" />
                  <span>+1 (800) 555-ROAST (Ext. 4)</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#8A5934]">
              Contact Marcus directly for emergency weekend lot allocations or customized house blend formulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
