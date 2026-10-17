/* oxlint-disable react/only-export-components */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CoffeeProduct, CartItem, GrindOption, BagSize, SubscriptionFrequency } from '../types/coffee';
import { COFFEE_PRODUCTS, SUBSCRIPTION_FEATURED_PRODUCT } from '../data/coffeeData';
import { calculateCartSummary } from '../utils/pricing';
import { CartContext } from './useCart';
import { useAuth } from './useAuth';
export type { ToastState, CartContextType } from './useCart';
export { useCart } from './useCart';

const GUEST_CART_STORAGE_KEY = 'firedup_guest_cart';
const GUEST_WISHLIST_STORAGE_KEY = 'firedup_guest_wishlist';

function sanitizeLoadedCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const validGrinds: GrindOption[] = ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'];
  const validSizes: BagSize[] = ['250g', '500g', '1kg'];
  const validFrequencies: SubscriptionFrequency[] = ['2_weeks', '3_weeks', '4_weeks'];

  const sanitized: CartItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<CartItem> & { product?: Partial<CoffeeProduct> };
    const prodId = candidate.product?.id || candidate.product?._id;
    if (!prodId || typeof prodId !== 'string') continue;

    const canonical =
      COFFEE_PRODUCTS.find((p) => p.id === prodId || p._id === prodId) ||
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
    const prodId = candidate.id || candidate._id;
    if (!prodId || typeof prodId !== 'string') continue;

    const canonical = COFFEE_PRODUCTS.find((p) => p.id === prodId || p._id === prodId);
    if (canonical) {
      sanitized.push(canonical);
    }
  }

  return sanitized;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const lastAuthenticatedUserId = useRef<string | null>(currentUser?.id ?? null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      return saved ? sanitizeLoadedCart(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<CoffeeProduct[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
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

  // Persist only guest state locally. Authenticated carts and wishlists belong to the
  // server-side user record and must never be written to a shared browser key.
  useEffect(() => {
    if (currentUser || lastAuthenticatedUserId.current !== null) return;
    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Unable to persist guest cart to localStorage', err);
    }
  }, [cart, currentUser]);

  useEffect(() => {
    if (currentUser || lastAuthenticatedUserId.current !== null) return;
    try {
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (err) {
      console.warn('Unable to persist guest wishlist to localStorage', err);
    }
  }, [wishlist, currentUser]);

  // Each authenticated account is hydrated exclusively from its own backend records.
  // Never merge whatever happened to be in the previous account's React state.
  useEffect(() => {
    let isMounted = true;

    if (!currentUser) {
      try {
        const savedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        const savedWishlist = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
        setCart(savedCart ? sanitizeLoadedCart(JSON.parse(savedCart)) : []);
        setWishlist(savedWishlist ? sanitizeLoadedWishlist(JSON.parse(savedWishlist)) : []);
      } catch {
        setCart([]);
        setWishlist([]);
      }
      lastAuthenticatedUserId.current = null;
      return () => {
        isMounted = false;
      };
    }

    // Mark this account before effects can persist previous state as guest data.
    lastAuthenticatedUserId.current = currentUser.id;
    // Hide the previous account's private data while the new account is loading.
    setCart([]);
    setWishlist([]);

    async function hydrateUserCartAndWishlist() {
      try {
        const [cartRes, wishRes] = await Promise.all([
          fetch('/api/v1/cart', { credentials: 'include' }),
          fetch('/api/v1/wishlist', { credentials: 'include' }),
        ]);

        if (isMounted && cartRes.ok) {
          const cartData = await cartRes.json();
          if (cartData.success && Array.isArray(cartData.cart?.items)) {
            const mappedCart: CartItem[] = cartData.cart.items.map((i: any) => ({
              product: {
                ...i.product,
                id: i.product?.id || i.product?._id,
              },
              quantity: i.quantity,
              grind: i.grind,
              size: i.size,
              frequency: i.frequency,
            })).filter((item: CartItem) => Boolean(item.product.id));
            setCart(mappedCart);
          } else {
            setCart([]);
          }
        } else if (isMounted) {
          setCart([]);
        }

        if (isMounted && wishRes.ok) {
          const wishData = await wishRes.json();
          if (wishData.success && Array.isArray(wishData.wishlist)) {
            const mappedWishlist: CoffeeProduct[] = wishData.wishlist.map((p: any) => ({
              ...p,
              id: p.id || p._id,
            })).filter((p: CoffeeProduct) => Boolean(p.id));
            setWishlist(mappedWishlist);
          } else {
            setWishlist([]);
          }
        } else if (isMounted) {
          setWishlist([]);
        }
      } catch (err) {
        console.warn('[CartContext] Backend cart/wishlist hydration failed:', err);
        if (isMounted) {
          setCart([]);
          setWishlist([]);
        }
      }
    }

    void hydrateUserCartAndWishlist();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

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

    // If authenticated, persist to MongoDB
    if (currentUser) {
      fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: product._id || product.id,
          quantity: validQty,
          grind,
          size,
          frequency,
        }),
      }).catch((err) => console.warn('[CartContext] Background cart add error:', err));
    }

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

    if (currentUser) {
      // Re-sync updated cart to backend
      setTimeout(() => {
        setCart((current) => {
          fetch('/api/v1/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items: current }),
          }).catch(console.warn);
          return current;
        });
      }, 50);
    }
  };

  const updateQuantity = (
    productId: string,
    grind: string,
    size: string,
    delta: number,
    frequency?: string
  ) => {
    setCart((prev) => {
      const nextCart = prev
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

      if (currentUser) {
        fetch('/api/v1/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ items: nextCart }),
        }).catch(console.warn);
      }

      return nextCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (currentUser) {
      fetch('/api/v1/cart', {
        method: 'DELETE',
        credentials: 'include',
      }).catch(console.warn);
    }
  };

  const { subtotal } = useMemo(() => calculateCartSummary(cart, 0), [cart]);
  const cartTotal = subtotal;
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const toggleWishlist = (product: CoffeeProduct) => {
    const prodId = product.id || product._id;
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === prodId || p._id === prodId);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`, 'info');
        return prev.filter((p) => p.id !== prodId && p._id !== prodId);
      }
      showToast(`Saved "${product.name}" to wishlist`, 'success');
      return [...prev, product];
    });

    if (currentUser && prodId) {
      fetch(`/api/v1/wishlist/${prodId}`, {
        method: 'POST',
        credentials: 'include',
      }).catch((err) => console.warn('[CartContext] Background wishlist toggle error:', err));
    }
  };

  const isInWishlist = (productId: string) =>
    wishlist.some((p) => p.id === productId || p._id === productId);

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
