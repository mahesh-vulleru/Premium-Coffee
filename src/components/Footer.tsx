import React, { useState } from 'react';
import { Flame, ArrowRight, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Footer: React.FC = () => {
  const { showToast } = useCart();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    showToast('Success! 15% discount code FIREDUP15 sent to your inbox.');
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-[#211007] text-[#D5BC9F] pt-16 pb-12 border-t border-[#3A1E0E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter Bar */}
        <div className="bg-[#2B170E] rounded-3xl p-8 sm:p-10 border border-[#532D16] mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-2 max-w-md">
            <span className="text-terracotta-400 text-xs font-bold uppercase tracking-widest block">
              Join Our Roaster Club
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
              Get 15% Off Your First Bag
            </h3>
            <p className="text-xs text-[#D5BC9F] leading-relaxed">
              Receive secret micro-lot drop alerts, cupping scorecards, and home brewing recipes directly from our master roaster.
            </p>
          </div>

          <form onSubmit={handleNewsletter} className="flex-1 max-w-md flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 px-4 py-3 rounded-full bg-[#1E100A] border border-[#532D16] text-xs text-white placeholder-[#8A5934] focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-terracotta-600 hover:bg-terracotta-500 text-white font-bold text-xs shadow-glow transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 4 Column Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#3A1E0E]">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-terracotta-500/20 flex items-center justify-center text-terracotta-500">
                <Flame className="w-5 h-5 fill-terracotta-500" />
              </div>
              <span className="font-serif text-2xl font-extrabold text-white tracking-tight">
                Firedup
              </span>
            </div>

            <p className="text-xs text-[#AF8359] leading-relaxed max-w-sm">
              Artisan roasters dedicated to ethically sourcing the planet&apos;s most extraordinary
              high-altitude coffees, roasted to order and delivered at peak freshness.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-[#2B170E] hover:bg-terracotta-600 text-white flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-[#2B170E] hover:bg-terracotta-600 text-white flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/></svg>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-[#2B170E] hover:bg-terracotta-600 text-white flex items-center justify-center transition-colors"
                title="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="mailto:hello@firedupcoffee.com"
                className="w-8 h-8 rounded-full bg-[#2B170E] hover:bg-terracotta-600 text-white flex items-center justify-center transition-colors"
                title="Email Support"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Shop Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Shop Blends
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#best-sellers" className="hover:text-white transition-colors">Espresso Roasts</a></li>
              <li><a href="#best-sellers" className="hover:text-white transition-colors">Single Origin Beans</a></li>
              <li><a href="#best-sellers" className="hover:text-white transition-colors">Dark Roasts</a></li>
              <li><a href="#best-sellers" className="hover:text-white transition-colors">Cold Brew Coarse</a></li>
              <li><a href="#best-sellers" className="hover:text-white transition-colors">Decaf Swiss Water</a></li>
            </ul>
          </div>

          {/* Col 3: Subscriptions & Partners */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Programs
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#subscriptions" className="hover:text-white transition-colors">Coffee Subscriptions</a></li>
              <li><a href="#wholesale" className="hover:text-white transition-colors">Wholesale Program</a></li>
              <li><a href="#deals" className="hover:text-white transition-colors">Special Bundles</a></li>
              <li><a href="#story" className="hover:text-white transition-colors">Bean-to-Brew Mission</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Gift Cards</a></li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Brewing Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Track Your Order</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A5934]">
          <div>
            &copy; {new Date().getFullYear()} Firedup Coffee Roasters Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <span>100% Arabica Specialty Grade</span>
            <span>Ethically Direct Sourced</span>
            <span>Compostable Bags</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
