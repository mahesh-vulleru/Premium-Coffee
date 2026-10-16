import React, { useState, useMemo } from 'react';
import {
  Heart,
  ShoppingBag,
  Eye,
  Star,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  Check,
  Scale,
  X,
  Plus,
  Minus,
  Flame,
  Coffee,
} from 'lucide-react';
import { COFFEE_PRODUCTS } from '../data/coffeeData';
import type { CoffeeProduct, CartItem } from '../types/coffee';
import { useCart } from '../context/CartContext';
import { CoffeeFinderModal } from './CoffeeFinderModal';
import { CompareModal } from './CompareModal';
import {
  calculateProductPrice,
  calculateOriginalProductPrice,
  formatCurrency,
} from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

type FilterTab = 'all' | 'new_arrivals' | 'best_sellers' | 'top_rates' | 'sale';
type RoastFilter = 'all' | 'Medium' | 'Medium-Dark' | 'Dark';
type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'reviews';

export const BestSellerSection: React.FC = () => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    selectedCategory,
    setSelectedCategory,
    showToast,
  } = useCart();

  // State management
  const [activeTab, setActiveTab] = useState<FilterTab>('best_sellers');
  const [roastFilter, setRoastFilter] = useState<RoastFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Per-card selections: bag size, grind, quantity, and added feedback
  const [selectedSizes, setSelectedSizes] = useState<Record<string, CartItem['size']>>({});
  const [selectedGrinds, setSelectedGrinds] = useState<Record<string, CartItem['grind']>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  // Modals & Comparison state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Compare toggling
  const toggleCompare = (product: CoffeeProduct) => {
    if (compareIds.includes(product.id)) {
      setCompareIds((prev) => prev.filter((id) => id !== product.id));
      showToast(`Removed "${product.name}" from comparison`, 'info');
    } else {
      if (compareIds.length >= 3) {
        showToast('You can compare up to 3 roasts at a time.', 'info');
        return;
      }
      setCompareIds((prev) => [...prev, product.id]);
      showToast(`Added "${product.name}" to comparison`);
    }
  };

  // Quantity updates
  const handleQuantityDelta = (productId: string, delta: number) => {
    const product = COFFEE_PRODUCTS.find((p) => p.id === productId);
    const maxStock = product && product.stockAvailable > 0 ? product.stockAvailable : 10;
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      if (current + delta > maxStock && product) {
        showToast(`Only ${maxStock} bags available for "${product.name}"`, 'info');
      }
      return { ...prev, [productId]: next };
    });
  };

  // Quick Add with size and grind
  const handleAddToCart = (product: CoffeeProduct) => {
    const size = selectedSizes[product.id] || '250g';
    const grind = selectedGrinds[product.id] || 'Whole Bean';
    const qty = quantities[product.id] || 1;

    addToCart(product, qty, grind, size);

    setAddedSuccessId(product.id);
    setTimeout(() => {
      setAddedSuccessId(null);
    }, 1500);
  };

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    return COFFEE_PRODUCTS.filter((prod) => {
      // 1. Tab filter
      if (activeTab === 'sale' && !prod.isSale) return false;
      if (activeTab !== 'all' && activeTab !== 'sale' && prod.tag !== activeTab) return false;

      // 2. Category filter (from Category ticker or chip)
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) return false;

      // 3. Roast level filter
      if (roastFilter !== 'all' && prod.roastLevel !== roastFilter) return false;

      // 4. In-section search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesOrigin = prod.origin.toLowerCase().includes(query);
        const matchesNotes = prod.tastingNotes.some((n) => n.toLowerCase().includes(query));
        const matchesRoast = prod.roastLevel.toLowerCase().includes(query);
        if (!matchesName && !matchesOrigin && !matchesNotes && !matchesRoast) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviewsCount - a.reviewsCount;
        default:
          return 0;
      }
    });
  }, [activeTab, selectedCategory, roastFilter, searchQuery, sortBy]);

  // Compared products object array
  const comparedProducts = useMemo(() => {
    return COFFEE_PRODUCTS.filter((p) => compareIds.includes(p.id));
  }, [compareIds]);

  // Count items on sale
  const saleCount = useMemo(() => {
    return COFFEE_PRODUCTS.filter((p) => p.isSale).length;
  }, []);

  return (
    <section id="best-sellers" className="py-16 sm:py-20 bg-[#FAF6F0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBDCCE]/80 border border-[#D5BC9F] text-xs font-bold text-[#532D16]">
            <Flame className="w-3.5 h-3.5 text-terracotta-600" />
            <span>Artisan Roastery Catalog</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#2B170E] tracking-tight">
            Our Best Seller & Coffee Shop
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#6E4022] max-w-2xl mx-auto leading-relaxed">
            Freshly roasted in small micro-batches, customized with your grind size and roasted to order for maximum aromatic freshness.
          </p>

          {/* Interactive Coffee Matcher Quiz Banner */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsQuizOpen(true)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold hover:bg-amber-500/25 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Unsure which roast suits you? Take the 30-sec Coffee Finder Quiz</span>
              <span className="font-extrabold underline text-amber-800">Start Quiz →</span>
            </button>
          </div>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EBDCCE] shadow-soft mb-8 space-y-4">
          
          {/* Row 1: Primary Category Tabs & In-Section Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Primary Filter Tabs */}
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] overflow-x-auto max-w-full">
              {[
                { id: 'all' as FilterTab, label: 'All Roasts', count: COFFEE_PRODUCTS.length },
                { id: 'best_sellers' as FilterTab, label: 'Best Sellers', count: 4 },
                { id: 'new_arrivals' as FilterTab, label: 'Now Arrivals', count: 3 },
                { id: 'top_rates' as FilterTab, label: 'Top Rates', count: 3 },
                { id: 'sale' as FilterTab, label: 'On Sale', count: saleCount, highlight: true },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#2B170E] text-white shadow-soft'
                      : 'text-[#532D16] hover:text-terracotta-600 hover:bg-white/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.highlight
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-[#EBDCCE] text-[#6E4022]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* In-Section Live Search */}
            <div className="relative min-w-[260px] sm:min-w-[300px]">
              <Search className="w-4 h-4 text-[#AF8359] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roasts, origin (e.g. Ethiopia, Vanilla)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] placeholder-[#AF8359] focus:outline-none focus:ring-2 focus:ring-terracotta-500/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AF8359] hover:text-[#2B170E]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* Row 2: Roast Level Filter, Sort Dropdown & View Mode Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#FAF6F0]">
            
            {/* Roast Level Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#6E4022] mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Roast:</span>
              </span>
              {[
                { id: 'all' as RoastFilter, label: 'All Levels' },
                { id: 'Medium' as RoastFilter, label: 'Medium (●●●○○)' },
                { id: 'Medium-Dark' as RoastFilter, label: 'Medium-Dark (●●●●○)' },
                { id: 'Dark' as RoastFilter, label: 'Dark (●●●●●)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoastFilter(item.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    roastFilter === item.id
                      ? 'bg-terracotta-600 text-white shadow-xs'
                      : 'bg-[#FAF6F0] text-[#6E4022] hover:bg-[#EBDCCE] border border-[#EBDCCE]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Sort & View Mode */}
            <div className="flex items-center gap-3">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-xs text-[#6E4022]">
                <span className="font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-[#FAF6F0] border border-[#EBDCCE] text-xs text-[#2B170E] font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                >
                  <option value="featured">Featured / Best Sellers</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                </select>
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center rounded-lg bg-[#FAF6F0] border border-[#EBDCCE] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-xs text-terracotta-600' : 'text-[#8A5934] hover:text-[#2B170E]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Detailed List View"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-xs text-terracotta-600' : 'text-[#8A5934] hover:text-[#2B170E]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Active Filter Indicators */}
          {(selectedCategory !== 'all' || roastFilter !== 'all' || searchQuery || activeTab !== 'best_sellers') && (
            <div className="flex items-center gap-2 pt-2 text-xs text-[#6E4022] flex-wrap border-t border-[#FAF6F0]">
              <span className="font-bold">Active filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EBDCCE] text-[#3A1E0E] capitalize font-medium">
                  Brew: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>×</button>
                </span>
              )}
              {roastFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EBDCCE] text-[#3A1E0E] font-medium">
                  Roast: {roastFilter}
                  <button onClick={() => setRoastFilter('all')}>×</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EBDCCE] text-[#3A1E0E] font-medium">
                  Query: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>×</button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('best_sellers');
                  setRoastFilter('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setSortBy('featured');
                }}
                className="text-xs font-bold text-terracotta-600 hover:underline ml-2"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-[#6E4022] mb-4 px-1">
          <span>
            Showing <strong className="text-[#2B170E]">{processedProducts.length}</strong> of {COFFEE_PRODUCTS.length} artisan roasts
          </span>
          <span className="text-[#8A5934] font-medium">
            🔥 Free shipping on orders over $75 • Roasted fresh weekly
          </span>
        </div>

        {/* Product List Empty State */}
        {processedProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#EBDCCE] p-8 space-y-3">
            <Coffee className="w-10 h-10 text-[#AF8359] mx-auto opacity-60" />
            <h3 className="font-serif text-lg font-bold text-[#2B170E]">No roasts match your exact filters</h3>
            <p className="text-xs text-[#6E4022]">Try adjusting your search query, roast level, or category.</p>
            <button
              onClick={() => {
                setActiveTab('all');
                setRoastFilter('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-xl bg-terracotta-600 text-white font-bold text-xs"
            >
              Show All Roasts
            </button>
          </div>
        )}

        {/* VIEW MODE: GRID VIEW (5 columns on desktop) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {processedProducts.map((product) => {
              const inWishlist = isInWishlist(product.id);
              const isCompared = compareIds.includes(product.id);
              const currentSize = selectedSizes[product.id] || '250g';
              const currentQty = quantities[product.id] || 1;
              const displayPrice = calculateProductPrice(product.price, currentSize);
              const originalDisplayPrice = calculateOriginalProductPrice(product.originalPrice, currentSize);
              const isAdded = addedSuccessId === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#EBDCCE] p-3.5 flex flex-col justify-between shadow-xs hover:shadow-elevated hover:border-[#D5BC9F] transition-all group relative overflow-hidden"
                >
                  {/* Top Badges: Sale & Stock Urgency */}
                  <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
                    {product.isSale ? (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        Sale {originalDisplayPrice ? `-${formatCurrency(originalDisplayPrice - displayPrice)}` : ''}
                      </span>
                    ) : <span />}

                    {product.stockAvailable <= 15 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black tracking-tight shadow-xs">
                        Only {product.stockAvailable} left
                      </span>
                    )}
                  </div>

                  {/* Top Image Container with Quick View & Compare Overlay */}
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#F5ECE1] flex items-center justify-center p-2 mb-2 mt-4 sm:mt-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Hover Floating Actions Overlay */}
                    <div className="absolute inset-0 bg-[#211007]/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => setQuickViewProduct(product)}
                        title="Quick View Details"
                        className="w-8 h-8 rounded-full bg-white text-[#2B170E] hover:bg-terracotta-500 hover:text-white flex items-center justify-center shadow-md transition-all scale-90 group-hover:scale-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        title="Save to Wishlist"
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all scale-90 group-hover:scale-100 ${
                          inWishlist
                            ? 'bg-rose-500 text-white'
                            : 'bg-white text-[#2B170E] hover:bg-rose-500 hover:text-white'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all scale-90 group-hover:scale-100 ${
                          isCompared
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-[#2B170E] hover:bg-amber-600 hover:text-white'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content: Title, Rating & Roast meter */}
                  <div className="space-y-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500 text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-[#3A1E0E]">{product.rating}</span>
                      <span className="text-[#AF8359]">({product.reviewsCount})</span>
                    </div>

                    <h3
                      onClick={() => setQuickViewProduct(product)}
                      className="font-serif font-bold text-xs sm:text-sm text-[#3A1E0E] hover:text-terracotta-600 cursor-pointer line-clamp-1 transition-colors"
                      title={product.name}
                    >
                      {product.name}
                    </h3>

                    <div className="text-[11px] text-[#8A5934] line-clamp-1 flex items-center justify-center gap-1.5">
                      <span>{product.roastLevel} Roast</span>
                      <span className="text-terracotta-600 font-mono text-[9px]">
                        {product.roastLevel === 'Dark' ? '●●●●●' : product.roastLevel === 'Medium-Dark' ? '●●●●○' : '●●●○○'}
                      </span>
                    </div>

                    {/* Tasting Note Chip */}
                    <div className="pt-0.5 flex flex-wrap justify-center gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF6F0] text-[9px] font-medium text-[#6E4022] border border-[#EBDCCE]">
                        {product.tastingNotes[0]}
                      </span>
                    </div>

                    {/* Bag Size Quick Selector Pills */}
                    <div className="pt-1.5 flex items-center justify-center gap-1">
                      {(['250g', '500g', '1kg'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                          className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            currentSize === size
                              ? 'bg-[#2B170E] text-white shadow-2xs'
                              : 'bg-[#FAF6F0] text-[#6E4022] hover:bg-[#EBDCCE]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Price calculation */}
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-[#3A1E0E]">
                        ${displayPrice}
                      </span>
                      {originalDisplayPrice && (
                        <span className="text-xs text-[#AF8359] line-through">
                          ${originalDisplayPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart with Quantity Counter */}
                  <div className="pt-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#EBDCCE] rounded-lg bg-[#FAF6F0] p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityDelta(product.id, -1)}
                          className="w-5 h-6 flex items-center justify-center text-[#6E4022] hover:text-[#2B170E]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center text-[10px] font-bold text-[#2B170E]">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityDelta(product.id, 1)}
                          className="w-5 h-6 flex items-center justify-center text-[#6E4022] hover:text-[#2B170E]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-terracotta-600 hover:bg-terracotta-700 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 text-white" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Compare Pill Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleCompare(product)}
                      className={`w-full py-0.5 text-[10px] rounded text-center transition-colors font-medium ${
                        isCompared
                          ? 'text-amber-800 bg-amber-500/15'
                          : 'text-[#AF8359] hover:text-[#532D16]'
                      }`}
                    >
                      {isCompared ? '✓ Added to Compare' : '+ Compare Roast'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE: DETAILED LIST VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {processedProducts.map((product) => {
              const inWishlist = isInWishlist(product.id);
              const isCompared = compareIds.includes(product.id);
              const currentSize = selectedSizes[product.id] || '250g';
              const currentGrind = selectedGrinds[product.id] || 'Whole Bean';
              const currentQty = quantities[product.id] || 1;
              const displayPrice = calculateProductPrice(product.price, currentSize);
              const originalDisplayPrice = calculateOriginalProductPrice(product.originalPrice, currentSize);
              const isAdded = addedSuccessId === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-[#EBDCCE] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft hover:shadow-elevated transition-all"
                >
                  {/* Left: Thumbnail & Badges */}
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#F5ECE1] flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                      {product.isSale && (
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                            Sale
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta-600">
                          {product.roastLevel} Roast
                        </span>
                        <span className="text-terracotta-600 font-mono text-xs">
                          {product.roastLevel === 'Dark' ? '●●●●●' : product.roastLevel === 'Medium-Dark' ? '●●●●○' : '●●●○○'}
                        </span>
                        <span className="text-xs text-[#8A5934]">• {product.origin}</span>
                      </div>

                      <h3
                        onClick={() => setQuickViewProduct(product)}
                        className="font-serif text-lg sm:text-xl font-bold text-[#2B170E] hover:text-terracotta-600 cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-[#6E4022] line-clamp-2 max-w-xl">
                        {product.description}
                      </p>

                      {/* Tasting Notes */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-[#8A5934]">Notes:</span>
                        {product.tastingNotes.map((note, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] border border-[#EBDCCE] text-[10px] font-medium text-[#532D16]"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Size, Grind, Quantity, Pricing & Actions */}
                  <div className="w-full md:w-auto flex flex-col items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[#EBDCCE]">
                    {/* Size Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#6E4022] font-semibold">Size:</span>
                      {(['250g', '500g', '1kg'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                            currentSize === size
                              ? 'bg-[#2B170E] text-white shadow-2xs'
                              : 'bg-[#FAF6F0] text-[#6E4022] border border-[#EBDCCE]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Grind Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#6E4022] font-semibold">Grind:</span>
                      <select
                        value={currentGrind}
                        onChange={(e) => setSelectedGrinds((prev) => ({ ...prev, [product.id]: e.target.value as any }))}
                        className="text-xs bg-[#FAF6F0] border border-[#EBDCCE] rounded-lg px-2 py-1 text-[#2B170E] font-medium"
                      >
                        <option value="Whole Bean">Whole Bean</option>
                        <option value="Espresso">Espresso Fine</option>
                        <option value="Pour Over">Pour Over Medium</option>
                        <option value="French Press">French Press Coarse</option>
                        <option value="Cold Brew">Cold Brew Extra Coarse</option>
                      </select>
                    </div>

                    {/* Price and Cart buttons */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-extrabold text-xl text-[#2B170E]">${displayPrice}</div>
                        {originalDisplayPrice && (
                          <div className="text-xs text-[#AF8359] line-through">${originalDisplayPrice}</div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center border border-[#EBDCCE] rounded-xl bg-[#FAF6F0] p-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityDelta(product.id, -1)}
                          className="w-6 h-7 flex items-center justify-center text-[#6E4022]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#2B170E]">{currentQty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityDelta(product.id, 1)}
                          className="w-6 h-7 flex items-center justify-center text-[#6E4022]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-soft transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-terracotta-600 hover:bg-terracotta-700 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>

                      {/* Wishlist button */}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        title="Add to Wishlist"
                        className={`p-2.5 rounded-xl border border-[#EBDCCE] transition-colors ${
                          inWishlist ? 'bg-rose-500 text-white' : 'bg-[#FAF6F0] text-[#6E4022] hover:bg-white'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {/* Compare button */}
                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                        className={`p-2.5 rounded-xl border border-[#EBDCCE] transition-colors ${
                          isCompared ? 'bg-amber-600 text-white' : 'bg-[#FAF6F0] text-[#6E4022] hover:bg-white'
                        }`}
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating Compare Bottom Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#2B170E] text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold">
              {compareIds.length} roast{compareIds.length > 1 ? 's' : ''} in comparison
            </span>
          </div>

          <div className="flex items-center gap-2">
            {comparedProducts.map((p) => (
              <span
                key={p.id}
                className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md text-[#F5ECE1] flex items-center gap-1"
              >
                {p.name.split(' ')[0]}
                <button
                  onClick={() => setCompareIds((prev) => prev.filter((id) => id !== p.id))}
                  className="hover:text-amber-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-bold transition-colors"
          >
            Compare Side-by-Side
          </button>

          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-xs text-[#D5BC9F] hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Coffee Finder Quiz Modal */}
      <CoffeeFinderModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />

      {/* Compare Modal */}
      <CompareModal
        products={comparedProducts}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemove={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))}
        onClear={() => setCompareIds([])}
      />
    </section>
  );
};
