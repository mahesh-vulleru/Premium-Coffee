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

        <div className="bg-[#2B170E] text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-elevated">
          <div className="absolute right-0 top-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-500/20 text-terracotta-300 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Full Roastery Catalogue</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Specialty Coffee Collection
            </h1>

            <p className="text-xs sm:text-sm text-[#D5BC9F] leading-relaxed">
              Explore all 12+ artisanal roasts, single-origin micro-lots, and signature blends. Filter by roast level, tasting profile, or brew method.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Whole Bean & Custom Grinds
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                Interactive Roast Comparison & Quiz
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Catalog with Filters, Search, Compare, and Coffee Finder */}
      <BestSellerSection />
    </div>
  );
};

