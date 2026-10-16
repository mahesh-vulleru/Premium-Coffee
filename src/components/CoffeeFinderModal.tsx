import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, RotateCcw, ShoppingBag } from 'lucide-react';
import { COFFEE_PRODUCTS } from '../data/coffeeData';
import type { CoffeeProduct } from '../types/coffee';
import { useCart } from '../context/CartContext';

interface CoffeeFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoffeeFinderModal: React.FC<CoffeeFinderModalProps> = ({ isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [step, setStep] = useState<number>(1);
  const [brewMethod, setBrewMethod] = useState<string>('espresso');
  const [roastPref, setRoastPref] = useState<string>('Dark');
  const [flavorPref, setFlavorPref] = useState<string>('chocolate');
  const [matchedProduct, setMatchedProduct] = useState<CoffeeProduct | null>(null);

  if (!isOpen) return null;

  const handleCalculateMatch = () => {
    // Find best match based on roast level, brew method, or flavor
    let match = COFFEE_PRODUCTS.find(
      (p) => p.roastLevel === roastPref && (p.category === brewMethod || p.description.toLowerCase().includes(flavorPref))
    );

    if (!match) {
      match = COFFEE_PRODUCTS.find((p) => p.roastLevel === roastPref);
    }
    if (!match) {
      match = COFFEE_PRODUCTS[0];
    }

    setMatchedProduct(match);
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setBrewMethod('espresso');
    setRoastPref('Dark');
    setFlavorPref('chocolate');
    setMatchedProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#140A04]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] rounded-3xl max-w-lg w-full border border-[#EBDCCE] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#2B170E] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D5BC9F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-terracotta-500/30 flex items-center justify-center text-terracotta-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
              Personalized Roaster Quiz
            </span>
          </div>

          <h3 className="font-serif text-2xl font-bold text-[#F5ECE1]">
            Find Your Signature Roast
          </h3>
          <p className="text-xs text-[#D5BC9F] mt-1">
            Answer 3 quick questions and our master roasters will match your ideal cup.
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  step >= s ? 'bg-terracotta-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">Step 1 of 3</span>
                <h4 className="font-serif text-lg font-bold text-[#3A1E0E] mt-1">
                  How do you usually brew your coffee?
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'espresso', label: 'Espresso Machine / Moka Pot', desc: 'Thick crema & intense shots' },
                  { id: 'latte', label: 'Milk Drinks & Lattes', desc: 'Smooth, cuts through milk' },
                  { id: 'americano', label: 'Drip / French Press / Pour Over', desc: 'Clean, balanced, aromatic' },
                  { id: 'cold_brew', label: 'Cold Brew & Iced Coffee', desc: 'Low acid, naturally sweet' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBrewMethod(item.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      brewMethod === item.id
                        ? 'border-terracotta-500 bg-terracotta-50 shadow-xs'
                        : 'border-[#EBDCCE] bg-white hover:border-[#D5BC9F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#3A1E0E]">{item.label}</span>
                      {brewMethod === item.id && <Check className="w-4 h-4 text-terracotta-600" />}
                    </div>
                    <span className="text-[10px] text-[#6E4022] leading-tight block">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center gap-2 shadow-soft transition-all"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">Step 2 of 3</span>
                <h4 className="font-serif text-lg font-bold text-[#3A1E0E] mt-1">
                  What roast profile satisfies your palate?
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { id: 'Medium', label: 'Medium Roast', desc: 'Honey, apricot & balanced acidity', dots: '●●●○○' },
                  { id: 'Medium-Dark', label: 'Medium-Dark', desc: 'Caramel, cacao & silky body', dots: '●●●●○' },
                  { id: 'Dark', label: 'Dark Roast', desc: 'Smoky, dark chocolate & molasses', dots: '●●●●●' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoastPref(item.id)}
                    className={`p-3.5 rounded-2xl text-left border flex flex-col justify-between transition-all ${
                      roastPref === item.id
                        ? 'border-terracotta-500 bg-terracotta-50 shadow-xs'
                        : 'border-[#EBDCCE] bg-white hover:border-[#D5BC9F]'
                    }`}
                  >
                    <div>
                      <div className="text-terracotta-600 text-[10px] font-mono tracking-tighter mb-1">
                        {item.dots}
                      </div>
                      <span className="text-xs font-bold text-[#3A1E0E] block">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-[#6E4022] mt-2 leading-tight block">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-[#6E4022] hover:text-[#2B170E]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center gap-2 shadow-soft transition-all"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">Step 3 of 3</span>
                <h4 className="font-serif text-lg font-bold text-[#3A1E0E] mt-1">
                  Which flavor notes do you crave most?
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'chocolate', title: 'Dark Cacao & Molasses', desc: 'Rich, bittersweet, comforting' },
                  { id: 'vanilla', title: 'Vanilla & Caramelized Sugar', desc: 'Silky, aromatic, sweet notes' },
                  { id: 'hazelnut', title: 'Toasted Hazelnut & Praline', desc: 'Nutty, buttery dessert tone' },
                  { id: 'citrus', title: 'Floral Jasmine & Fruit Blossom', desc: 'Vibrant, bright, refreshing' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFlavorPref(item.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      flavorPref === item.id
                        ? 'border-terracotta-500 bg-terracotta-50 shadow-xs'
                        : 'border-[#EBDCCE] bg-white hover:border-[#D5BC9F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#3A1E0E]">{item.title}</span>
                      {flavorPref === item.id && <Check className="w-4 h-4 text-terracotta-600" />}
                    </div>
                    <span className="text-[10px] text-[#6E4022] leading-tight block">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-bold text-[#6E4022] hover:text-[#2B170E]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCalculateMatch}
                  className="px-6 py-2.5 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs flex items-center gap-2 shadow-soft transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Reveal My Match</span>
                </button>
              </div>
            </div>
          )}

          {step === 4 && matchedProduct && (
            <div className="space-y-5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>99% Taste Compatibility Match</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EBDCCE] shadow-soft flex items-center gap-4 text-left">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#FAF6F0] flex-shrink-0">
                  <img
                    src={matchedProduct.image}
                    alt={matchedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-terracotta-600 tracking-wider">
                    {matchedProduct.roastLevel} Roast • {matchedProduct.origin}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#2B170E]">
                    {matchedProduct.name}
                  </h4>
                  <p className="text-xs text-[#6E4022] line-clamp-2">
                    {matchedProduct.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-black text-sm text-[#2B170E]">${matchedProduct.price}</span>
                    <span className="text-[11px] text-[#8A5934]">
                      ★ {matchedProduct.rating} ({matchedProduct.reviewsCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-[#D5BC9F] text-[#532D16] hover:bg-white text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addToCart(matchedProduct, 1, 'Whole Bean', '250g');
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Match to Cart (${matchedProduct.price})</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
