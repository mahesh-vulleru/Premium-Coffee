import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Coffee, Star, Flame } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';

interface HeroSlide {
  title: string;
  prefix: string;
  subtitle: string;
  description: string;
  badge: string;
  pouchName: string;
  blend: string;
  notes: string;
  heroImage: string;
  pouchImage: string;
  roastStatus: string;
  dispatchTime: string;
  ratingScore: string;
  ratingText: string;
  highlightTag: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    title: 'Firedup',
    prefix: 'FOR /',
    subtitle: 'COFFEE LOVERS',
    description:
      'Explore our premium coffee collection, freshly roasted from the finest beans to deliver rich flavor and unforgettable taste in every cup.',
    badge: '100% Single-Origin Arabica',
    pouchName: 'AURORA SPECIALTY COFFEE',
    blend: 'SIGNATURE ROAST BLEND',
    notes: 'Dark Chocolate • Toasted Walnut • Golden Honey',
    heroImage: '/images/hero-coffee-splash.jpg',
    pouchImage: '/images/aurora-pouch.jpg',
    roastStatus: 'Roasting Batch #104',
    dispatchTime: 'Dispatches in 2h 45m',
    ratingScore: '4.9',
    ratingText: 'Over 2,400+ reviews',
    highlightTag: 'Signature',
  },
  {
    title: 'Firedup',
    prefix: 'CRAFTED /',
    subtitle: 'ROASTERY BLENDS',
    description:
      'Direct-trade highland cherries hand-roasted in micro-batches to preserve delicate floral aromatics and bold velvety textures.',
    badge: 'Micro-Lot Small Batch #08',
    pouchName: 'ETHIOPIA YIRGACHEFFE',
    blend: 'WASHED HEIRLOOM LOT',
    notes: 'Jasmine Bloom • Meyer Lemon • Peach Nectar',
    heroImage: '/images/morning-fuel.jpg',
    pouchImage: '/images/special-offer-pouch.jpg',
    roastStatus: 'Micro-Lot Limited Run',
    dispatchTime: 'Only 38 Bags Remaining',
    ratingScore: '5.0',
    ratingText: 'Cup of Excellence 2026',
    highlightTag: 'Micro-Lot',
  },
  {
    title: 'Firedup',
    prefix: 'ESTATE /',
    subtitle: 'ESPRESSO RESERVE',
    description:
      'Engineered for true espresso connoisseurs. Thick hazelnut crema, dense syrupy mouthfeel, and zero lingering bitterness.',
    badge: 'Award-Winning Blend 2026',
    pouchName: 'VOLCANO CREMA NOIR',
    blend: 'ORGANIC ESPRESSO BLEND',
    notes: 'Molasses • Black Cherry • Dark Cacao',
    heroImage: '/images/subscription-steaming.jpg',
    pouchImage: '/images/aurora-pouch.jpg',
    roastStatus: 'Fresh Crema Reserve',
    dispatchTime: 'Roasted Fresh Today',
    ratingScore: '4.95',
    ratingText: 'Barista Championship Winner',
    highlightTag: 'Reserve',
  },
];

