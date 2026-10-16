import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Eye,
  Star,
  ArrowRight,
  Flame,
  Check,
  Sparkles,
} from 'lucide-react';
import { COFFEE_PRODUCTS } from '../data/coffeeData';
import type { CoffeeProduct, CartItem } from '../types/coffee';
import { useCart } from '../context/CartContext';
import {
  calculateProductPrice,
  calculateOriginalProductPrice,
  formatCurrency,
} from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const FeaturedProducts: React.FC = () => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    showToast,
  } = useCart();

  const [selectedSizes, setSelectedSizes] = useState<Record<string, CartItem['size']>>({});
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  // Curate top 4 featured products for landing page
  const featured = COFFEE_PRODUCTS.slice(0, 4);

  const handleQuickAdd = (product: CoffeeProduct) => {
    const size = selectedSizes[product.id] || '250g';
    addToCart(product, 1, 'Whole Bean', size);
    setAddedSuccessId(product.id);
    showToast(`Added 1× ${product.name} (${size}) to cart`);
    setTimeout(() => {
      setAddedSuccessId((prev) => (prev === product.id ? null : prev));
    }, 1800);
  };

  return (
    <section className="py-16 sm:py-20 bg-[#FAF6F0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-600 text-xs font-bold tracking-wider uppercase">
              <Flame className="w-3.5 h-3.5 text-terracotta-500" />
              <span>Master Roaster Selection</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#3A1E0E] tracking-tight leading-tight">
              Featured Specialty Roasts
            </h2>
            <p className="text-xs sm:text-sm text-[#6E4022] leading-relaxed">
              Hand-picked lots roasted in small batches each morning for peerless aroma, balance, and sweetness.
            </p>
          </div>

          <div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#F5ECE1] text-[#3A1E0E] text-xs font-bold border border-[#EBDCCE] shadow-soft transition-all group"
            >
              <span>View Full Catalogue (12+ Roasts)</span>
              <ArrowRight className="w-3.5 h-3.5 text-terracotta-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 4 Featured Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => {
            const currentSize = selectedSizes[product.id] || '250g';
            const price = calculateProductPrice(product.price, currentSize);
            const originalPrice = calculateOriginalProductPrice(
              product.originalPrice,
              currentSize
            );
            const inWish = isInWishlist(product.id);
            const isAdded = addedSuccessId === product.id;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-[#EBDCCE] shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between group relative"
              >
                {/* Sale / Tag Badge */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  {product.isSale && (
                    <span className="px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                      Sale
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#6E4022] border border-[#EBDCCE] text-[10px] font-semibold">
                    {product.roastLevel} Roast
                  </span>
                </div>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all ${
                    inWish
                      ? 'bg-terracotta-500 text-white shadow-md'
                      : 'bg-white/80 text-[#8A5934] hover:text-terracotta-500 hover:bg-white shadow-soft'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWish ? 'fill-white' : ''}`} />
                </button>

                {/* Product Image & Quick-View overlay */}
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF6F0] border border-[#EBDCCE] mb-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(product)}
                      className="absolute inset-0 bg-[#2B170E]/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Quick View</span>
                    </button>
                  </div>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-1.5 text-xs mb-1">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </div>
                    <span className="font-bold text-[#3A1E0E]">{product.rating}</span>
                    <span className="text-[#8A5934] text-[11px]">({product.reviewsCount})</span>
                  </div>

                  {/* Product Title & Tasting Notes */}
                  <h3 className="font-serif font-bold text-base text-[#3A1E0E] line-clamp-1 group-hover:text-terracotta-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-[#8A5934] line-clamp-1 mt-0.5">
                    {product.tastingNotes.join(' • ')}
                  </p>

                  {/* Bag Size Pills */}
                  <div className="flex items-center gap-1 mt-3">
                    {(['250g', '500g', '1kg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() =>
                          setSelectedSizes((prev) => ({ ...prev, [product.id]: sz }))
                        }
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                          currentSize === sz
                            ? 'bg-[#3A1E0E] text-white'
                            : 'bg-[#FAF6F0] text-[#6E4022] hover:bg-[#F5ECE1]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price & Add to Cart */}
                <div className="pt-4 border-t border-[#EBDCCE]/60 mt-4 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-extrabold text-[#3A1E0E] leading-none">
                      {formatCurrency(price)}
                    </div>
                    {originalPrice && originalPrice > price && (
                      <span className="text-[11px] text-[#AF8359] line-through block mt-0.5">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(product)}
                    disabled={isAdded}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#2B170E] hover:bg-[#3A1E0E] text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-terracotta-400" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner to Full Shop & Quiz */}
        <div className="mt-12 p-6 rounded-3xl bg-[#F5ECE1] border border-[#EBDCCE] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-terracotta-500/10 text-terracotta-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#3A1E0E]">
                Looking for your ideal roast or brew method?
              </h4>
              <p className="text-xs text-[#6E4022]">
                Explore advanced grind options, roast comparisons, and take our 60-second coffee quiz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/shop"
              className="px-5 py-2.5 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all shadow-soft flex items-center gap-1.5"
            >
              <span>Explore All Coffees</span>
              <ArrowRight className="w-3.5 h-3.5 text-terracotta-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
