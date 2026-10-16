import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Leaf, Award } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';

export const HomeBrandStory: React.FC = () => {
  return (
    <section className="py-20 bg-[#FAF6F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Image with Quote */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated border-4 border-white bg-[#F5ECE1] group">
              <img
                src="/images/lifestyle-woman-coffee.jpg"
                alt="Woman savoring warm cup of Firedup coffee"
                onError={handleImageError}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B170E]/70 via-transparent to-transparent" />

              {/* Floating quote badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EBDCCE] shadow-lg text-left">
                <p className="text-xs font-serif italic text-[#3A1E0E] leading-relaxed">
                  &ldquo;The aroma alone transforms my mornings. There is no other coffee I would rather wake up to.&rdquo;
                </p>
                <div className="text-[11px] font-bold text-terracotta-600 mt-1">
                  — Sophia L., Firedup Subscriber
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mission, Values & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-600 text-xs font-bold tracking-wider uppercase">
              <Flame className="w-3.5 h-3.5 text-terracotta-500" />
              <span>Bean-To-Brew Dedication</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2B170E] tracking-tight leading-tight">
              Passion In Every Roast. Purpose In Every Bean.
            </h2>

            <p className="text-xs sm:text-sm text-[#6E4022] leading-relaxed">
              At Firedup, we partner directly with independent farmers across Colombia, Ethiopia, and Guatemala. Every lot is ethically sourced, cupped meticulously, and roasted in small batches to preserve its distinct geographic terroir.
            </p>

            {/* 3 Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs space-y-1.5">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-xs text-[#3A1E0E]">Direct Trade</h4>
                <p className="text-[11px] text-[#6E4022] leading-normal">
                  Equitable pay exceeding Fair Trade minimums by over 40%.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs space-y-1.5">
                <Flame className="w-5 h-5 text-terracotta-600" />
                <h4 className="font-bold text-xs text-[#3A1E0E]">Micro-Roasting</h4>
                <p className="text-[11px] text-[#6E4022] leading-normal">
                  Custom roast curves optimized for maximum sweetness.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-xs space-y-1.5">
                <Award className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-xs text-[#3A1E0E]">85+ Cupping Score</h4>
                <p className="text-[11px] text-[#6E4022] leading-normal">
                  Only the top 3% of global specialty coffee harvests.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/our-story"
                className="inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all group"
              >
                <span>Discover Our Sourcing Journey</span>
                <span className="w-8 h-8 rounded-full bg-terracotta-600 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

