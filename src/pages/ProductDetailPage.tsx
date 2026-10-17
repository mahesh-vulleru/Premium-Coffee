import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Star,
  Check,
  ShieldCheck,
  Coffee,
  Sparkles,
  Loader2,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { fetchProductById } from '../services/productService';
import type { CoffeeProduct, BagSize, GrindOption } from '../types/coffee';
import { useCart } from '../context/CartContext';
import {
  formatCurrency,
  calculateProductPrice,
  calculateOriginalProductPrice,
} from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen, showToast } = useCart();

  const [product, setProduct] = useState<CoffeeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<BagSize>('250g');
  const [selectedGrind, setSelectedGrind] = useState<GrindOption>('Whole Bean');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProductById(id);
        if (isMounted) {
          if (data) {
            setProduct(data);
          } else {
            setError('The requested coffee roast was not found in our active catalogue.');
          }
        }
      } catch {
        if (isMounted) {
          setError('Failed to load product details from the roastery.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center animate-pulse">
            <Coffee className="w-8 h-8 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-serif text-lg font-bold text-[#3A1E0E]">
              Preparing Roast Profile...
            </h2>
            <p className="text-xs text-[#8A5934]">
              Loading harvest details, cupping notes, and roast guides
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-soft text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#3A1E0E]">Roast Unavailable</h2>
          <p className="text-xs text-[#6E4022] leading-relaxed">
            {error || 'We could not locate this coffee in our current seasonal harvest selection.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/shop"
              className="w-full py-3 rounded-2xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white text-xs font-bold transition-all"
            >
              Back to Full Roastery Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = calculateProductPrice(product.price, selectedSize);
  const originalPrice = product.originalPrice
    ? calculateOriginalProductPrice(product.originalPrice, selectedSize)
    : null;
  const isWishlisted = isInWishlist(product.id);
  const maxStock = product.stockAvailable > 0 ? product.stockAvailable : 20;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, quantity, selectedGrind, selectedSize);
    showToast(`Added ${quantity}x "${product.name}" (${selectedSize}) to cart`, 'success');
    setAddedSuccess(true);
    setIsAdding(false);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const grindOptions: { id: GrindOption; label: string; desc: string }[] = [
    { id: 'Whole Bean', label: 'Whole Bean', desc: 'Max aroma freshness, grind before brewing' },
    { id: 'French Press', label: 'French Press', desc: 'Coarse grind for immersion brew' },
    { id: 'Pour Over', label: 'Pour Over / V60', desc: 'Medium-fine grind for clean pour overs' },
    { id: 'Espresso', label: 'Espresso', desc: 'Fine grind for pressurized portafilters & moka pots' },
    { id: 'Cold Brew', label: 'Cold Brew', desc: 'Extra coarse for 16-24 hour steep' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8A5934]">
          <Link to="/" className="hover:text-[#3A1E0E]">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#3A1E0E]">Shop</Link>
          <span>/</span>
          <span className="font-bold text-[#3A1E0E] truncate max-w-xs">{product.name}</span>
        </div>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Product Image & Badges */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-[#EBDCCE] shadow-soft">
              <img
                src={product.image}
                alt={product.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2B170E]/85 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                  {product.roastLevel} Roast
                </span>
                {product.isSale && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                    {product.saleLabel || 'Harvest Deal'}
                  </span>
                )}
              </div>

              {/* Wishlist Toggle Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#2B170E] flex items-center justify-center shadow-soft border border-[#EBDCCE] transition-transform active:scale-95"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#8A5934]'
                  }`}
                />
              </button>
            </div>

            {/* Micro-Roaster Freshness Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft flex items-center justify-between text-xs text-[#532D16]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-[#3A1E0E]">Roasted Fresh to Order</div>
                  <div className="text-[11px] text-[#8A5934]">Degassing valve packaging preserves optimal aroma</div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="font-bold text-emerald-700">100% Specialty Grade</div>
                <div className="text-[11px] text-[#8A5934]">SCA 84+ Cupping Score</div>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing, & Customisation */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Origin & Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-widest">
                <Compass className="w-3.5 h-3.5" />
                <span>{product.origin}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#3A1E0E] tracking-tight">
                {product.name}
              </h1>

              {product.subtitle && (
                <p className="text-sm text-[#6E4022] font-medium leading-relaxed">
                  {product.subtitle}
                </p>
              )}

              {/* Rating & Stock */}
              <div className="flex items-center gap-4 pt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-[#8A5934] font-normal">
                    ({product.reviewsCount} roaster reviews)
                  </span>
                </div>
                <span className="text-stone-300">•</span>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>In Stock ({product.stockAvailable} bags ready)</span>
                </div>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft flex items-baseline gap-3">
              <span className="font-serif text-3xl font-black text-[#2B170E]">
                {formatCurrency(currentPrice)}
              </span>
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-sm line-through text-[#8A5934] font-medium">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <span className="text-xs text-[#8A5934] font-medium">
                (Inclusive of all taxes • Free shipping over {formatCurrency(999)})
              </span>
            </div>

            {/* Tasting Notes */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-[#8A5934] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Cupping Profile & Flavor Notes</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.tastingNotes.map((note, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#EBDCCE] text-xs font-bold text-[#532D16] shadow-soft"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>

            {/* Bag Size Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-black uppercase tracking-wider text-[#8A5934]">
                  Select Bag Size
                </label>
                <span className="text-[11px] text-[#8A5934]">
                  {selectedSize === '250g' ? 'Standard 20 Cups' : selectedSize === '500g' ? 'Roaster Value 40 Cups' : 'Club Batch 80 Cups'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['250g', '500g', '1kg'] as BagSize[]).map((size) => {
                  const sizePrice = calculateProductPrice(product.price, size);
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all border text-center ${
                        isSelected
                          ? 'bg-[#2B170E] text-white border-[#2B170E] shadow-soft'
                          : 'bg-white text-[#532D16] border-[#EBDCCE] hover:bg-[#FAF6F0]'
                      }`}
                    >
                      <div className="text-sm font-black">{size}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-terracotta-300' : 'text-[#8A5934]'}`}>
                        {formatCurrency(sizePrice)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grind Option Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-[#8A5934] block">
                Select Grind Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {grindOptions.map((opt) => {
                  const isSelected = selectedGrind === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedGrind(opt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-white border-terracotta-600 ring-2 ring-terracotta-500/20'
                          : 'bg-white/60 border-[#EBDCCE] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3A1E0E]">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-terracotta-600" />}
                      </div>
                      <p className="text-[10px] text-[#8A5934] mt-0.5 line-clamp-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Add to Cart Controls */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity Spinner */}
                <div className="flex items-center border border-[#EBDCCE] bg-white rounded-2xl p-1 shadow-soft">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#532D16] hover:bg-[#FAF6F0] disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-xs text-[#2B170E]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#532D16] hover:bg-[#FAF6F0] disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 py-3.5 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adding to Cart...</span>
                    </>
                  ) : addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart • {formatCurrency(currentPrice * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

              {addedSuccess && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
                  <span>Roast added to your cart drawer!</span>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="font-bold underline hover:text-emerald-950"
                  >
                    View Cart Now →
                  </button>
                </div>
              )}
            </div>

            {/* Roaster Brew Guide if Available */}
            {product.brewGuide && (
              <div className="p-5 rounded-3xl bg-white border border-[#EBDCCE] shadow-soft space-y-3 pt-4">
                <h3 className="font-serif font-bold text-sm text-[#3A1E0E] flex items-center gap-2 border-b border-[#FAF6F0] pb-2">
                  <Coffee className="w-4 h-4 text-terracotta-600" />
                  Official Roaster Brew Guide
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Method</span>
                    <span className="font-bold text-[#3A1E0E]">{product.brewGuide.method}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Ratio</span>
                    <span className="font-bold text-[#3A1E0E]">{product.brewGuide.ratio}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Temp</span>
                    <span className="font-bold text-[#3A1E0E]">{product.brewGuide.temperature}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5934] block">Grind</span>
                    <span className="font-bold text-[#3A1E0E]">{product.brewGuide.grindRecommendation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#8A5934]">
                About This Micro-Lot
              </h3>
              <p className="text-xs text-[#532D16] leading-relaxed">
                {product.description}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
