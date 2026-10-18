import React, { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Tag, Loader2, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { calculateCartSummary, calculateProductPrice, formatCurrency, FREE_SHIPPING_THRESHOLD } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    showToast,
    setIsAuthModalOpen,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout_preview'>('cart');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const titleId = useId();

  // Escape key listener to close drawer
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const {
    subtotal,
    discountAmount,
    shippingAmount,
    finalTotal,
    freeShippingQualified,
    amountNeededForFreeShipping,
  } = calculateCartSummary(cart, discountPercent);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'FIREDUP15') {
      setDiscountPercent(15);
      setPromoMessage({ text: '15% discount applied successfully!' });
      showToast('15% discount code applied!');
    } else {
      setDiscountPercent(0);
      setPromoMessage({ text: 'Invalid promo code. Try "FIREDUP15".', error: true });
      showToast('Invalid promo code. Try "FIREDUP15"', 'error');
    }
  };

  const handleStartCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    setCheckoutStep('checkout_preview');
  };

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          promoCode: promoCode.trim().toUpperCase() === 'FIREDUP15' ? 'FIREDUP15' : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        clearCart();
        setIsCartOpen(false);
        setCheckoutStep('cart');
        showToast('Order placed successfully! Fresh roast scheduled.', 'success');
        navigate('/dashboard/customer');
      } else {
        showToast(data.error || 'Failed to place order. Please review your cart.', 'error');
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#140A04]/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF6F0] border-l border-[#EBDCCE] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-white border-b border-[#EBDCCE] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 id={titleId} className="font-serif text-lg font-bold text-[#3A1E0E]">
                {checkoutStep === 'cart'
                  ? `Your Roastery Cart (${cart.reduce((s, i) => s + i.quantity, 0)})`
                  : 'Checkout Review & Order Notice'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                setCheckoutStep('cart');
              }}
              aria-label="Close cart drawer"
              className="p-1.5 rounded-full text-[#8A5934] hover:text-[#3A1E0E] hover:bg-[#FAF6F0] transition-colors focus-visible:ring-2 focus-visible:ring-terracotta-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          {checkoutStep === 'cart' && cart.length > 0 && (
            <div className="px-5 py-2.5 bg-[#F5ECE1] border-b border-[#EBDCCE] text-xs text-[#532D16]">
              {freeShippingQualified ? (
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You unlocked FREE Doorstep Express Shipping!</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Add {formatCurrency(amountNeededForFreeShipping, true)} more for Free Shipping</span>
                    <span className="font-bold">{Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full bg-terracotta-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {checkoutStep === 'checkout_preview' ? (
              <div className="space-y-4">
                {currentUser?.shippingAddress?.street && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs space-y-1">
                    <div className="font-bold text-[#3A1E0E] flex items-center justify-between">
                      <span>Delivery Destination</span>
                      <span className="text-[10px] text-terracotta-600 uppercase font-black">Doorstep Courier</span>
                    </div>
                    <p className="text-[#532D16]">
                      {currentUser.shippingAddress.street}
                      {currentUser.shippingAddress.apartment ? `, ${currentUser.shippingAddress.apartment}` : ''}
                    </p>
                    <p className="text-[#8A5934]">
                      {currentUser.shippingAddress.city}, {currentUser.shippingAddress.state} {currentUser.shippingAddress.postalCode} • {currentUser.shippingAddress.country}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] space-y-3">
                  <h4 className="font-serif font-bold text-sm text-[#3A1E0E] border-b border-[#EBDCCE] pb-2">
                    Order Items Breakdown ({cart.reduce((s, i) => s + i.quantity, 0)} bags)
                  </h4>
                  <div className="space-y-2 divide-y divide-[#FAF6F0] max-h-60 overflow-y-auto">
                    {cart.map((item, idx) => {
                      const unitPrice = calculateProductPrice(item.product.price, item.size);
                      const lineTotal = unitPrice * item.quantity;
                      return (
                        <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-[#3A1E0E]">{item.product.name}</div>
                            <div className="text-[11px] text-[#8A5934]">
                              {item.quantity}x {item.size} • {item.grind}
                              {item.frequency && ` • ${item.frequency.replace('_', ' ')}`}
                            </div>
                          </div>
                          <div className="font-extrabold text-[#2B170E]">{formatCurrency(lineTotal)}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#EBDCCE] space-y-1 text-xs">
                    <div className="flex justify-between text-[#6E4022]">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-[#2B170E]">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount ({discountPercent}%):</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#6E4022]">
                      <span>Delivery:</span>
                      <span className="font-semibold text-[#2B170E]">
                        {shippingAmount === 0 ? 'FREE' : formatCurrency(shippingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#2B170E] pt-1.5 border-t border-[#FAF6F0]">
                      <span>Total Amount:</span>
                      <span className="text-terracotta-700">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isPlacingOrder}
                    onClick={handlePlaceOrder}
                    className="w-full py-3.5 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Scheduling Fresh Roast...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Place Fresh Roast Order ({formatCurrency(finalTotal)})</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="w-full py-2.5 rounded-xl border border-[#D5BC9F] text-[#6E4022] hover:bg-white text-xs font-bold transition-colors"
                  >
                    ← Back to Cart
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F5ECE1] text-[#AF8359] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#3A1E0E]">Your cart is empty</h3>
                <p className="text-xs text-[#6E4022]">
                  Add freshly roasted beans or specialty blends to start your coffee journey.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2 rounded-full bg-terracotta-600 text-white text-xs font-bold hover:bg-terracotta-700 transition-colors"
                >
                  Browse Best Sellers
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => {
                  const unitPrice = calculateProductPrice(item.product.price, item.size);
                  const isMaxStock = item.quantity >= item.product.stockAvailable;

                  return (
                    <div
                      key={`${item.product.id}-${item.grind}-${item.size}-${item.frequency || 'none'}-${idx}`}
                      className="p-3.5 rounded-2xl bg-white border border-[#EBDCCE] flex gap-3 items-center shadow-xs"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        onError={handleImageError}
                        className="w-16 h-16 object-cover rounded-xl border border-[#EBDCCE] bg-[#F5ECE1] flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif font-bold text-xs text-[#3A1E0E] truncate">
                            {item.product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.grind, item.size, item.frequency)}
                            className="text-[#AF8359] hover:text-red-600 p-0.5 transition-colors"
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-[#8A5934]">
                          {item.size} • {item.grind}
                          {item.frequency && (
                            <span className="ml-1 text-terracotta-600 font-semibold">
                              ({item.frequency.replace('_', ' ')})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-extrabold text-xs text-terracotta-700">
                            {formatCurrency(unitPrice, false)}
                            <span className="text-[10px] font-normal text-[#8A5934] ml-1">each</span>
                          </span>

                          <div className="flex items-center gap-2 bg-[#FAF6F0] border border-[#EBDCCE] rounded-lg px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.grind, item.size, -1, item.frequency)}
                              className="text-[#6E4022] hover:text-[#2B170E] focus-visible:ring-1 focus-visible:ring-terracotta-500"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-[#3A1E0E] min-w-3 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isMaxStock}
                              onClick={() => updateQuantity(item.product.id, item.grind, item.size, 1, item.frequency)}
                              className="text-[#6E4022] hover:text-[#2B170E] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-terracotta-500"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {checkoutStep === 'cart' && cart.length > 0 && (
            <div className="p-5 sm:p-6 bg-white border-t border-[#EBDCCE] space-y-4">
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code (e.g. FIREDUP15)"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EBDCCE] text-xs uppercase text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/30"
                    />
                    <Tag className="w-3.5 h-3.5 text-[#AF8359] absolute left-2.5 top-2 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <div className={`text-[11px] font-medium ${promoMessage.error ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {promoMessage.text}
                  </div>
                )}
              </form>

              {/* Price Calculation Lines */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6E4022]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, true)}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-{formatCurrency(discountAmount, true)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#6E4022]">
                  <span>Doorstep Shipping</span>
                  <span>{shippingAmount === 0 ? 'FREE' : formatCurrency(shippingAmount, true)}</span>
                </div>

                <div className="pt-2 border-t border-[#EBDCCE] flex justify-between font-extrabold text-sm text-[#3A1E0E]">
                  <span>Total Amount</span>
                  <span>{formatCurrency(finalTotal, true)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleStartCheckout}
                className="w-full py-3.5 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-terracotta-500"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
