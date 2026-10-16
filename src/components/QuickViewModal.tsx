import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { CartItem } from '../types/coffee';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist } = useCart();
  const [selectedGrind, setSelectedGrind] = useState<CartItem['grind']>('Whole Bean');
  const [selectedSize, setSelectedSize] = useState<CartItem['size']>('250g');
  const [quantity, setQuantity] = useState(1);

  if (!quickViewProduct) return null;

  const inWishlist = isInWishlist(quickViewProduct.id);

  const priceMultiplier = selectedSize === '500g' ? 1.85 : selectedSize === '1kg' ? 3.4 : 1;
  const currentPrice = Math.round(quickViewProduct.price * priceMultiplier);

  const handleAddToCart = () => {
    addToCart(quickViewProduct, quantity, selectedGrind, selectedSize);
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#140A04]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full border border-[#EBDCCE] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-[#532D16] hover:bg-[#FAF6F0] flex items-center justify-center border border-[#EBDCCE] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Image */}
          <div className="p-6 bg-[#FAF6F0] border-b md:border-b-0 md:border-r border-[#EBDCCE] flex flex-col items-center justify-center relative">
            {quickViewProduct.isSale && (
              <span className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                Sale
              </span>
            )}
            <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-white p-3 border border-[#EBDCCE] shadow-sm flex items-center justify-center">
              <img
                src={quickViewProduct.image}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="mt-3 text-center text-xs text-[#8A5934] font-medium">
              Origin: {quickViewProduct.origin}
            </div>
          </div>

          {/* Right Column: Details & Selectors */}
          <div className="p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-500 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-[#3A1E0E]">{quickViewProduct.rating}</span>
                <span className="text-[#AF8359]">({quickViewProduct.reviewsCount} verified reviews)</span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3A1E0E]">
                {quickViewProduct.name}
              </h3>

              <div className="text-xs text-[#8A5934]">
                {quickViewProduct.subtitle}
              </div>

              {/* Price */}
              <div className="pt-1 flex items-baseline gap-2">
                <span className="font-extrabold text-2xl text-terracotta-700">
                  ${currentPrice}
                </span>
                {quickViewProduct.originalPrice && (
                  <span className="text-xs text-[#AF8359] line-through">
                    ${Math.round(quickViewProduct.originalPrice * priceMultiplier)}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#6E4022] leading-relaxed pt-1">
                {quickViewProduct.description}
              </p>

              {/* Tasting Notes */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5934] block mb-1">
                  Tasting Notes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickViewProduct.tastingNotes.map((note) => (
                    <span
                      key={note}
                      className="px-2 py-0.5 rounded-md bg-[#FAF6F0] border border-[#EBDCCE] text-[10px] font-bold text-[#532D16]"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bag Size */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5934] block mb-1">
                  Bag Size
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['250g', '500g', '1kg'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedSize === size
                          ? 'bg-[#2B170E] text-white border-[#2B170E]'
                          : 'bg-[#FAF6F0] border-[#EBDCCE] text-[#532D16] hover:bg-[#EBDCCE]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grind Selector */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5934] block mb-1">
                  Grind Preference
                </span>
                <select
                  value={selectedGrind}
                  onChange={(e) => setSelectedGrind(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0] text-xs font-medium text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/30"
                >
                  <option value="Whole Bean">Whole Bean (Optimal Freshness)</option>
                  <option value="French Press">French Press (Coarse)</option>
                  <option value="Pour Over">Pour Over (Medium)</option>
                  <option value="Espresso">Espresso (Fine)</option>
                  <option value="Cold Brew">Cold Brew (Extra Coarse)</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#EBDCCE] flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#FAF6F0] border border-[#EBDCCE] rounded-xl px-2.5 py-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-xs text-[#6E4022] hover:text-[#2B170E] px-1 font-bold"
                >
                  -
                </button>
                <span className="text-xs font-bold text-[#3A1E0E] min-w-4 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-xs text-[#6E4022] hover:text-[#2B170E] px-1 font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart • ${currentPrice * quantity}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct)}
                title="Save to Wishlist"
                className={`p-2.5 rounded-xl border transition-colors ${
                  inWishlist
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'border-[#EBDCCE] text-[#6E4022] hover:bg-[#FAF6F0]'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
