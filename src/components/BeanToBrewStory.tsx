import React, { useState } from 'react';
import { ChevronDown, Sparkles, Award, ShieldCheck, DollarSign } from 'lucide-react';

export const BeanToBrewStory: React.FC = () => {
  const [openSection, setOpenSection] = useState<'mission' | 'goal' | 'roasting'>('goal');

  return (
    <section id="story" className="py-20 bg-[#FAF6F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading matching screenshot typography */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#2B170E] leading-tight">
            From <span className="text-terracotta-500">Bean</span> ☕ To Brew The Inspiring And Journey Passion Behind <span className="text-terracotta-500">Premium</span> ☕ Coffee
          </h2>
          <p className="text-xs sm:text-sm text-[#6E4022] font-medium pt-1">
            Discover how every single lot is ethically chosen, rigorously cupped, and roasted with uncompromising dedication.
          </p>
        </div>

        {/* 2 Column Layout: Left Image, Right Steps / Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Woman in cozy sweater drinking coffee */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated border-4 border-white bg-[#F5ECE1] group">
              <img
                src="/images/lifestyle-woman-coffee.jpg"
                alt="Woman savoring warm cup of Firedup coffee"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B170E]/60 via-transparent to-transparent" />

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

          {/* Right Column: Mission & Goal with 4 Feature Cards */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 01. Our Mission Accordion Item */}
            <div className="bg-white rounded-2xl border border-[#EBDCCE] shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'mission' ? 'goal' : 'mission')}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-[#FAF6F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-terracotta-600 bg-terracotta-50 px-2.5 py-1 rounded-md">
                    01
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3A1E0E]">
                    Our Mission
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[#8A5934] transition-transform duration-300 ${
                    openSection === 'mission' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openSection === 'mission' && (
                <div className="px-6 pb-6 text-xs sm:text-sm text-[#6E4022] leading-relaxed border-t border-[#FAF6F0] pt-4 animate-in fade-in">
                  At Firedup Coffee, we craft premium coffee experiences with carefully selected
                  beans and exceptional flavors. Our mission is to deliver quality, freshness, and
                  unforgettable moments in every cup — empowering both local roasters and sustainable
                  smallholder farming communities worldwide.
                </div>
              )}
            </div>

            {/* 02. Our Goal (expanded by default matching the screenshot) */}
            <div className="bg-white rounded-2xl border border-[#EBDCCE] shadow-soft overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'goal' ? 'mission' : 'goal')}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-[#FAF6F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-terracotta-600 bg-terracotta-50 px-2.5 py-1 rounded-md">
                    02
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3A1E0E]">
                    Our Goal
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[#8A5934] transition-transform duration-300 ${
                    openSection === 'goal' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openSection === 'goal' && (
                <div className="px-6 pb-6 pt-2 space-y-4 border-t border-[#FAF6F0] animate-in fade-in">
                  <p className="text-xs text-[#6E4022] leading-relaxed">
                    Setting the gold standard for specialty coffee sourcing, master roasting, and accessible luxury.
                  </p>

                  {/* 4 Feature Boxes (Supreme Beans, High Quality, Extraordinary, Affordable Price) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    
                    {/* Box 1: Supreme Beans */}
                    <div className="p-4 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0] flex flex-col justify-between hover:border-terracotta-400 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-4 h-4 text-terracotta-500" />
                        <h4 className="font-serif font-bold text-sm text-[#3A1E0E]">
                          Supreme Beans
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#6E4022]">
                        Beans that provide great taste and aromatic nuance.
                      </p>
                    </div>

                    {/* Box 2: High Quality */}
                    <div className="p-4 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0] flex flex-col justify-between hover:border-terracotta-400 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-terracotta-500" />
                        <h4 className="font-serif font-bold text-sm text-[#3A1E0E]">
                          High Quality
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#6E4022]">
                        We provide the highest quality through rigorous cupping.
                      </p>
                    </div>

                    {/* Box 3: Extraordinary */}
                    <div className="p-4 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0] flex flex-col justify-between hover:border-terracotta-400 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Award className="w-4 h-4 text-terracotta-500" />
                        <h4 className="font-serif font-bold text-sm text-[#3A1E0E]">
                          Extraordinary
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#6E4022]">
                        Coffee flavor like you have never tasted before.
                      </p>
                    </div>

                    {/* Box 4: Affordable Price */}
                    <div className="p-4 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0] flex flex-col justify-between hover:border-terracotta-400 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <DollarSign className="w-4 h-4 text-terracotta-500" />
                        <h4 className="font-serif font-bold text-sm text-[#3A1E0E]">
                          Affordable Price
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#6E4022]">
                        Our coffee prices are fair and easy to afford every day.
                      </p>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* 03. Sustainable Trade */}
            <div className="bg-white rounded-2xl border border-[#EBDCCE] shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'roasting' ? 'goal' : 'roasting')}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-[#FAF6F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-terracotta-600 bg-terracotta-50 px-2.5 py-1 rounded-md">
                    03
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3A1E0E]">
                    Artisan Roasting & Stewardship
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[#8A5934] transition-transform duration-300 ${
                    openSection === 'roasting' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openSection === 'roasting' && (
                <div className="px-6 pb-6 text-xs sm:text-sm text-[#6E4022] leading-relaxed border-t border-[#FAF6F0] pt-4 animate-in fade-in">
                  We roast in small, precision-calibrated cast-iron drums. Every curve is monitored
                  in real-time to accentuate natural fruity acids, caramel sweetness, and full-bodied chocolate profiles.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
