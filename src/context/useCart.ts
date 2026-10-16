import { createContext, useContext } from 'react';
import type { CoffeeProduct, CartItem, GrindOption, BagSize, SubscriptionFrequency } from '../types/coffee';

export interface ToastState {
  message: string;
  type?: 'success' | 'info' | 'error';
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: CoffeeProduct,
    quantity?: number,
    grind?: GrindOption,
    size?: BagSize,
    frequency?: SubscriptionFrequency
  ) => void;
  removeFromCart: (productId: string, grind: string, size: string, frequency?: string) => void;
  updateQuantity: (productId: string, grind: string, size: string, delta: number, frequency?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Wishlist
  wishlist: CoffeeProduct[];
  toggleWishlist: (product: CoffeeProduct) => void;
  isInWishlist: (productId: string) => boolean;

  // UI state
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  quickViewProduct: CoffeeProduct | null;
  setQuickViewProduct: (product: CoffeeProduct | null) => void;

  // Selected Category
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // Account modal
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};

