import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Boxes,
  History,
  Search,
  Plus,
  Edit3,
  Archive,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../utils/pricing';

export interface ShopMaintenanceProps {
  onNotify: (msg: string) => void;
}

export const ShopMaintenanceSection: React.FC<ShopMaintenanceProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'inventory' | 'history'>('products');

  // ==========================================
  // PRODUCTS STATE
  // ==========================================
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [productStatus, setProductStatus] = useState<'all' | 'published' | 'unpublished' | 'archived'>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);

  // Product Modals
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [archivingProduct, setArchivingProduct] = useState<any | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Form State
  const initialFormData = {
    name: '',
    subtitle: '',
    slug: '',
    category: 'espresso',
    price: 550,
    originalPrice: 0,
    image: '/images/product-espresso.jpg',
    origin: '',
    roastLevel: 'Medium',
    tastingNotes: '',
    description: '',
    stockAvailable: 25,
    lowStockThreshold: 10,
    isPublished: true,
    isSale: false,
    saleLabel: 'Sale',
  };
  const [productFormData, setProductFormData] = useState(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // ==========================================
  // INVENTORY STATE
  // ==========================================
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'manual_adjustment' | 'restock' | 'reconciliation'>('manual_adjustment');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // ==========================================
  // MOVEMENT LOGS STATE
  // ==========================================
  const [movementLogs, setMovementLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // ==========================================
  // API FETCHERS
  // ==========================================

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({
        page: productPage.toString(),
        limit: '15',
        status: productStatus,
        category: productCategory,
        stockStatus: productStockFilter,
      });
      if (productSearch.trim()) params.append('search', productSearch.trim());

      const res = await fetch(`/api/v1/admin/products?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
        setProductTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, [productPage, productStatus, productCategory, productStockFilter, productSearch]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '25',
        lowStockOnly: inventoryLowStockOnly ? 'true' : 'false',
      });
      if (inventorySearch.trim()) params.append('search', inventorySearch.trim());

      const res = await fetch(`/api/v1/admin/inventory?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setInventorySummary(data.summary);
        setInventoryItems(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setInventoryLoading(false);
    }
  }, [inventorySearch, inventoryLowStockOnly]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: '20',
      });
      if (logTypeFilter !== 'all') params.append('type', logTypeFilter);

      const res = await fetch(`/api/v1/admin/inventory/logs?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMovementLogs(data.logs || []);
        setLogsTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load inventory logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, logTypeFilter]);

  // Trigger data load based on active tab
  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    else if (activeTab === 'inventory') fetchInventory();
    else if (activeTab === 'history') fetchLogs();
  }, [activeTab, fetchProducts, fetchInventory, fetchLogs]);

  // ==========================================
  // PRODUCT ACTION HANDLERS
  // ==========================================

  const handleOpenCreateModal = () => {
    setProductFormData(initialFormData);
    setFormError(null);
    setIsCreatingProduct(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setProductFormData({
      name: p.name || '',
      subtitle: p.subtitle || '',
      slug: p.slug || '',
      category: p.category || 'espresso',
      price: p.price || 0,
      originalPrice: p.originalPrice || 0,
      image: p.image || '/images/product-espresso.jpg',
      origin: p.origin || '',
      roastLevel: p.roastLevel || 'Medium',
      tastingNotes: Array.isArray(p.tastingNotes) ? p.tastingNotes.join(', ') : '',
      description: p.description || '',
      stockAvailable: p.stockAvailable ?? 20,
      lowStockThreshold: p.lowStockThreshold ?? 10,
      isPublished: p.isPublished ?? true,
      isSale: p.isSale ?? false,
      saleLabel: p.saleLabel || 'Sale',
    });
    setFormError(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!productFormData.name.trim()) {
      setFormError('Roast name is required');
      return;
    }
    if (productFormData.price < 0) {
      setFormError('Price cannot be negative');
      return;
    }
    if (!productFormData.origin.trim()) {
      setFormError('Origin estate or region is required');
      return;
    }
    if (!productFormData.description.trim()) {
      setFormError('Roast description is required');
      return;
    }

    setSubmittingProduct(true);
    try {
      const url = isCreatingProduct ? '/api/v1/admin/products' : `/api/v1/admin/products/${editingProduct.id}`;
      const method = isCreatingProduct ? 'POST' : 'PUT';

      const payload = {
        ...productFormData,
        price: Number(productFormData.price),
        originalPrice: productFormData.originalPrice > 0 ? Number(productFormData.originalPrice) : undefined,
        stockAvailable: Number(productFormData.stockAvailable),
        lowStockThreshold: Number(productFormData.lowStockThreshold),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onNotify(isCreatingProduct ? `Created new roast "${data.product.name}"` : `Updated roast "${data.product.name}"`);
        setIsCreatingProduct(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        setFormError(data.error || 'Failed to save product');
      }
    } catch {
      setFormError('Network connection error while saving product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleTogglePublication = async (p: any) => {
    try {
      const target = !p.isPublished;
      const res = await fetch(`/api/v1/admin/products/${p.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`"${p.name}" is now ${target ? 'Published' : 'Unpublished'}`);
        fetchProducts();
      } else {
        onNotify(data.error || 'Failed to update publication status');
      }
    } catch {
      onNotify('Network error updating status');
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingProduct) return;
    try {
      const res = await fetch(`/api/v1/admin/products/${archivingProduct.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isArchived: true, reason: archiveReason || 'Archived from admin dashboard' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`"${archivingProduct.name}" has been safely archived`);
        setArchivingProduct(null);
        setArchiveReason('');
        fetchProducts();
      } else {
        onNotify(data.error || 'Failed to archive product');
      }
    } catch {
      onNotify('Network error archiving product');
    }
  };

  // ==========================================
  // INVENTORY ADJUSTMENT HANDLERS
  // ==========================================

  const handleOpenAdjustModal = (item: any) => {
    setAdjustingProduct(item);
    setAdjustQty(0);
    setAdjustReason('');
    setAdjustType('manual_adjustment');
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      alert('A mandatory reason (minimum 3 characters) is required for inventory adjustment audit trails.');
      return;
    }
    if (adjustQty === 0) {
      alert('Adjustment quantity cannot be 0.');
      return;
    }

    const projectedStock = adjustingProduct.currentStock + adjustQty;
    if (projectedStock < 0) {
      alert(`Adjustment would result in negative inventory (${projectedStock}). Available: ${adjustingProduct.currentStock}.`);
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/inventory/${adjustingProduct.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adjustment: Number(adjustQty),
          reason: adjustReason.trim(),
          type: adjustType,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onNotify(data.message || `Stock for "${adjustingProduct.name}" updated successfully`);
        setAdjustingProduct(null);
        fetchInventory();
        if (activeTab === 'history') fetchLogs();
      } else {
        alert(data.error || 'Failed to adjust inventory');
      }
    } catch {
      alert('Network error adjusting inventory');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-700/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalogue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Stockroom</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Movement History</span>
          </button>
        </div>

        {activeTab === 'products' && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Specialty Roast</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. PRODUCT CATALOGUE VIEW */}
      {/* ============================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search roast name, origin, or notes..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={productCategory}
                onChange={(e) => {
                  setProductCategory(e.target.value);
                  setProductPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 capitalize"
              >
                <option value="all">All Categories</option>
                <option value="espresso">Espresso</option>
                <option value="cappuccino">Cappuccino</option>
                <option value="americano">Americano</option>
                <option value="latte">Latte</option>
                <option value="moca">Moca</option>
                <option value="cold_brew">Cold Brew</option>
              </select>

              {/* Status Filter */}
              <select
                value={productStatus}
                onChange={(e) => {
                  setProductStatus(e.target.value as any);
                  setProductPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="unpublished">Unpublished Only</option>
                <option value="archived">Archived</option>
              </select>

              {/* Stock Status Filter */}
              <select
                value={productStockFilter}
                onChange={(e) => {
                  setProductStockFilter(e.target.value as any);
                  setProductPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchProducts}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh product list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${productsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Product Cards Table */}
          {productsLoading ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Loading roastery catalogue...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 rounded-2xl bg-stone-800/40 border border-stone-800 text-center space-y-2">
              <Package className="w-8 h-8 text-stone-500 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">No products match current criteria</p>
              <p className="text-xs text-stone-500">Try loosening your search query or status filter.</p>
            </div>
          ) : (
            <div className="bg-stone-800/90 border border-stone-700 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-700">
                    <tr>
                      <th className="py-3 px-4">Roast</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-right">Base Price (250g)</th>
                      <th className="py-3 px-3 text-center">Warehouse Stock</th>
                      <th className="py-3 px-3 text-center">Publication Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-700/60 text-stone-200">
                    {products.map((p) => {
                      const threshold = p.lowStockThreshold ?? 10;
                      const isLow = p.stockAvailable > 0 && p.stockAvailable <= threshold;
                      const isOut = p.stockAvailable === 0;

                      return (
                        <tr key={p.id} className="hover:bg-stone-700/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-stone-900 border border-stone-700 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/product-espresso.jpg';
                                }}
                              />
                              <div>
                                <span className="font-semibold text-stone-100 block text-xs">{p.name}</span>
                                <span className="text-[11px] text-stone-400 block font-mono">
                                  {p.slug ? `/${p.slug}` : p.origin}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 capitalize text-stone-300">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-900 border border-stone-700 text-stone-300">
                              {p.category}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="font-bold text-amber-300 text-sm">{formatCurrency(p.price)}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-stone-500 line-through block">
                                {formatCurrency(p.originalPrice)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase inline-block ${
                                isOut
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : isLow
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {isOut ? 'Out of Stock' : isLow ? `Low: ${p.stockAvailable} Bags` : `${p.stockAvailable} Bags`}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {p.isArchived ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                                Archived
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePublication(p)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1 ${
                                  p.isPublished
                                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                    : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-700'
                                }`}
                                title="Click to toggle publication"
                              >
                                {p.isPublished ? (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-400" />
                                    <span>Published</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-stone-500" />
                                    <span>Unpublished</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
                                title="Edit roast details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!p.isArchived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setArchivingProduct(p);
                                    setArchiveReason('');
                                  }}
                                  className="p-1.5 rounded-lg bg-stone-700 hover:bg-rose-900/60 text-stone-300 hover:text-rose-300 transition-colors"
                                  title="Safely archive roast"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {productTotalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-stone-700 bg-stone-950/40 text-xs text-stone-400">
                  <span>
                    Page {productPage} of {productTotalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={productPage <= 1}
                      onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={productPage >= productTotalPages}
                      onClick={() => setProductPage((prev) => Math.min(productTotalPages, prev + 1))}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. WAREHOUSE STOCKROOM VIEW */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          {inventorySummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Active Roasts</span>
                <div className="text-2xl font-serif font-bold text-stone-100">{inventorySummary.totalSkus} SKUs</div>
                <p className="text-[10px] text-stone-500">Tracked in production catalogue</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Total Stock</span>
                <div className="text-2xl font-serif font-bold text-amber-400">{inventorySummary.totalStockBags} Bags</div>
                <p className="text-[10px] text-stone-500">Roasted inventory on hand</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Low Stock Warnings</span>
                <div className="text-2xl font-serif font-bold text-amber-500">{inventorySummary.lowStockCount}</div>
                <p className="text-[10px] text-stone-500">Under reorder threshold</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Stockouts</span>
                <div className="text-2xl font-serif font-bold text-rose-400">{inventorySummary.outOfStockCount}</div>
                <p className="text-[10px] text-stone-500">Zero inventory remaining</p>
              </div>
            </div>
          )}

          {/* Search & Low-Stock Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory by roast name..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={inventoryLowStockOnly}
                onChange={(e) => setInventoryLowStockOnly(e.target.checked)}
                className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Show Low Stock Only</span>
            </label>
          </div>

          {/* Stock Table */}
          {inventoryLoading ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Auditing warehouse stock levels...</p>
            </div>
          ) : inventoryItems.length === 0 ? (
            <div className="p-12 rounded-2xl bg-stone-800/40 border border-stone-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">All inventory levels are healthy</p>
            </div>
          ) : (
            <div className="bg-stone-800/90 border border-stone-700 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Product Roast</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Current Stock</th>
                    <th className="py-3 px-3 text-center">Available Stock</th>
                    <th className="py-3 px-3 text-center">Reorder Threshold</th>
                    <th className="py-3 px-3 text-center">Alert Status</th>
                    <th className="py-3 px-4 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 text-stone-200">
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-700/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-stone-100">{item.name}</td>
                      <td className="py-3 px-3 capitalize text-stone-400">{item.category}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-300 text-sm">
                        {item.currentStock} Bags
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-stone-300">{item.availableStock} Bags</td>
                      <td className="py-3 px-3 text-center font-mono text-stone-400">{item.lowStockThreshold} Bags</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'out_of_stock'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : item.status === 'low_stock'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjustModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-xs transition-colors shadow-sm"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. INVENTORY MOVEMENT HISTORY VIEW */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Filter Type:</span>
              <select
                value={logTypeFilter}
                onChange={(e) => {
                  setLogTypeFilter(e.target.value);
                  setLogsPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs capitalize"
              >
                <option value="all">All Movements</option>
                <option value="manual_adjustment">Manual Adjustment</option>
                <option value="restock">Restock</option>
                <option value="retail_order">Retail Order</option>
                <option value="wholesale_order">Wholesale Order</option>
                <option value="reconciliation">Reconciliation</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {logsLoading ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Loading movement audit trail...</p>
            </div>
          ) : movementLogs.length === 0 ? (
            <div className="p-12 rounded-2xl bg-stone-800/40 border border-stone-800 text-center space-y-2">
              <History className="w-8 h-8 text-stone-500 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">No inventory movements recorded yet</p>
            </div>
          ) : (
            <div className="bg-stone-800/90 border border-stone-700 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Roast</th>
                    <th className="py-3 px-3 text-center">Type</th>
                    <th className="py-3 px-3 text-center">Delta</th>
                    <th className="py-3 px-3 text-center">Transition</th>
                    <th className="py-3 px-4">Mandatory Audit Reason</th>
                    <th className="py-3 px-4">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 text-stone-200">
                  {movementLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-700/30 transition-colors">
                      <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      <td className="py-3 px-3 font-semibold text-stone-100">{log.productName}</td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-900 border border-stone-700 text-stone-300">
                          {log.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={log.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-stone-400 text-[11px]">
                        {log.previousStock} &rarr;{' '}
                        <strong className="text-stone-200">{log.newStock}</strong>
                      </td>

                      <td className="py-3 px-4 text-stone-300 max-w-xs truncate" title={log.reason}>
                        {log.reason}
                        {log.orderNumber && (
                          <span className="text-[10px] text-amber-400 block font-mono">Ref: {log.orderNumber}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-400 text-[11px]">
                        <span className="text-stone-200 block font-semibold">{log.actor?.name || 'Staff'}</span>
                        <span className="text-[10px] text-stone-500">{log.actor?.email}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Logs Pagination */}
              {logsTotalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-stone-700 bg-stone-950/40 text-xs text-stone-400">
                  <span>
                    Page {logsPage} of {logsTotalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={logsPage <= 1}
                      onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={logsPage >= logsTotalPages}
                      onClick={() => setLogsPage((prev) => Math.min(logsTotalPages, prev + 1))}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ============================================================== */}
      {(isCreatingProduct || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-3xl w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {isCreatingProduct ? 'Create New Specialty Coffee Roast' : `Edit Roast: ${editingProduct?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingProduct(false);
                  setEditingProduct(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roast Name */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Roast Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Estate Malabar Commercial Reserve"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">
                    URL Slug <span className="text-stone-500">(Auto-generated if blank)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. estate-malabar-reserve"
                    value={productFormData.slug}
                    onChange={(e) => setProductFormData({ ...productFormData, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-stone-300 font-semibold block">Subtitle / Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Full-bodied with spicy dark chocolate and molasses notes"
                    value={productFormData.subtitle}
                    onChange={(e) => setProductFormData({ ...productFormData, subtitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Category *</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs capitalize"
                  >
                    <option value="espresso">Espresso</option>
                    <option value="cappuccino">Cappuccino</option>
                    <option value="americano">Americano</option>
                    <option value="latte">Latte</option>
                    <option value="moca">Moca</option>
                    <option value="cold_brew">Cold Brew</option>
                  </select>
                </div>

                {/* Roast Level */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Roast Level *</label>
                  <select
                    value={productFormData.roastLevel}
                    onChange={(e) => setProductFormData({ ...productFormData, roastLevel: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs"
                  >
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Medium-Dark">Medium-Dark</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>

                {/* Price (INR) */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Base Retail Price (₹ INR for 250g) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>

                {/* Original Price */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">
                    Original Price (₹ INR) <span className="text-stone-500">(For crossed-out sale)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={productFormData.originalPrice}
                    onChange={(e) => setProductFormData({ ...productFormData, originalPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs font-mono"
                  />
                </div>

                {/* Initial Stock */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Stock Available (Bags) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productFormData.stockAvailable}
                    onChange={(e) => setProductFormData({ ...productFormData, stockAvailable: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs font-mono"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Low-Stock Alert Threshold</label>
                  <input
                    type="number"
                    min={1}
                    value={productFormData.lowStockThreshold}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, lowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs font-mono"
                  />
                </div>

                {/* Single Origin Region */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-stone-300 font-semibold block">Single-Origin Region & Estate *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chikmagalur, Karnataka / Araku Valley, Andhra Pradesh"
                    value={productFormData.origin}
                    onChange={(e) => setProductFormData({ ...productFormData, origin: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-stone-300 font-semibold block">Image Path or URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="/images/product-espresso.jpg"
                    value={productFormData.image}
                    onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs font-mono"
                  />
                </div>

                {/* Tasting Notes */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-stone-300 font-semibold block">
                    Tasting Notes <span className="text-stone-500">(Comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Dark Chocolate, Toasted Hazelnut, Brown Sugar"
                    value={productFormData.tastingNotes}
                    onChange={(e) => setProductFormData({ ...productFormData, tastingNotes: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-stone-300 font-semibold block">Roastery Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe flavor balance, body, and recommended brewing style..."
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Publication & Sale Switches */}
                <div className="sm:col-span-2 flex flex-wrap items-center gap-6 p-3 bg-stone-900 rounded-xl border border-stone-700">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={productFormData.isPublished}
                      onChange={(e) => setProductFormData({ ...productFormData, isPublished: e.target.checked })}
                      className="rounded bg-stone-800 border-stone-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-stone-200 font-medium">Publish immediately to public storefront</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={productFormData.isSale}
                      onChange={(e) => setProductFormData({ ...productFormData, isSale: e.target.checked })}
                      className="rounded bg-stone-800 border-stone-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-stone-200 font-medium">Mark as Sale roast</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {submittingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreatingProduct ? 'Create Roast' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SAFE ARCHIVAL CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {archivingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Archive Specialty Roast
              </h3>
              <button
                type="button"
                onClick={() => setArchivingProduct(null)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to archive <strong className="text-amber-300">{archivingProduct.name}</strong>?
              This will safely unpublish the roast and hide it from the customer storefront while{' '}
              <strong>preserving all historical orders and invoices</strong>.
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-stone-400 font-semibold block">Archival Audit Reason</label>
              <input
                type="text"
                placeholder="e.g. Harvest season ended / Estate lot exhausted"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchivingProduct(null)}
                className="flex-1 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Confirm Archival
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INVENTORY ADJUSTMENT MODAL */}
      {/* ============================================================== */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-100">
                  Adjust Inventory Stock
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">{adjustingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-900 rounded-xl">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">Current Stock</span>
                  <span className="text-stone-100 font-mono font-bold text-base">
                    {adjustingProduct.currentStock} Bags
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">Projected Stock</span>
                  <span
                    className={`font-mono font-bold text-base ${
                      adjustingProduct.currentStock + adjustQty < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {adjustingProduct.currentStock + adjustQty} Bags
                  </span>
                </div>
              </div>

              {/* Adjustment Type */}
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Adjustment Classification</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs capitalize"
                >
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="restock">Restock / Roastery Intake</option>
                  <option value="reconciliation">Audit Reconciliation</option>
                </select>
              </div>

              {/* Quantity Change Delta */}
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">
                  Quantity Change Delta <span className="text-stone-500">(+ to add, - to deduct)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => prev - 5)}
                      className="px-2.5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-mono"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => prev + 10)}
                      className="px-2.5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-mono"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">
                  Mandatory Audit Reason * <span className="text-amber-400">(Required)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Fresh green beans intake roasted / Defective seal disposal during cupping..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting || adjustQty === 0 || adjustReason.trim().length < 3}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
                >
                  {adjustSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Commit Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
