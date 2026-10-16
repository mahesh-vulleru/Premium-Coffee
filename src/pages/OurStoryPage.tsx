import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { BeanToBrewStory } from '../components/BeanToBrewStory';
import { CraftedWithPurpose } from '../components/CraftedWithPurpose';

export const OurStoryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8A5934] mb-4">
          <Link to="/" className="hover:text-[#3A1E0E] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-[#3A1E0E]">Our Story & Sourcing</span>
        </div>

        {/* Hero Banner */}
        <div className="bg-[#2B170E] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-elevated mb-12">
          <div className="absolute right-0 top-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-500/20 text-terracotta-300 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Ethical Artisan Roasters</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Crafted With Purpose, Roasted With Passion
            </h1>

            <p className="text-sm sm:text-base text-[#D5BC9F] leading-relaxed">
              From steep mountain valleys in Antioquia and Yirgacheffe to your morning cup, we trace every bean back to its roots. Learn about our commitment to sustainable direct trade, uncompromising cupping scores, and fresh small-batch roasting.
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Bean To Brew Story with Accordion */}
      <BeanToBrewStory />

      {/* Direct-Trade Sustainable Sourcing Section with Modal */}
      <CraftedWithPurpose />
    </div>
  );
};
