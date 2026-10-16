import React, { useEffect, useId } from 'react';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import type { CoffeeProduct } from '../types/coffee';
import { useCart } from '../context/CartContext';
import { calculateProductPrice, formatCurrency } from '../utils/pricing';
import { handleImageError } from '../utils/imageFallback';

interface CompareModalProps {
  products: CoffeeProduct[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  products,
  isOpen,
  onClose,
  onRemove,
  onClear,
}) => {
  const { addToCart } = useCart();
  const titleId = useId();

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || products.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 bg-[#140A04]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Clickable Backdrop */}
      <div onClick={onClose} className="fixed inset-0" aria-hidden="true" />

      <div className="bg-[#FAF6F0] rounded-3xl max-w-4xl w-full border border-[#EBDCCE] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="bg-[#2B170E] text-white p-5 flex items-center justify-between">
          <div>
            <h3 id={titleId} className="font-serif text-xl font-bold text-[#F5ECE1]">
              Side-by-Side Roast Comparison
            </h3>
            <p className="text-xs text-[#D5BC9F] mt-0.5">
              Comparing {products.length} specialty roast{products.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[#D5BC9F] hover:text-white px-3 py-1 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison modal"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D5BC9F] transition-colors focus-visible:ring-2 focus-visible:ring-terracotta-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table / Columns */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const basePrice = calculateProductPrice(product.price, '250g');

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#EBDCCE] p-4 flex flex-col justify-between shadow-soft relative"
                >
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    title="Remove from comparison"
                    aria-label={`Remove ${product.name} from comparison`}
                    className="absolute top-3 right-3 p-1 rounded-full bg-[#FAF6F0] hover:bg-rose-50 text-[#8A5934] hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF6F0] mb-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span className="text-[10px] font-black uppercase text-terracotta-600 tracking-wider">
                      {product.roastLevel} Roast
                    </span>
                    <h4 className="font-serif text-base font-bold text-[#2B170E] mt-0.5">
                      {product.name}
                    </h4>
                    <div className="text-xs font-black text-[#2B170E] mt-1">
                      {formatCurrency(basePrice)} <span className="font-normal text-[#8A5934]">(250g)</span>
                    </div>

                    <div className="mt-4 space-y-2.5 text-xs border-t border-[#EBDCCE] pt-3">
                      <div>
                        <span className="font-bold text-[#8A5934] block text-[10px] uppercase">Origin</span>
                        <span className="text-[#3A1E0E]">{product.origin}</span>
                      </div>

                      <div>
                        <span className="font-bold text-[#8A5934] block text-[10px] uppercase">Roast Profile</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-[#3A1E0E]">{product.roastLevel}</span>
                          <span className="text-terracotta-600 font-mono text-[11px]">
                            {product.roastLevel === 'Dark' ? '●●●●●' : product.roastLevel === 'Medium-Dark' ? '●●●●○' : '●●●○○'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-[#8A5934] block text-[10px] uppercase">Tasting Notes</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.tastingNotes.map((note, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[10px] text-[#532D16] border border-[#EBDCCE]"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-[#8A5934] block text-[10px] uppercase">Best Brewed As</span>
                        <span className="text-[#3A1E0E] capitalize">{product.category.replace('_', ' ')}</span>
                      </div>

                      <div>
                        <span className="font-bold text-[#8A5934] block text-[10px] uppercase">Rating</span>
                        <span className="text-amber-600 font-bold">★ {product.rating}</span>{' '}
                        <span className="text-[#8A5934]">({product.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#EBDCCE]">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product, 1, 'Whole Bean', '250g');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
