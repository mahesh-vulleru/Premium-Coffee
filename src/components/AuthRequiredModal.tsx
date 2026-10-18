import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, X, ArrowRight, UserPlus, LogIn, Sparkles, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/useCart';
import { formatCurrency, calculateProductPrice } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';
import { getSafeInternalRedirect } from '../utils/authRedirect';

export const AuthRequiredModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingAuthAction,
  } = useCart();

  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store last focused element when opening modal, and restore focus on close
  useEffect(() => {
    if (isAuthModalOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus primary button when dialog renders
      const timer = setTimeout(() => {
        primaryBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isAuthModalOpen]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const currentPath = location.pathname + location.search;
  const returnTarget = getSafeInternalRedirect(pendingAuthAction?.returnUrl || currentPath, '/');
  const encodedRedirect = encodeURIComponent(returnTarget);

  const handleSignIn = () => {
    setIsAuthModalOpen(false);
    navigate(`/login?redirect=${encodedRedirect}`);
  };

  const handleCreateAccount = () => {
    setIsAuthModalOpen(false);
    navigate(`/register/customer?redirect=${encodedRedirect}`);
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
  };

  const product = pendingAuthAction?.product;
  const isCartAction = pendingAuthAction?.type === 'cart';
  const size = pendingAuthAction?.size || '250g';
  const grind = pendingAuthAction?.grind || 'Whole Bean';
  const quantity = pendingAuthAction?.quantity || 1;
  const unitPrice = product ? calculateProductPrice(product.price, size) : 0;
  const totalPrice = unitPrice * quantity;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-desc"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#140A04]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-2xl space-y-6 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close authentication modal"
          className="absolute top-5 right-5 p-2 rounded-full text-[#8A5934] hover:text-[#2B170E] hover:bg-[#EBDCCE]/60 transition-colors focus-visible:ring-2 focus-visible:ring-terracotta-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#2B170E] text-amber-500 mx-auto flex items-center justify-center shadow-md">
            <Flame className="w-7 h-7 fill-amber-500" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-terracotta-500/10 text-terracotta-700 text-[10px] font-black uppercase tracking-widest border border-terracotta-500/20">
            {isCartAction ? (
              <>
                <ShoppingBag className="w-3 h-3 text-terracotta-600" />
                <span>Cart Authentication</span>
              </>
            ) : (
              <>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>Wishlist Authentication</span>
              </>
            )}
          </div>

          <h2 id="auth-modal-title" className="font-serif text-2xl sm:text-3xl font-black text-[#2B170E] tracking-tight">
            Sign In to Continue
          </h2>

          <p id="auth-modal-desc" className="text-xs sm:text-sm text-[#6E4022] leading-relaxed max-w-sm mx-auto">
            {isCartAction
              ? 'Please sign in or create a customer account to add artisanal roasts to your shopping cart.'
              : 'Please sign in or create an account to save your favorite specialty coffees to your personal wishlist.'}
          </p>
        </div>

        {/* Intended Selection Preview Card */}
        {product && (
          <div className="p-3.5 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft space-y-2 text-left">
            <div className="flex items-center gap-3">
              <img
                src={product.image}
                alt={product.name}
                onError={handleImageError}
                className="w-14 h-14 rounded-xl object-cover border border-[#EBDCCE] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold text-terracotta-600 tracking-wider">
                  {product.origin} • {product.roastLevel}
                </div>
                <div className="font-serif font-bold text-sm text-[#2B170E] truncate">
                  {product.name}
                </div>
                <div className="text-xs font-bold text-[#532D16] mt-0.5">
                  {formatCurrency(totalPrice)}{' '}
                  {quantity > 1 && (
                    <span className="text-[11px] font-normal text-[#8A5934]">
                      ({quantity}x {formatCurrency(unitPrice)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Variation Pills for Cart Actions */}
            {isCartAction && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#FAF6F0] text-[11px] text-[#532D16]">
                <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0] font-semibold border border-[#EBDCCE]">
                  Size: {size}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0] font-semibold border border-[#EBDCCE]">
                  Grind: {grind}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0] font-semibold border border-[#EBDCCE]">
                  Qty: {quantity}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Your selection will be added automatically right after signing in.</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            ref={primaryBtnRef}
            type="button"
            onClick={handleSignIn}
            className="w-full py-3 px-4 rounded-2xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group focus-visible:ring-2 focus-visible:ring-terracotta-500"
          >
            <LogIn className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-4 h-4 ml-auto text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs sm:text-sm font-bold border border-[#EBDCCE] transition-all flex items-center justify-center gap-2 hover:border-[#D5BC9F] focus-visible:ring-2 focus-visible:ring-terracotta-500"
          >
            <UserPlus className="w-4 h-4 text-terracotta-600" />
            <span>Create New Customer Account</span>
          </button>
        </div>

        {/* Guest Return Note */}
        <div className="pt-2 border-t border-[#EBDCCE]/60 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-semibold text-[#8A5934] hover:text-[#2B170E] hover:underline transition-colors"
          >
            Continue Browsing Storefront as Guest
          </button>
        </div>

      </div>
    </div>
  );
};

