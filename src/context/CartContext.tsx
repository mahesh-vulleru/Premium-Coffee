/* oxlint-disable react/only-export-components */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { CoffeeProduct, CartItem, GrindOption, BagSize, SubscriptionFrequency } from '../types/coffee';
import { COFFEE_PRODUCTS, SUBSCRIPTION_FEATURED_PRODUCT } from '../data/coffeeData';
import { calculateCartSummary } from '../utils/pricing';
import { getSafeInternalRedirect } from '../utils/authRedirect';
import { CartContext } from './useCart';
import { useAuth } from './useAuth';
import type { PendingAuthAction } from './useCart';
export type { ToastState, CartContextType, PendingAuthAction } from './useCart';
export { useCart } from './useCart';

const GUEST_CART_KEY = 'firedup_guest_cart';
const GUEST_WISHLIST_KEY = 'firedup_guest_wishlist';
const USER_CART_KEY_PREFIX = 'firedup_cart_';
const USER_WISHLIST_KEY_PREFIX = 'firedup_wishlist_';
const PENDING_AUTH_ACTION_KEY = 'firedup_pending_auth_action';

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

function validateAndResolvePendingAction(rawAction: unknown): PendingAuthAction | null {
  if (!rawAction || typeof rawAction !== 'object') return null;
  const candidate = rawAction as Partial<PendingAuthAction>;

  if (candidate.type !== 'cart' && candidate.type !== 'wishlist') return null;

  // Max freshness: 1 hour (3600000ms)
  if (typeof candidate.createdAt !== 'number' || Date.now() - candidate.createdAt > 3600000) {
    return null;
  }

  const prodId = candidate.product?.id || (candidate.product as any)?._id;
  if (!prodId || typeof prodId !== 'string') return null;

  const canonical =
    COFFEE_PRODUCTS.find((p) => p.id === prodId || p._id === prodId) ||
    (prodId === SUBSCRIPTION_FEATURED_PRODUCT.id ? SUBSCRIPTION_FEATURED_PRODUCT : null);

  if (!canonical) return null;

  const validGrinds: GrindOption[] = ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'];
  const validSizes: BagSize[] = ['250g', '500g', '1kg'];
  const validFrequencies: SubscriptionFrequency[] = ['2_weeks', '3_weeks', '4_weeks'];

  const maxStock = canonical.stockAvailable > 0 ? canonical.stockAvailable : 10;
  const rawQty = Number(candidate.quantity);
  const quantity = Number.isInteger(rawQty) && rawQty > 0 ? Math.min(rawQty, maxStock) : 1;
  const grind = candidate.grind && validGrinds.includes(candidate.grind) ? candidate.grind : 'Whole Bean';
  const size = candidate.size && validSizes.includes(candidate.size) ? candidate.size : '250g';
  const frequency =
    candidate.frequency && validFrequencies.includes(candidate.frequency) ? candidate.frequency : undefined;
  const returnUrl = getSafeInternalRedirect(candidate.returnUrl, '/shop');

  return {
    type: candidate.type,
    product: canonical, // Always canonical trusted product
    quantity,
    grind,
    size,
    frequency,
    returnUrl,
    createdAt: candidate.createdAt,
  };
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  const currentUserId = currentUser ? currentUser.id || (currentUser as any)._id : null;
  const activeUserIdRef = useRef<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? sanitizeLoadedCart(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<CoffeeProduct[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_WISHLIST_KEY);
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

  // Auth Required Modal & Pending Action State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<PendingAuthAction | null>(() => {
    try {
      const saved = sessionStorage.getItem(PENDING_AUTH_ACTION_KEY);
      return saved ? validateAndResolvePendingAction(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  const clearPendingAuthAction = useCallback(() => {
    setPendingAuthAction(null);
    try {
      sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Deferred action ref if user clicks while auth state is still resolving
  const deferredActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isLoading && deferredActionRef.current) {
      const fn = deferredActionRef.current;
      deferredActionRef.current = null;
      fn();
    }
  }, [isLoading]);

  // Synchronize authenticated user's cart & wishlist with strict account isolation
  useEffect(() => {
    const prevUserId = activeUserIdRef.current;
    activeUserIdRef.current = currentUserId;

    // 1. Account switched or logged out: wipe in-memory private state asynchronously
    if (prevUserId !== currentUserId) {
      queueMicrotask(() => {
        setCart([]);
        setWishlist([]);
      });

      if (!currentUserId) {
        // User logged out: clear any user storage and pending actions
        try {
          if (prevUserId) {
            localStorage.removeItem(`${USER_CART_KEY_PREFIX}${prevUserId}`);
            localStorage.removeItem(`${USER_WISHLIST_KEY_PREFIX}${prevUserId}`);
          }
          sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY);
        } catch {
          // ignore
        }
        return;
      }
    }

    if (!currentUser) return;

    // 2. Administrators never inherit or sync customer shopping carts or wishlists
    if (currentUser.role === 'admin') {
      queueMicrotask(() => {
        setCart([]);
        setWishlist([]);
        clearPendingAuthAction();
      });
      return;
    }

    // 3. Hydrate authenticated customer/wholesale cart and wishlist
    let isStale = false;

    async function hydrateUserCartAndWishlist() {
      try {
        // Hydrate Cart from backend
        const cartRes = await fetch('/api/v1/cart', { credentials: 'include' });
        if (isStale || activeUserIdRef.current !== currentUserId) return;

        if (cartRes.ok) {
          const cartData = await cartRes.json();
          if (cartData.success && cartData.cart?.items) {
            if (cartData.cart.items.length > 0) {
              const mappedCart: CartItem[] = cartData.cart.items.map((i: any) => ({
                product: {
                  ...i.product,
                  id: i.product.id || i.product._id,
                },
                quantity: i.quantity,
                grind: i.grind,
                size: i.size,
                frequency: i.frequency,
              }));
              setCart(mappedCart);
              // Clean up guest cart now that user has an authenticated cart
              try {
                localStorage.removeItem(GUEST_CART_KEY);
              } catch {
                // ignore
              }
            } else {
              // Backend cart is empty. Check if there was an explicit guest cart from the immediate session
              let guestCart: CartItem[] = [];
              try {
                const rawGuestCart = localStorage.getItem(GUEST_CART_KEY);
                guestCart = rawGuestCart ? sanitizeLoadedCart(JSON.parse(rawGuestCart)) : [];
              } catch {
                guestCart = [];
              }

              if (guestCart.length > 0) {
                try {
                  localStorage.removeItem(GUEST_CART_KEY);
                } catch {
                  // ignore
                }
                const syncRes = await fetch('/api/v1/cart/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ items: guestCart }),
                });
                if (syncRes.ok && !isStale && activeUserIdRef.current === currentUserId) {
                  const syncData = await syncRes.json();
                  if (syncData.success && syncData.cart?.items) {
                    const mapped: CartItem[] = syncData.cart.items.map((i: any) => ({
                      product: { ...i.product, id: i.product.id || i.product._id },
                      quantity: i.quantity,
                      grind: i.grind,
                      size: i.size,
                      frequency: i.frequency,
                    }));
                    setCart(mapped);
                  }
                }
              } else {
                setCart([]);
              }
            }
          }
        }

        // Hydrate Wishlist from backend
        const wishRes = await fetch('/api/v1/wishlist', { credentials: 'include' });
        if (isStale || activeUserIdRef.current !== currentUserId) return;

        if (wishRes.ok) {
          const wishData = await wishRes.json();
          if (wishData.success && Array.isArray(wishData.wishlist)) {
            if (wishData.wishlist.length > 0) {
              const mappedWishlist: CoffeeProduct[] = wishData.wishlist.map((p: any) => ({
                ...p,
                id: p.id || p._id,
              }));
              setWishlist(mappedWishlist);
              try {
                localStorage.removeItem(GUEST_WISHLIST_KEY);
              } catch {
                // ignore
              }
            } else {
              // Backend wishlist is empty. Check if there was an explicit guest wishlist
              let guestWishlist: CoffeeProduct[] = [];
              try {
                const rawGuestWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
                guestWishlist = rawGuestWishlist ? sanitizeLoadedWishlist(JSON.parse(rawGuestWishlist)) : [];
              } catch {
                guestWishlist = [];
              }

              if (guestWishlist.length > 0) {
                try {
                  localStorage.removeItem(GUEST_WISHLIST_KEY);
                } catch {
                  // ignore
                }
                const syncRes = await fetch('/api/v1/wishlist/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ productIds: guestWishlist.map((p) => p.id) }),
                });
                if (syncRes.ok && !isStale && activeUserIdRef.current === currentUserId) {
                  const syncData = await syncRes.json();
                  if (syncData.success && Array.isArray(syncData.wishlist)) {
                    setWishlist(syncData.wishlist.map((p: any) => ({ ...p, id: p.id || p._id })));
                  }
                }
              } else {
                setWishlist([]);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[CartContext] Backend cart/wishlist sync failed:', err);
      }
    }

    hydrateUserCartAndWishlist();

    return () => {
      isStale = true;
    };
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist guest or account-specific local cache
  useEffect(() => {
    try {
      if (!currentUser) {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
      } else if (currentUser.role !== 'admin' && currentUserId) {
        localStorage.setItem(`${USER_CART_KEY_PREFIX}${currentUserId}`, JSON.stringify(cart));
      }
    } catch (err) {
      console.warn('Unable to persist cart storage:', err);
    }
  }, [cart, currentUser, currentUserId]);

  useEffect(() => {
    try {
      if (!currentUser) {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
      } else if (currentUser.role !== 'admin' && currentUserId) {
        localStorage.setItem(`${USER_WISHLIST_KEY_PREFIX}${currentUserId}`, JSON.stringify(wishlist));
      }
    } catch (err) {
      console.warn('Unable to persist wishlist storage:', err);
    }
  }, [wishlist, currentUser, currentUserId]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // Internal execution helper for adding to cart
  const executeAddToCart = useCallback(
    (
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
            (item.product.id === product.id || item.product._id === product.id) &&
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

      // If authenticated, persist to MongoDB backend
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
    },
    [currentUser, showToast]
  );

  // Internal execution helper for adding to wishlist with duplicate prevention
  const executeAddToWishlist = useCallback(
    (product: CoffeeProduct) => {
      const prodId = product.id || product._id;
      setWishlist((prev) => {
        const exists = prev.some((p) => p.id === prodId || p._id === prodId);
        if (exists) return prev; // Do not duplicate!
        return [...prev, product];
      });

      if (currentUser && prodId) {
        fetch(`/api/v1/wishlist/${prodId}`, {
          method: 'POST',
          credentials: 'include',
        }).catch((err) => console.warn('[CartContext] Background wishlist add error:', err));
      }
    },
    [currentUser]
  );

  // Resume visitor's intended action after successful login or registration
  useEffect(() => {
    if (!currentUser) return;

    // Administrators never execute shopping deferred actions
    if (currentUser.role === 'admin') {
      queueMicrotask(() => {
        clearPendingAuthAction();
      });
      return;
    }

    let rawAction: unknown = null;
    try {
      const raw = sessionStorage.getItem(PENDING_AUTH_ACTION_KEY);
      if (raw) rawAction = JSON.parse(raw);
    } catch {
      rawAction = null;
    }

    // Always clear storage immediately to guarantee completion EXACTLY ONCE
    try {
      sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY);
    } catch {
      // ignore
    }

    const action = validateAndResolvePendingAction(rawAction);
    if (action && action.product) {
      const pending = action;
      // Schedule state update asynchronously to avoid cascading renders in effect
      const timer = setTimeout(() => {
        setPendingAuthAction(null);
        setIsAuthModalOpen(false);

        if (pending.type === 'cart') {
          const qty = pending.quantity || 1;
          const grind = pending.grind || 'Whole Bean';
          const size = pending.size || '250g';
          const freqLabel = pending.frequency ? ` (${pending.frequency.replace('_', ' ')})` : '';

          executeAddToCart(pending.product, qty, grind, size, pending.frequency);
          showToast(
            `Welcome, ${currentUser.name}! Added ${qty}x "${pending.product.name}" (${size}, ${grind}${freqLabel}) to your cart.`,
            'success'
          );
        } else if (pending.type === 'wishlist') {
          executeAddToWishlist(pending.product);
          showToast(
            `Welcome, ${currentUser.name}! Saved "${pending.product.name}" to your wishlist.`,
            'success'
          );
        }
      }, 0);

      return () => clearTimeout(timer);
    } else {
      queueMicrotask(() => {
        setPendingAuthAction(null);
      });
    }
  }, [currentUser, clearPendingAuthAction, executeAddToCart, executeAddToWishlist, showToast]);

  // Public addToCart: checks auth state reliably, opens modal for unauthenticated guests
  const addToCart = useCallback(
    function handleAddToCart(
      product: CoffeeProduct,
      quantity = 1,
      grind: GrindOption = 'Whole Bean',
      size: BagSize = '250g',
      frequency?: SubscriptionFrequency
    ) {
      // 1. If auth check is still resolving, defer action until loaded
      if (isLoading) {
        deferredActionRef.current = () =>
          handleAddToCart(product, quantity, grind, size, frequency);
        return;
      }

      // 2. Administrators never make personal shopping additions
      if (currentUser?.role === 'admin') {
        showToast('Staff administrative accounts cannot maintain a shopping cart. Please use a customer account.', 'info');
        return;
      }

      // 3. Unauthenticated visitor: record intended action and open auth modal
      if (!currentUser) {
        const returnUrl =
          typeof window !== 'undefined'
            ? getSafeInternalRedirect(window.location.pathname + window.location.search, '/shop')
            : '/shop';
        const action: PendingAuthAction = {
          type: 'cart',
          product,
          quantity,
          grind,
          size,
          frequency,
          returnUrl,
          createdAt: Date.now(),
        };

        setPendingAuthAction(action);
        try {
          sessionStorage.setItem(PENDING_AUTH_ACTION_KEY, JSON.stringify(action));
        } catch (err) {
          console.warn('Unable to store pending action in sessionStorage:', err);
        }
        setIsAuthModalOpen(true);
        return;
      }

      // 4. Authenticated customer: execute addition immediately
      executeAddToCart(product, quantity, grind, size, frequency);
      const frequencyLabel = frequency ? ` (${frequency.replace('_', ' ')})` : '';
      showToast(`Added ${quantity}x "${product.name}" (${size}, ${grind}${frequencyLabel}) to cart`);
    },
    [currentUser, executeAddToCart, isLoading, showToast]
  );

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

  // Public toggleWishlist: checks auth state reliably, opens modal for unauthenticated guests
  const toggleWishlist = useCallback(
    function handleToggleWishlist(product: CoffeeProduct) {
      // 1. If auth check is still resolving, defer action until loaded
      if (isLoading) {
        deferredActionRef.current = () => handleToggleWishlist(product);
        return;
      }

      // 2. Administrators never maintain a personal wishlist
      if (currentUser?.role === 'admin') {
        showToast('Staff administrative accounts cannot maintain a wishlist.', 'info');
        return;
      }

      // 3. Unauthenticated visitor: record intended action and open auth modal
      if (!currentUser) {
        const returnUrl =
          typeof window !== 'undefined'
            ? getSafeInternalRedirect(window.location.pathname + window.location.search, '/shop')
            : '/shop';
        const action: PendingAuthAction = {
          type: 'wishlist',
          product,
          returnUrl,
          createdAt: Date.now(),
        };

        setPendingAuthAction(action);
        try {
          sessionStorage.setItem(PENDING_AUTH_ACTION_KEY, JSON.stringify(action));
        } catch (err) {
          console.warn('Unable to store pending action in sessionStorage:', err);
        }
        setIsAuthModalOpen(true);
        return;
      }

      // 3. Authenticated customer: execute toggle
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
    },
    [currentUser, isLoading, showToast]
  );

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
        isAuthModalOpen,
        setIsAuthModalOpen,
        pendingAuthAction,
        setPendingAuthAction,
        clearPendingAuthAction,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