export const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5ECE1]/70 via-[#FAF6F0] to-[#FAF6F0] pt-6 sm:pt-12 pb-8 sm:pb-12 border-b border-[#EBDCCE]/60">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[580px]">
          
          {/* Left Column: Large Brand Typography & Discover Coffee CTA */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 z-10">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBDCCE]/80 border border-[#D5BC9F] text-xs font-bold text-[#532D16] tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-600" />
              <span>{slide.badge}</span>
            </div>

            {/* Large Brand Typography */}
            <div className="space-y-1 sm:space-y-2">
              <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[88px] font-black text-[#2B170E] tracking-tight leading-[0.92]">
                {slide.title}
              </h1>
              <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#2B170E] flex items-center gap-3 flex-wrap leading-tight">
                <span className="text-terracotta-500 font-black tracking-wide">{slide.prefix}</span>
                <span className="tracking-tight">{slide.subtitle}</span>
              </div>
            </div>

            {/* Description Text */}
            <p className="text-sm sm:text-base md:text-lg text-[#6E4022] max-w-lg leading-relaxed font-normal">
              {slide.description}
            </p>

            {/* Action Buttons: Discover Coffee & Carousel Navigation */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-4 pl-7 pr-2.5 py-2.5 sm:py-3 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-sm sm:text-base shadow-glow hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-0.5 group"
              >
                <span className="tracking-wide">Discover Coffee</span>
                <span className="w-10 h-10 rounded-full bg-[#2B170E] flex items-center justify-center text-white shadow-md group-hover:translate-x-1.5 transition-transform duration-300">
                  <ArrowRight className="w-4 h-4 text-white" />
                </span>
              </Link>

              {/* Slider Dots & Arrow Navigation */}
              <div className="flex items-center gap-3 sm:pl-2">
                <div className="flex items-center gap-1.5">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? 'w-8 bg-terracotta-600' : 'w-2.5 bg-[#D5BC9F] hover:bg-[#AF8359]'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-full border border-[#D5BC9F] bg-white/70 hover:bg-[#FAF6F0] text-[#532D16] shadow-sm transition-all hover:scale-105 active:scale-95"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-full border border-[#D5BC9F] bg-white/70 hover:bg-[#FAF6F0] text-[#532D16] shadow-sm transition-all hover:scale-105 active:scale-95"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quality & Trust Badges */}
            <div className="pt-6 border-t border-[#EBDCCE] flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-[#6E4022] font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-terracotta-500/10 flex items-center justify-center text-terracotta-600">
                  <Flame className="w-4 h-4" />
                </div>
                <span>Fresh Artisan Roasts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Coffee className="w-4 h-4" />
                </div>
                <span>Ethically Sourced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                </div>
                <span className="font-bold text-[#3A1E0E]">{slide.ratingScore}</span>
                <span className="text-[#8A5934]">({slide.ratingText})</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Coffee Photography Composition */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Visual Container */}
            <div className="relative w-full max-w-[540px] aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-elevated border-4 border-white bg-gradient-to-tr from-[#2B170E] to-[#532D16] group">
              {/* Premium Coffee Photography: High resolution, rich roasted hues */}
              <img
                key={slide.heroImage}
                src={slide.heroImage}
                alt="Premium roasted coffee and vibrant splash"
                onError={handleImageError}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 contrast-105"
              />

              {/* Subtle cinematic gradient overlay for readable floating badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#211007]/85 via-[#211007]/20 to-transparent pointer-events-none" />

              {/* Floating Coffee Pouch Mockup (Aurora Specialty Coffee) */}
              <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 w-44 sm:w-56 p-3 sm:p-4 rounded-2xl bg-[#2B170E]/85 backdrop-blur-md border border-white/20 shadow-2xl animate-float">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 border border-white/10 shadow-inner">
                  <img
                    key={slide.pouchImage}
                    src={slide.pouchImage}
                    alt={slide.pouchName}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-[#211007] text-[9px] font-black tracking-wider uppercase shadow-sm">
                    {slide.highlightTag}
                  </div>
                </div>

                <div className="text-white text-left space-y-0.5">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                    {slide.pouchName}
                  </div>
                  <div className="text-xs font-extrabold truncate text-white">{slide.blend}</div>
                  <div className="text-[10px] text-[#D5BC9F] truncate">{slide.notes}</div>
                </div>
              </div>

              {/* Top-Left Roaster Status Badge */}
              <div className="absolute top-6 left-6 p-3.5 rounded-2xl bg-[#2B170E]/90 backdrop-blur-md border border-[#D5BC9F]/30 text-white max-w-[210px] shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D5BC9F]">
                    Live Roastery
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{slide.roastStatus}</div>
                <div className="text-[10px] text-[#D5BC9F] mt-0.5">{slide.dispatchTime}</div>
              </div>

              {/* Bottom-Left Taste Note Accent Pill */}
              <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/40 shadow-md text-[#3A1E0E] text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                <span>Single Origin • Micro Batch</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
