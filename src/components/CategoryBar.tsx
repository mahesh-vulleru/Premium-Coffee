import React from 'react';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  { id: 'cappuccino', label: 'Cappuccino' },
  { id: 'espresso', label: 'Expresso' },
  { id: 'moca', label: 'Moca' },
  { id: 'latte', label: 'Latte' },
  { id: 'americano', label: 'Americano' },
  { id: 'cold_brew', label: 'Cold Brew' },
];

export const CategoryBar: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useCart();

  const handleSelect = (catId: string) => {
    setSelectedCategory(selectedCategory === catId ? 'all' : catId);
    const target = document.getElementById('best-sellers');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#3A1E0E] text-[#F5ECE1] border-y border-[#532D16] py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto gap-4 scrollbar-none py-1">
          {CATEGORIES.map((cat, index) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <React.Fragment key={cat.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm sm:text-base font-serif font-bold tracking-wide whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-terracotta-600 text-white shadow-soft scale-105'
                      : 'hover:text-terracotta-400'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>

                {/* Coffee Bean Icon separator between items */}
                {index < CATEGORIES.length - 1 && (
                  <span className="text-[#AF8359] select-none text-xs opacity-70">
                    ☕
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

