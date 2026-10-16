import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CoffeeProduct, CartItem } from '../types/coffee';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CoffeeProduct, quantity?: number, grind?: CartItem['grind'], size?: CartItem['size']) => void;
  removeFromCart: (productId: string, grind: string, size: string) => void;
  updateQuantity: (productId: string, grind: string, size: string, delta: number) => void;
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
  toast: { message: string; type?: 'success' | 'info' } | null;
  showToast: (message: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('firedup_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<CoffeeProduct[]>(() => {
    try {
      const saved = localStorage.getItem('firedup_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<CoffeeProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);

  useEffect(() => {
    localStorage.setItem('firedup_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('firedup_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const addToCart = (
    product: CoffeeProduct,
    quantity = 1,
    grind: CartItem['grind'] = 'Whole Bean',
    size: CartItem['size'] = '250g'
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.grind === grind && item.size === size
      );
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      }
      return [...prev, { product, quantity, grind, size }];
    });
    showToast(`Added ${quantity}x "${product.name}" to your cart`);
  };

  const removeFromCart = (productId: string, grind: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.grind === grind && item.size === size)));
  };

  const updateQuantity = (productId: string, grind: string, size: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId && item.grind === grind && item.size === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    let multiplier = 1;
    if (item.size === '500g') multiplier = 1.85;
    if (item.size === '1kg') multiplier = 3.4;
    return sum + item.product.price * multiplier * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleWishlist = (product: CoffeeProduct) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`);
        return prev.filter((p) => p.id !== product.id);
      }
      showToast(`Saved "${product.name}" to wishlist`);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => wishlist.some((p) => p.id === productId);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        quickViewProduct,
        setQuickViewProduct,
        selectedCategory,
        setSelectedCategory,
        toast,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
