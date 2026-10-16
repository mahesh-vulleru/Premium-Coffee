import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, cartTotal, showToast } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'FIREDUP15') {
      setDiscountPercent(15);
      showToast('15% discount applied!');
    } else {
      showToast('Invalid promo code. Try FIREDUP15');
    }
  };

  const discountAmount = (cartTotal * discountPercent) / 100;
  const shippingAmount = cartTotal >= 75 || cartTotal === 0 ? 0 : 9;
  const finalTotal = cartTotal - discountAmount + shippingAmount;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutComplete(true);
      clearCart();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#140A04]/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6F0] border-l border-[#EBDCCE] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-white border-b border-[#EBDCCE] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#3A1E0E]">
                Your Roastery Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full text-[#8A5934] hover:text-[#3A1E0E] hover:bg-[#FAF6F0]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {checkoutComplete ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#3A1E0E]">
                  Order Placed Successfully!
                </h3>
                <p className="text-xs text-[#6E4022] max-w-xs mx-auto leading-relaxed">
                  Your artisanal beans will be roasted tomorrow morning and dispatched with trackable courier delivery.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutComplete(false);
                    setIsCartOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#2B170E] text-white text-xs font-bold hover:bg-[#3A1E0E]"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F5ECE1] text-[#AF8359] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#3A1E0E]">
                  Your cart is empty
                </h3>
                <p className="text-xs text-[#6E4022]">
                  Add freshly roasted beans or specialty blends to start your coffee journey.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2 rounded-full bg-terracotta-600 text-white text-xs font-bold hover:bg-terracotta-700"
                >
                  Browse Best Sellers
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.grind}-${item.size}-${idx}`}
                    className="p-3.5 rounded-2xl bg-white border border-[#EBDCCE] flex gap-3 items-center shadow-xs"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-[#EBDCCE] bg-[#F5ECE1] flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif font-bold text-xs text-[#3A1E0E] truncate">
                          {item.product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.grind, item.size)}
                          className="text-[#AF8359] hover:text-red-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#8A5934]">
                        {item.size} • {item.grind}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-extrabold text-xs text-terracotta-700">
                          ${(item.product.price * (item.size === '500g' ? 1.85 : item.size === '1kg' ? 3.4 : 1)).toFixed(0)}
                        </span>

                        <div className="flex items-center gap-2 bg-[#FAF6F0] border border-[#EBDCCE] rounded-lg px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.grind, item.size, -1)}
                            className="text-[#6E4022] hover:text-[#2B170E]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-[#3A1E0E]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.grind, item.size, 1)}
                            className="text-[#6E4022] hover:text-[#2B170E]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {!checkoutComplete && cart.length > 0 && (
            <div className="p-5 sm:p-6 bg-white border-t border-[#EBDCCE] space-y-4">
              
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo code (e.g. FIREDUP15)"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#EBDCCE] text-xs uppercase text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/30"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold"
                >
                  Apply
                </button>
              </form>

              {/* Price Calculation Lines */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6E4022]">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#6E4022]">
                  <span>Doorstep Shipping</span>
                  <span>{shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}</span>
                </div>

                <div className="pt-2 border-t border-[#EBDCCE] flex justify-between font-extrabold text-sm text-[#3A1E0E]">
                  <span>Total Amount</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isCheckingOut ? 'Securing Your Roasts...' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
