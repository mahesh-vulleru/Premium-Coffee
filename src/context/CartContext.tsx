/* oxlint-disable react/only-export-components */
import React, { useState, useEffect, useMemo } from 'react';
import type { CoffeeProduct, CartItem, GrindOption, BagSize, SubscriptionFrequency } from '../types/coffee';
import { COFFEE_PRODUCTS, SUBSCRIPTION_FEATURED_PRODUCT } from '../data/coffeeData';
import { calculateCartSummary } from '../utils/pricing';
import { CartContext } from './useCart';
export type { ToastState, CartContextType } from './useCart';
export { useCart } from './useCart';

const CART_STORAGE_KEY = 'firedup_cart';
const WISHLIST_STORAGE_KEY = 'firedup_wishlist';

function sanitizeLoadedCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const validGrinds: GrindOption[] = ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'];
  const validSizes: BagSize[] = ['250g', '500g', '1kg'];
  const validFrequencies: SubscriptionFrequency[] = ['2_weeks', '3_weeks', '4_weeks'];

  const sanitized: CartItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<CartItem> & { product?: Partial<CoffeeProduct> };
    const prodId = candidate.product?.id;
    if (!prodId || typeof prodId !== 'string') continue;

    const canonical =
      COFFEE_PRODUCTS.find((p) => p.id === prodId) ||
      (prodId === SUBSCRIPTION_FEATURED_PRODUCT.id ? SUBSCRIPTION_FEATURED_PRODUCT : null);

    const product: CoffeeProduct | null =
      canonical ||
      (typeof candidate.product?.price === 'number' && candidate.product.name
        ? (candidate.product as CoffeeProduct)
        : null);

    if (!product) continue;

    const rawQty = Number(candidate.quantity);
    const maxStock = product.stockAvailable > 0 ? product.stockAvailable : 10;
    const quantity = Number.isInteger(rawQty) && rawQty > 0 ? Math.min(rawQty, maxStock) : 1;
    const grind: GrindOption = candidate.grind && validGrinds.includes(candidate.grind) ? candidate.grind : 'Whole Bean';
    const size: BagSize = candidate.size && validSizes.includes(candidate.size) ? candidate.size : '250g';
    const frequency: SubscriptionFrequency | undefined =
      candidate.frequency && validFrequencies.includes(candidate.frequency) ? candidate.frequency : undefined;

    sanitized.push({
      product,
      quantity,
      grind,
      size,
      frequency,
    });
  }

  return sanitized;
}

function sanitizeLoadedWishlist(raw: unknown): CoffeeProduct[] {
  if (!Array.isArray(raw)) return [];
  const sanitized: CoffeeProduct[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<CoffeeProduct>;
    const prodId = candidate.id;
    if (!prodId || typeof prodId !== 'string') continue;

    const canonical = COFFEE_PRODUCTS.find((p) => p.id === prodId);
    if (canonical) {
      sanitized.push(canonical);
    }
  }

  return sanitized;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? sanitizeLoadedCart(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<CoffeeProduct[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? sanitizeLoadedWishlist(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<CoffeeProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Unable to persist cart to localStorage', err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (err) {
      console.warn('Unable to persist wishlist to localStorage', err);
    }
  }, [wishlist]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  };

  const addToCart = (
    product: CoffeeProduct,
    quantity = 1,
    grind: GrindOption = 'Whole Bean',
    size: BagSize = '250g',
    frequency?: SubscriptionFrequency
  ) => {
    const maxStock = product.stockAvailable > 0 ? product.stockAvailable : 10;
    const validQty = Math.max(1, Math.min(quantity, maxStock));

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.grind === grind &&
          item.size === size &&
          item.frequency === frequency
      );

      if (existingIndex > -1) {
        const existingItem = prev[existingIndex];
        const newQty = existingItem.quantity + validQty;
        if (newQty > maxStock) {
          showToast(`Maximum available stock reached (${maxStock} bags) for "${product.name}"`, 'info');
          const copy = [...prev];
          copy[existingIndex].quantity = maxStock;
          return copy;
        }
        const copy = [...prev];
        copy[existingIndex].quantity = newQty;
        return copy;
      }

      return [...prev, { product, quantity: validQty, grind, size, frequency }];
    });

    const frequencyLabel = frequency ? ` (${frequency.replace('_', ' ')})` : '';
    showToast(`Added ${validQty}x "${product.name}" (${size}, ${grind}${frequencyLabel}) to cart`);
  };

  const removeFromCart = (productId: string, grind: string, size: string, frequency?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.grind === grind &&
            item.size === size &&
            item.frequency === frequency
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    grind: string,
    size: string,
    delta: number,
    frequency?: string
  ) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (
            item.product.id === productId &&
            item.grind === grind &&
            item.size === size &&
            item.frequency === frequency
          ) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            const maxStock = item.product.stockAvailable > 0 ? item.product.stockAvailable : 10;
            if (nextQty > maxStock) {
              showToast(`Only ${maxStock} bags available in stock`, 'info');
              return { ...item, quantity: maxStock };
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const { subtotal } = useMemo(() => calculateCartSummary(cart, 0), [cart]);
  const cartTotal = subtotal;
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const toggleWishlist = (product: CoffeeProduct) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`, 'info');
        return prev.filter((p) => p.id !== product.id);
      }
      showToast(`Saved "${product.name}" to wishlist`, 'success');
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
        isAccountModalOpen,
        setIsAccountModalOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
