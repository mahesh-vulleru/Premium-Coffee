import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Toast: React.FC = () => {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-[#2B170E] text-white px-4 py-3 rounded-2xl shadow-elevated border border-[#532D16] flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-[#F5ECE1] pr-2">
          {toast.message}
        </span>
      </div>
    </div>
  );
};
