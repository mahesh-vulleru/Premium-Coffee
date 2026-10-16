import React, { useEffect, useId } from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { calculateProductPrice, formatCurrency } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const WishlistDrawer: React.FC = () => {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, toggleWishlist, addToCart, showToast } = useCart();
  const titleId = useId();

  // Escape key listener
  useEffect(() => {
    if (!isWishlistOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWishlistOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWishlistOpen, setIsWishlistOpen]);

  if (!isWishlistOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-[#140A04]/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF6F0] border-l border-[#EBDCCE] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-white border-b border-[#EBDCCE] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-600" />
              </div>
              <h2 id={titleId} className="font-serif text-lg font-bold text-[#3A1E0E]">
                Saved Roasts ({wishlist.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Close wishlist drawer"
              className="p-1.5 rounded-full text-[#8A5934] hover:text-[#3A1E0E] hover:bg-[#FAF6F0] transition-colors focus-visible:ring-2 focus-visible:ring-terracotta-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {wishlist.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#3A1E0E]">
                  Your wishlist is empty
                </h3>
                <p className="text-xs text-[#6E4022]">
                  Click the heart icon on any coffee bag to save it for your next brew.
                </p>
              </div>
            ) : (
              wishlist.map((prod) => {
                const basePrice = calculateProductPrice(prod.price, '250g');

                return (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#EBDCCE] flex items-center gap-3 shadow-xs"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      onError={handleImageError}
                      className="w-16 h-16 object-cover rounded-xl border border-[#EBDCCE] bg-[#F5ECE1] flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif font-bold text-xs text-[#3A1E0E] truncate">
                          {prod.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(prod)}
                          title="Remove from wishlist"
                          aria-label={`Remove ${prod.name} from wishlist`}
                          className="text-[#AF8359] hover:text-red-600 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#8A5934]">
                        {formatCurrency(basePrice)} (250g) • {prod.roastLevel} Roast
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(prod, 1, 'Whole Bean', '250g');
                            toggleWishlist(prod);
                            showToast(`Moved "${prod.name}" to cart`);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-[#2B170E] hover:bg-terracotta-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 bg-white border-t border-[#EBDCCE]">
            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              className="w-full py-2.5 rounded-full border border-[#D5BC9F] text-[#3A1E0E] font-bold text-xs hover:bg-[#FAF6F0] transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
