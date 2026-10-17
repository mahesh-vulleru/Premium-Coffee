import type { CoffeeProduct } from '../types/coffee';
import { COFFEE_PRODUCTS } from '../data/coffeeData';

export interface ProductQueryOptions {
  search?: string;
  category?: string;
  roastLevel?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  products: CoffeeProduct[];
  total: number;
  count: number;
  page: number;
  totalPages: number;
  isFallback?: boolean;
  error?: string;
}

export async function fetchProducts(options: ProductQueryOptions = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.category && options.category !== 'all') params.append('category', options.category);
  if (options.roastLevel && options.roastLevel !== 'all') params.append('roastLevel', options.roastLevel);
  if (options.tag && options.tag !== 'all') params.append('tag', options.tag);
  if (options.sort) params.append('sort', options.sort);
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());

  try {
    const res = await fetch(`/api/v1/products?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        return {
          success: true,
          products: data.products.map((p: any) => ({
            ...p,
            id: p.id || p._id || p.name.toLowerCase().replace(/\s+/g, '-'),
          })),
          total: data.total,
          count: data.count,
          page: data.page,
          totalPages: data.totalPages,
        };
      }
    }
  } catch (err) {
    console.warn('[ProductService] Backend API fetch failed, using canonical dataset:', err);
  }

  // Graceful fallback to canonical product dataset if API is temporarily unreachable
  let filtered = [...COFFEE_PRODUCTS];

  if (options.category && options.category !== 'all') {
    filtered = filtered.filter((p) => p.category === options.category);
  }

  if (options.roastLevel && options.roastLevel !== 'all') {
    filtered = filtered.filter((p) => p.roastLevel === options.roastLevel);
  }

  if (options.tag && options.tag !== 'all') {
    if (options.tag === 'sale') {
      filtered = filtered.filter((p) => p.isSale);
    } else {
      filtered = filtered.filter((p) => p.tag === options.tag);
    }
  }

  if (options.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.origin.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tastingNotes.some((t) => t.toLowerCase().includes(query))
    );
  }

  return {
    success: true,
    products: filtered,
    total: filtered.length,
    count: filtered.length,
    page: 1,
    totalPages: 1,
    isFallback: true,
  };
}

export async function fetchProductById(id: string): Promise<CoffeeProduct | null> {
  try {
    const res = await fetch(`/api/v1/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.product) {
        return {
          ...data.product,
          id: data.product.id || data.product._id,
        };
      }
    }
  } catch (err) {
    console.warn(`[ProductService] Failed to fetch product ${id} from API:`, err);
  }

  // Fallback check in canonical data
  const local = COFFEE_PRODUCTS.find(
    (p) =>
      p.id === id ||
      p.name.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase() ||
      p.name.toLowerCase() === id.toLowerCase()
  );

  return local || null;
}
