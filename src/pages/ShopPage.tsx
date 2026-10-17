import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BestSellerSection } from '../components/BestSellerSection';
import { useCart } from '../context/CartContext';
import { Flame, ArrowLeft, Sparkles, Filter } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { setSelectedCategory } = useCart();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam, setSelectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8">
      {/* Shop Page Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8A5934] mb-4">
          <Link to="/" className="hover:text-[#3A1E0E] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-[#3A1E0E]">Shop All Coffee</span>
        </div>

        <div className="bg-[#2B170E] text-white rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-elevated">
          <div className="absolute right-0 top-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-500/20 text-terracotta-300 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-terracotta-400" />
                <span>Full Roastery Catalogue</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight break-words">
                Specialty Coffee Collection
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-[#D5BC9F] leading-relaxed">
                Explore all artisanal roasts, single-origin micro-lots, and signature espresso blends. Filter by roast level, cupping notes, or preferred brewing method.
              </p>

              {/* Supporting Links & Quick Filters */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-stone-200 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Whole Bean & Custom Grinds</span>
                </span>
                <a
                  href="#best-sellers"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white border border-white/10 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Interactive Comparison & Quiz</span>
                </a>
                <Link
                  to="/deals"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-terracotta-500/20 hover:bg-terracotta-500/30 text-terracotta-300 hover:text-white border border-terracotta-500/30 transition-colors"
                >
                  <span>Special Offers →</span>
                </Link>
              </div>
            </div>

            {/* Right-Side Roaster Quality Highlights */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 lg:items-end flex-shrink-0 text-xs">
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-stone-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% Arabica Micro-Batches</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-stone-200 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-terracotta-400" />
                <span>Roasted Fresh to Order</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-stone-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Free Express Shipping &gt; ₹999</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Catalog with Filters, Search, Compare, and Coffee Finder */}
      <BestSellerSection />
    </div>
  );
};

