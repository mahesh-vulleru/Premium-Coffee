import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Boxes,
  History,
  Plus,
  Edit2,
  Archive,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Tag,
  Layers,
  Layout,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '../utils/pricing';

export interface ShopMaintenanceProps {
  onNotify: (msg: string) => void;
}

export const ShopMaintenanceSection: React.FC<ShopMaintenanceProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<
    'products' | 'pricing' | 'inventory' | 'promotions' | 'categories' | 'content' | 'history'
  >('products');

  // ==========================================
  // 1. PRODUCTS STATE
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
  // 2. PRICING STATE (Feature A)
  // ==========================================
  const [pricingProducts, setPricingProducts] = useState<any[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSearch, setPricingSearch] = useState('');
  const [editingPricing, setEditingPricing] = useState<any | null>(null);
  const [pricingForm, setPricingForm] = useState({
    price: 0,
    originalPrice: 0,
    promotionPrice: 0,
    promotionStartDate: '',
    promotionEndDate: '',
    isSale: false,
    saleLabel: 'Sale',
  });
  const [pricingSubmitting, setPricingSubmitting] = useState(false);

  // ==========================================
  // 3. INVENTORY STATE
  // ==========================================
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventorySummary, setInventorySummary] = useState<any>({
    totalProducts: 0,
    totalStockBags: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  // ==========================================
  // 4. PROMOTIONS STATE (Feature B)
  // ==========================================
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promoSearch, setPromoSearch] = useState('');
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [promoFormData, setPromoFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 0,
    isActive: true,
  });
  const [submittingPromo, setSubmittingPromo] = useState(false);

  // ==========================================
  // 5. CATEGORIES STATE (Feature C)
  // ==========================================
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [archivingCategory, setArchivingCategory] = useState<any | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '☕',
    displayOrder: 0,
    isActive: true,
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // ==========================================
  // 6. STOREFRONT CONTENT STATE (Feature D)
  // ==========================================
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [isCreatingContent, setIsCreatingContent] = useState(false);
  const [contentFormData, setContentFormData] = useState({
    key: '',
    contentType: 'banner' as 'announcement' | 'banner' | 'promo_card' | 'featured_section',
    title: '',
    subtitle: '',
    badge: '',
    description: '',
    linkText: '',
    linkUrl: '',
    displayOrder: 0,
    isActive: true,
    isPublished: true,
  });
  const [submittingContent, setSubmittingContent] = useState(false);

  // ==========================================
  // 7. MOVEMENT LOGS STATE
  // ==========================================
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // ==========================================
  // FETCH HANDLERS
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

  const fetchPricing = useCallback(async () => {
    setPricingLoading(true);
    try {
      const params = new URLSearchParams();
      if (pricingSearch.trim()) params.append('search', pricingSearch.trim());
      const res = await fetch(`/api/v1/admin/pricing?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPricingProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load pricing:', err);
    } finally {
      setPricingLoading(false);
    }
  }, [pricingSearch]);

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
      console.error('Failed to load admin inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  }, [inventorySearch, inventoryLowStockOnly]);

  const fetchPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (promoSearch.trim()) params.append('search', promoSearch.trim());
      const res = await fetch(`/api/v1/admin/promotions?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setPromotionsLoading(false);
    }
  }, [promoSearch]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/v1/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const res = await fetch('/api/v1/admin/content', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setContentItems(data.content || []);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setContentLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/v1/admin/inventory/logs?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs || []);
        setLogsTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load movement logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage]);

  // Tab activation triggers
  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    else if (activeTab === 'pricing') fetchPricing();
    else if (activeTab === 'inventory') fetchInventory();
    else if (activeTab === 'promotions') fetchPromotions();
    else if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'content') fetchContent();
    else if (activeTab === 'history') fetchLogs();
  }, [activeTab, fetchProducts, fetchPricing, fetchInventory, fetchPromotions, fetchCategories, fetchContent, fetchLogs]);

  // ==========================================
  // ACTION HANDLERS: PRODUCTS
  // ==========================================
  const handleOpenCreateModal = () => {
    setProductFormData(initialFormData);
    setIsCreatingProduct(true);
    setEditingProduct(null);
    setFormError(null);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setIsCreatingProduct(false);
    setProductFormData({
      name: p.name || '',
      subtitle: p.subtitle || '',
      slug: p.slug || '',
      category: p.category || 'espresso',
      price: p.price ?? 550,
      originalPrice: p.originalPrice ?? 0,
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
      setFormError('Network communication error');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleTogglePublication = async (product: any) => {
    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !product.isPublished }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`"${product.name}" is now ${!product.isPublished ? 'published' : 'hidden from storefront'}`);
        fetchProducts();
      } else {
        onNotify(data.error || 'Failed to update publication status');
      }
    } catch {
      onNotify('Network communication error');
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingProduct) return;
    try {
      const res = await fetch(`/api/v1/admin/products/${archivingProduct.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: archiveReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Archived roast "${archivingProduct.name}". Removed from active store.`);
        setArchivingProduct(null);
        setArchiveReason('');
        fetchProducts();
      } else {
        onNotify(data.error || 'Failed to archive roast');
      }
    } catch {
      onNotify('Network error during archival');
    }
  };

  // ==========================================
  // ACTION HANDLERS: PRICING (Feature A)
  // ==========================================
  const handleOpenPricingModal = (p: any) => {
    setEditingPricing(p);
    setPricingForm({
      price: p.price ?? 550,
      originalPrice: p.originalPrice ?? 0,
      promotionPrice: p.promotionPrice ?? 0,
      promotionStartDate: p.promotionStartDate ? new Date(p.promotionStartDate).toISOString().slice(0, 10) : '',
      promotionEndDate: p.promotionEndDate ? new Date(p.promotionEndDate).toISOString().slice(0, 10) : '',
      isSale: Boolean(p.isSale),
      saleLabel: p.saleLabel || 'Sale',
    });
    setFormError(null);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = Number(pricingForm.price);
    const promoNum = Number(pricingForm.promotionPrice);

    if (priceNum < 0) {
      setFormError('Retail price cannot be negative');
      return;
    }

    if (promoNum > 0 && promoNum >= priceNum) {
      setFormError(`Sale price (₹${promoNum}) must be strictly lower than regular retail price (₹${priceNum})`);
      return;
    }

    if (pricingForm.promotionStartDate && pricingForm.promotionEndDate) {
      if (new Date(pricingForm.promotionEndDate) < new Date(pricingForm.promotionStartDate)) {
        setFormError('Promotion end date cannot be earlier than start date');
        return;
      }
    }

    setPricingSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/pricing/${editingPricing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          price: priceNum,
          originalPrice: Number(pricingForm.originalPrice) > 0 ? Number(pricingForm.originalPrice) : undefined,
          promotionPrice: promoNum > 0 ? promoNum : null,
          promotionStartDate: pricingForm.promotionStartDate || null,
          promotionEndDate: pricingForm.promotionEndDate || null,
          isSale: pricingForm.isSale,
          saleLabel: pricingForm.saleLabel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Updated pricing for "${editingPricing.name}"`);
        setEditingPricing(null);
        fetchPricing();
      } else {
        setFormError(data.error || 'Failed to update pricing');
      }
    } catch {
      setFormError('Network error updating pricing');
    } finally {
      setPricingSubmitting(false);
    }
  };

  // ==========================================
  // ACTION HANDLERS: INVENTORY
  // ==========================================
  const handleOpenAdjustModal = (product: any) => {
    setAdjustingProduct(product);
    setAdjustmentDelta(0);
    setAdjustmentReason('');
    setFormError(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (adjustmentDelta === 0) {
      setFormError('Adjustment delta cannot be 0. Specify positive or negative bags.');
      return;
    }

    if (!adjustmentReason.trim() || adjustmentReason.trim().length < 3) {
      setFormError('A mandatory operational reason (minimum 3 characters) is strictly required.');
      return;
    }

    const currentStock = adjustingProduct.stockAvailable ?? 0;
    if (currentStock + adjustmentDelta < 0) {
      setFormError(`Cannot adjust below zero. Current stock is ${currentStock} bags; attempted delta is ${adjustmentDelta}.`);
      return;
    }

    setSubmittingAdjustment(true);
    try {
      const res = await fetch(`/api/v1/admin/inventory/${adjustingProduct.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          delta: Number(adjustmentDelta),
          reason: adjustmentReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Stock adjusted for "${adjustingProduct.name}": new level is ${data.newStock} bags.`);
        setAdjustingProduct(null);
        fetchInventory();
      } else {
        setFormError(data.error || 'Failed to adjust inventory');
      }
    } catch {
      setFormError('Network communication error during adjustment');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // ==========================================
  // ACTION HANDLERS: PROMOTIONS (Feature B)
  // ==========================================
  const handleOpenCreatePromo = () => {
    setPromoFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 0,
      isActive: true,
    });
    setIsCreatingPromo(true);
    setEditingPromo(null);
    setFormError(null);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!promoFormData.code.trim()) {
      setFormError('Coupon code is required');
      return;
    }
    if (!promoFormData.description.trim()) {
      setFormError('Description is required');
      return;
    }
    if (promoFormData.discountValue <= 0) {
      setFormError('Discount value must be greater than 0');
      return;
    }

    setSubmittingPromo(true);
    try {
      const url = isCreatingPromo ? '/api/v1/admin/promotions' : `/api/v1/admin/promotions/${editingPromo.id}`;
      const method = isCreatingPromo ? 'POST' : 'PUT';

      const payload = {
        code: promoFormData.code.trim().toUpperCase(),
        description: promoFormData.description.trim(),
        discountType: promoFormData.discountType,
        discountValue: Number(promoFormData.discountValue),
        minOrderAmount: Number(promoFormData.minOrderAmount) || 0,
        maxDiscountAmount: Number(promoFormData.maxDiscountAmount) > 0 ? Number(promoFormData.maxDiscountAmount) : undefined,
        startDate: promoFormData.startDate || undefined,
        endDate: promoFormData.endDate || undefined,
        usageLimit: Number(promoFormData.usageLimit) > 0 ? Number(promoFormData.usageLimit) : undefined,
        isActive: promoFormData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(isCreatingPromo ? `Created coupon "${data.promotion.code}"` : `Updated coupon "${data.promotion.code}"`);
        setIsCreatingPromo(false);
        setEditingPromo(null);
        fetchPromotions();
      } else {
        setFormError(data.error || 'Failed to save promotion');
      }
    } catch {
      setFormError('Network communication error');
    } finally {
      setSubmittingPromo(false);
    }
  };

  const handleTogglePromoStatus = async (promo: any) => {
    try {
      const res = await fetch(`/api/v1/admin/promotions/${promo.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Coupon "${promo.code}" is now ${!promo.isActive ? 'active' : 'inactive'}`);
        fetchPromotions();
      } else {
        onNotify(data.error || 'Failed to toggle coupon status');
      }
    } catch {
      onNotify('Network error');
    }
  };

  // ==========================================
  // ACTION HANDLERS: CATEGORIES (Feature C)
  // ==========================================
  const handleOpenCreateCategory = () => {
    setCategoryFormData({
      name: '',
      slug: '',
      description: '',
      icon: '☕',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setIsCreatingCategory(true);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryFormData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmittingCategory(true);
    try {
      const url = isCreatingCategory ? '/api/v1/admin/categories' : `/api/v1/admin/categories/${editingCategory.id}`;
      const method = isCreatingCategory ? 'POST' : 'PUT';

      const payload = {
        name: categoryFormData.name.trim(),
        slug: categoryFormData.slug.trim() || undefined,
        description: categoryFormData.description.trim() || undefined,
        icon: categoryFormData.icon.trim() || undefined,
        displayOrder: Number(categoryFormData.displayOrder) || 0,
        isActive: categoryFormData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(isCreatingCategory ? `Created category "${data.category.name}"` : `Updated category "${data.category.name}"`);
        setIsCreatingCategory(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        setFormError(data.error || 'Failed to save category');
      }
    } catch {
      setFormError('Network communication error');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleConfirmArchiveCategory = async () => {
    if (!archivingCategory) return;
    try {
      const res = await fetch(`/api/v1/admin/categories/${archivingCategory.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Archived category "${archivingCategory.name}"`);
        setArchivingCategory(null);
        fetchCategories();
      } else {
        onNotify(data.error || 'Failed to archive category');
      }
    } catch {
      onNotify('Network communication error');
    }
  };

  // ==========================================
  // ACTION HANDLERS: STOREFRONT CONTENT (Feature D)
  // ==========================================
  const handleOpenCreateContent = () => {
    setContentFormData({
      key: '',
      contentType: 'banner',
      title: '',
      subtitle: '',
      badge: '',
      description: '',
      linkText: '',
      linkUrl: '',
      displayOrder: contentItems.length + 1,
      isActive: true,
      isPublished: true,
    });
    setIsCreatingContent(true);
    setEditingContent(null);
    setFormError(null);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!contentFormData.key.trim()) {
      setFormError('Unique key identifier is required');
      return;
    }
    if (!contentFormData.title.trim()) {
      setFormError('Title is required');
      return;
    }

    setSubmittingContent(true);
    try {
      const url = isCreatingContent ? '/api/v1/admin/content' : `/api/v1/admin/content/${editingContent.id}`;
      const method = isCreatingContent ? 'POST' : 'PUT';

      const payload = {
        key: contentFormData.key.trim().toLowerCase().replace(/\s+/g, '_'),
        contentType: contentFormData.contentType,
        title: contentFormData.title.trim(),
        subtitle: contentFormData.subtitle.trim() || undefined,
        badge: contentFormData.badge.trim() || undefined,
        description: contentFormData.description.trim() || undefined,
        linkText: contentFormData.linkText.trim() || undefined,
        linkUrl: contentFormData.linkUrl.trim() || undefined,
        displayOrder: Number(contentFormData.displayOrder) || 0,
        isActive: contentFormData.isActive,
        isPublished: contentFormData.isPublished,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(isCreatingContent ? `Created storefront content "${data.content.title}"` : `Updated storefront content "${data.content.title}"`);
        setIsCreatingContent(false);
        setEditingContent(null);
        fetchContent();
      } else {
        setFormError(data.error || 'Failed to save storefront content');
      }
    } catch {
      setFormError('Network communication error');
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleToggleContentPub = async (item: any) => {
    try {
      const res = await fetch(`/api/v1/admin/content/${item.id}/publication`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Content "${item.title}" is now ${!item.isPublished ? 'published' : 'unpublished'}`);
        fetchContent();
      } else {
        onNotify(data.error || 'Failed to toggle publication');
      }
    } catch {
      onNotify('Network error');
    }
  };

  const handleDeleteContent = async (item: any) => {
    if (!window.confirm(`Delete storefront content "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/content/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify(`Deleted content "${item.title}"`);
        fetchContent();
      } else {
        onNotify(data.error || 'Failed to delete content');
      }
    } catch {
      onNotify('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Subsystem Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalogue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pricing'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Retail Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stockroom</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promotions')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'promotions'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promotions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'content'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Content</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-stone-900 shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Movement Logs</span>
          </button>
        </div>

        {activeTab === 'products' && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Specialty Roast</span>
          </button>
        )}

        {activeTab === 'promotions' && (
          <button
            type="button"
            onClick={handleOpenCreatePromo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Promo Code</span>
          </button>
        )}

        {activeTab === 'categories' && (
          <button
            type="button"
            onClick={handleOpenCreateCategory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        )}

        {activeTab === 'content' && (
          <button
            type="button"
            onClick={handleOpenCreateContent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Content Item</span>
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
                {categories.map((c) => (
                  <option key={c.id || c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
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

          {/* Table */}
          <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Specialty Roast</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Retail Price</th>
                    <th className="py-3 px-4">Warehouse Stock</th>
                    <th className="py-3 px-4">Storefront Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {productsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                          <span>Loading roastery catalogue...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No coffee roasts matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLowStock = p.stockAvailable <= (p.lowStockThreshold || 10);
                      const isOutOfStock = p.stockAvailable <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-stone-700/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-10 h-10 object-cover rounded-xl bg-stone-900 border border-stone-700 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as any).src = '/images/product-espresso.jpg';
                                }}
                              />
                              <div>
                                <div className="font-bold text-stone-100 flex items-center gap-1.5">
                                  <span>{p.name}</span>
                                  {p.isArchived && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                                      ARCHIVED
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-stone-400 font-mono">
                                  slug: {p.slug || '—'} • {p.origin}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono capitalize">
                            <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-700 text-stone-300">
                              {p.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-stone-100 font-mono">
                              {formatCurrency(p.price, true)}
                            </div>
                            {p.originalPrice && (
                              <div className="text-[10px] text-stone-500 line-through font-mono">
                                {formatCurrency(p.originalPrice, true)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-bold ${
                                  isOutOfStock
                                    ? 'text-rose-400'
                                    : isLowStock
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {p.stockAvailable} bags
                              </span>
                              {isOutOfStock ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Low Stock
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {p.isArchived ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-stone-500 border border-stone-800">
                                Archived
                              </span>
                            ) : p.isPublished ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <Eye className="w-3 h-3" />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <EyeOff className="w-3 h-3" />
                                Unpublished
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {!p.isArchived && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublication(p)}
                                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors"
                                  title={p.isPublished ? 'Unpublish from store' : 'Publish to store'}
                                >
                                  {p.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors"
                                title="Edit roast specification"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!p.isArchived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setArchivingProduct(p);
                                    setArchiveReason('');
                                  }}
                                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 transition-colors"
                                  title="Archive roast"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {productTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-stone-900/60 border-t border-stone-700 text-xs text-stone-400 font-mono">
                <div>
                  Page {productPage} of {productTotalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={productPage >= productTotalPages}
                    onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RETAIL PRICING VIEW (Feature A) */}
      {/* ============================================================== */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roasts to edit pricing..."
                value={pricingSearch}
                onChange={(e) => setPricingSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={fetchPricing}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh pricing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pricingLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Specialty Roast</th>
                    <th className="py-3 px-4">Regular Retail</th>
                    <th className="py-3 px-4">Configured Sale Price</th>
                    <th className="py-3 px-4">Promotion Schedule</th>
                    <th className="py-3 px-4">Effective Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {pricingLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                          <span>Loading pricing sheets...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pricingProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No roasts found.
                      </td>
                    </tr>
                  ) : (
                    pricingProducts.map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-stone-700/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-stone-100">
                            {p.name}
                            <div className="text-[11px] text-stone-400 font-mono font-normal">
                              Category: {p.category}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-stone-200">
                            {formatCurrency(p.price, true)}
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            {p.promotionPrice ? (
                              <span className="text-amber-400 font-bold">
                                {formatCurrency(p.promotionPrice, true)}
                              </span>
                            ) : (
                              <span className="text-stone-500">None</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[11px] text-stone-400">
                            {p.promotionStartDate || p.promotionEndDate ? (
                              <div className="font-mono">
                                <div>From: {p.promotionStartDate ? new Date(p.promotionStartDate).toLocaleDateString() : 'Immediate'}</div>
                                <div>To: {p.promotionEndDate ? new Date(p.promotionEndDate).toLocaleDateString() : 'Indefinite'}</div>
                              </div>
                            ) : (
                              <span className="text-stone-500">Not scheduled</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-400 text-sm">
                                {formatCurrency(p.effectivePrice, true)}
                              </span>
                              {p.isSaleActive ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase font-mono">
                                  ON SALE (-₹{p.saleDiscount})
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-stone-900 text-stone-400 border border-stone-700 font-mono">
                                  REGULAR
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenPricingModal(p)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Set Pricing</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. WAREHOUSE STOCKROOM VIEW */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Total Active SKUs</div>
              <div className="text-2xl font-bold font-serif text-stone-100">{inventorySummary.totalProducts}</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Total Inventory Bags</div>
              <div className="text-2xl font-bold font-serif text-amber-400">{inventorySummary.totalStockBags}</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Low Stock Warnings</div>
              <div className="text-2xl font-bold font-serif text-amber-400">{inventorySummary.lowStockCount}</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-1">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Out of Stock SKUs</div>
              <div className="text-2xl font-bold font-serif text-rose-400">{inventorySummary.outOfStockCount}</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search roastery warehouse stock..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-stone-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inventoryLowStockOnly}
                  onChange={(e) => setInventoryLowStockOnly(e.target.checked)}
                  className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Low stock alerts only</span>
              </label>
            </div>

            <button
              type="button"
              onClick={fetchInventory}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh stock levels"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${inventoryLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stockroom Table */}
          <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Roast / Batch</th>
                    <th className="py-3 px-4">Available Bags</th>
                    <th className="py-3 px-4">Alert Threshold</th>
                    <th className="py-3 px-4">Warehouse Status</th>
                    <th className="py-3 px-4 text-right">Stock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {inventoryLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                          <span>Auditing warehouse inventory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        No warehouse items match filter.
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-700/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-100">
                          {item.name}
                          <div className="text-[11px] text-stone-400 font-mono font-normal">
                            Category: {item.category} • {item.origin}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          {item.stockAvailable <= 0 ? (
                            <span className="text-rose-400">0 bags</span>
                          ) : item.stockAvailable <= (item.lowStockThreshold || 10) ? (
                            <span className="text-amber-400">{item.stockAvailable} bags</span>
                          ) : (
                            <span className="text-emerald-400">{item.stockAvailable} bags</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-stone-400">
                          {item.lowStockThreshold || 10} bags
                        </td>

                        <td className="py-3.5 px-4">
                          {item.stockAvailable <= 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                              DEPLETED
                            </span>
                          ) : item.stockAvailable <= (item.lowStockThreshold || 10) ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                              HEALTHY
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-xs transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PROMOTIONS & COUPONS VIEW (Feature B) */}
      {/* ============================================================== */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coupon code or description..."
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={fetchPromotions}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh promotions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${promotionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min. Subtotal</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {promotionsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                          <span>Loading promotions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : promotions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No promotional coupons found.
                      </td>
                    </tr>
                  ) : (
                    promotions.map((pr) => (
                      <tr key={pr.id} className="hover:bg-stone-700/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                          {pr.code}
                          <div className="text-[11px] text-stone-400 font-sans font-normal">
                            {pr.description}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-stone-200">
                          {pr.discountType === 'percentage' ? `${pr.discountValue}% OFF` : `₹${pr.discountValue} OFF`}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-stone-400">
                          {pr.minOrderAmount ? formatCurrency(pr.minOrderAmount, true) : '₹0 (None)'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-stone-300">
                          {pr.usageCount} {pr.usageLimit ? `/ ${pr.usageLimit}` : 'uses'}
                        </td>

                        <td className="py-3.5 px-4">
                          {pr.isCurrentlyValid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Active
                            </span>
                          ) : pr.isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Expired
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-stone-400 border border-stone-700">
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleTogglePromoStatus(pr)}
                            className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-700 text-stone-300 font-bold text-[11px] border border-stone-700 transition-colors mr-2"
                          >
                            {pr.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. CATEGORIES VIEW (Feature C) */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="text-xs text-stone-400">
              Manage database-backed taxonomy. Deleting a category is protected if active roasts reference it.
            </div>

            <button
              type="button"
              onClick={fetchCategories}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh categories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${categoriesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Unique Slug</th>
                    <th className="py-3 px-4">Active Roasts</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {categoriesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                          <span>Loading coffee categories...</span>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No categories defined.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-700/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          #{c.displayOrder}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-100">
                          {c.name}
                          {c.description && (
                            <div className="text-[11px] text-stone-400 font-normal">
                              {c.description}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-stone-300">
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-700">
                            {c.slug}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-stone-200">
                          {c.productCount ?? 0} roasts
                        </td>

                        <td className="py-3.5 px-4">
                          {c.isArchived ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Archived
                            </span>
                          ) : c.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-stone-400 border border-stone-700">
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(c);
                                setIsCreatingCategory(false);
                                setCategoryFormData({
                                  name: c.name,
                                  slug: c.slug,
                                  description: c.description || '',
                                  icon: c.icon || '☕',
                                  displayOrder: c.displayOrder || 0,
                                  isActive: c.isActive,
                                });
                                setFormError(null);
                              }}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!c.isArchived && (
                              <button
                                type="button"
                                onClick={() => setArchivingCategory(c)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 transition-colors"
                                title="Archive Category"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. STOREFRONT CONTENT VIEW (Feature D) */}
      {/* ============================================================== */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="text-xs text-stone-400">
              Manage dynamic homepage promo cards and the top announcement banner.
            </div>

            <button
              type="button"
              onClick={fetchContent}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700"
              title="Refresh content"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${contentLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">Identifier Key</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Title / Headline</th>
                    <th className="py-3 px-4">Link Target</th>
                    <th className="py-3 px-4">Publication</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {contentLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                          <span>Loading storefront content...</span>
                        </div>
                      </td>
                    </tr>
                  ) : contentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No storefront content configured.
                      </td>
                    </tr>
                  ) : (
                    contentItems.map((ci) => (
                      <tr key={ci.id} className="hover:bg-stone-700/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          {ci.key}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-stone-300 uppercase text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-700">
                            {ci.contentType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-100 max-w-xs truncate">
                          {ci.title}
                          {ci.subtitle && (
                            <div className="text-[11px] text-stone-400 font-normal truncate">
                              {ci.subtitle}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-stone-400 text-[11px]">
                          {ci.linkUrl || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {ci.isPublished ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-stone-400 border border-stone-700">
                              Draft / Unpublished
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleContentPub(ci)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors"
                              title={ci.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {ci.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingContent(ci);
                                setIsCreatingContent(false);
                                setContentFormData({
                                  key: ci.key,
                                  contentType: ci.contentType,
                                  title: ci.title,
                                  subtitle: ci.subtitle || '',
                                  badge: ci.badge || '',
                                  description: ci.description || '',
                                  linkText: ci.linkText || '',
                                  linkUrl: ci.linkUrl || '',
                                  displayOrder: ci.displayOrder || 0,
                                  isActive: ci.isActive,
                                  isPublished: ci.isPublished,
                                });
                                setFormError(null);
                              }}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-stone-300 transition-colors"
                              title="Edit Content"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteContent(ci)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 transition-colors"
                              title="Delete Content"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MOVEMENT LOGS VIEW */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="bg-stone-800/80 rounded-2xl border border-stone-700 overflow-hidden shadow-xl">
          <div className="p-4 bg-stone-900/60 border-b border-stone-700 flex items-center justify-between">
            <div className="font-serif font-bold text-sm text-stone-200">
              Authoritative Warehouse Stockroom Ledger
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/80 text-stone-400 font-mono text-[11px] uppercase tracking-wider border-b border-stone-700">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Specialty Roast</th>
                  <th className="py-3 px-4">Stock Movement</th>
                  <th className="py-3 px-4">Mandatory Reason</th>
                  <th className="py-3 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700/60 font-sans">
                {logsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        <span>Loading ledger history...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      No stock movement history recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-700/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-400 whitespace-nowrap">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-bold text-stone-100">
                        {log.productName}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={log.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}
                        >
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange} bags
                        </span>
                        <div className="text-[10px] text-stone-500 font-normal">
                          {log.previousStock} &rarr; {log.newStock} bags
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-300 max-w-sm">
                        {log.reason}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-stone-400">
                        {log.actor?.name || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logsTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-stone-900/60 border-t border-stone-700 text-xs text-stone-400 font-mono">
              <div>
                Page {logsPage} of {logsTotalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={logsPage <= 1}
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={logsPage >= logsTotalPages}
                  onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}

      {/* 1. PRODUCT CREATE / EDIT MODAL */}
      {(isCreatingProduct || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {isCreatingProduct ? 'Create New Specialty Roast' : `Edit Roast: ${editingProduct.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingProduct(false);
                  setEditingProduct(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Roast Name *</label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    placeholder="e.g. Ethiopian Yirgacheffe"
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Unique Slug (Optional)</label>
                  <input
                    type="text"
                    value={productFormData.slug}
                    onChange={(e) => setProductFormData({ ...productFormData, slug: e.target.value })}
                    placeholder="auto-generated-if-blank"
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Category *</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Retail Price (INR) *</label>
                  <input
                    type="number"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                    min={0}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Origin Region / Estate *</label>
                  <input
                    type="text"
                    value={productFormData.origin}
                    onChange={(e) => setProductFormData({ ...productFormData, origin: e.target.value })}
                    placeholder="e.g. Yirgacheffe, Sidama"
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Initial Stock Available *</label>
                  <input
                    type="number"
                    value={productFormData.stockAvailable}
                    onChange={(e) => setProductFormData({ ...productFormData, stockAvailable: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Roast Description *</label>
                <textarea
                  rows={2}
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Detailed cupping profile and roastery notes..."
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold flex items-center justify-center gap-1.5"
                >
                  {submittingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isCreatingProduct ? 'Create Roast' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RETAIL PRICING EDIT MODAL (Feature A) */}
      {editingPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Manage Pricing: {editingPricing.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPricing(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Regular Retail Price (INR) *</label>
                <input
                  type="number"
                  value={pricingForm.price}
                  onChange={(e) => setPricingForm({ ...pricingForm, price: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-sm focus:ring-1 focus:ring-amber-500"
                  min={0}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Sale / Promotion Price (Optional INR)</label>
                <input
                  type="number"
                  value={pricingForm.promotionPrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, promotionPrice: Number(e.target.value) })}
                  placeholder="Set to 0 to remove sale price"
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-sm focus:ring-1 focus:ring-amber-500"
                  min={0}
                />
                <span className="text-[10px] text-stone-400">
                  Must be strictly lower than regular price (₹{pricingForm.price}).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Sale Start Date</label>
                  <input
                    type="date"
                    value={pricingForm.promotionStartDate}
                    onChange={(e) => setPricingForm({ ...pricingForm, promotionStartDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Sale End Date</label>
                  <input
                    type="date"
                    value={pricingForm.promotionEndDate}
                    onChange={(e) => setPricingForm({ ...pricingForm, promotionEndDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => setEditingPricing(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pricingSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold flex items-center justify-center gap-1.5"
                >
                  {pricingSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Pricing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. STOCK ADJUSTMENT MODAL (Phase 2) */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-500" />
                Adjust Stock: {adjustingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-stone-900/60 border border-stone-700 space-y-1">
                <div className="text-stone-400">Current Warehouse Stock:</div>
                <div className="font-mono text-lg font-bold text-stone-100">
                  {adjustingProduct.stockAvailable} bags
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">
                  Quantity Delta (Positive to add, Negative to deduct) *
                </label>
                <input
                  type="number"
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(Number(e.target.value))}
                  placeholder="e.g. +20 or -5"
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-sm focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">
                  Mandatory Operational Reason (&gt;= 3 chars) *
                </label>
                <textarea
                  rows={3}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Official explanation: e.g. Received new shipment lot #24..."
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjustment}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold flex items-center justify-center gap-1.5"
                >
                  {submittingAdjustment && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PROMOTIONS CREATE / EDIT MODAL (Feature B) */}
      {(isCreatingPromo || editingPromo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                {isCreatingPromo ? 'Create Promotional Coupon' : `Edit Coupon: ${editingPromo.code}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPromo(false);
                  setEditingPromo(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Coupon Code *</label>
                <input
                  type="text"
                  value={promoFormData.code}
                  onChange={(e) => setPromoFormData({ ...promoFormData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER20"
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-sm focus:ring-1 focus:ring-amber-500 uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Description *</label>
                <input
                  type="text"
                  value={promoFormData.description}
                  onChange={(e) => setPromoFormData({ ...promoFormData, description: e.target.value })}
                  placeholder="e.g. 20% off all cold brew drops"
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Discount Type *</label>
                  <select
                    value={promoFormData.discountType}
                    onChange={(e) => setPromoFormData({ ...promoFormData, discountType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Discount Value *</label>
                  <input
                    type="number"
                    value={promoFormData.discountValue}
                    onChange={(e) => setPromoFormData({ ...promoFormData, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Min Subtotal (₹)</label>
                  <input
                    type="number"
                    value={promoFormData.minOrderAmount}
                    onChange={(e) => setPromoFormData({ ...promoFormData, minOrderAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    min={0}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Usage Limit (0 = unltd)</label>
                  <input
                    type="number"
                    value={promoFormData.usageLimit}
                    onChange={(e) => setPromoFormData({ ...promoFormData, usageLimit: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPromo(false);
                    setEditingPromo(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPromo}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold flex items-center justify-center gap-1.5"
                >
                  {submittingPromo && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isCreatingPromo ? 'Create Code' : 'Save Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CATEGORIES CREATE / EDIT MODAL (Feature C) */}
      {(isCreatingCategory || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                {isCreatingCategory ? 'Create New Category' : `Edit Category: ${editingCategory.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false);
                  setEditingCategory(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Category Name *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Nitro Cold Brew"
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Unique Slug (Optional)</label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  placeholder="auto-generated from name if blank"
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Description</label>
                <textarea
                  rows={2}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Short description of this coffee category..."
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Display Sequence Order</label>
                <input
                  type="number"
                  value={categoryFormData.displayOrder}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, displayOrder: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                  min={0}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold flex items-center justify-center gap-1.5"
                >
                  {submittingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isCreatingCategory ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CATEGORY ARCHIVE CONFIRMATION MODAL */}
      {archivingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-serif font-bold text-base text-stone-100">
                Archive Category: {archivingCategory.name}
              </h3>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to archive this category? If any active coffee roasts are currently assigned to this category, deletion will be safely rejected by the server to prevent data corruption.
            </p>

            <div className="flex gap-2 pt-2 border-t border-stone-700">
              <button
                type="button"
                onClick={() => setArchivingCategory(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchiveCategory}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Archival
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. STOREFRONT CONTENT CREATE / EDIT MODAL (Feature D) */}
      {(isCreatingContent || editingContent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <Layout className="w-5 h-5 text-amber-500" />
                {isCreatingContent ? 'Create Storefront Content' : `Edit Content: ${editingContent.title}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingContent(false);
                  setEditingContent(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveContent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Unique Key *</label>
                  <input
                    type="text"
                    value={contentFormData.key}
                    onChange={(e) => setContentFormData({ ...contentFormData, key: e.target.value })}
                    placeholder="e.g. announcement_bar"
                    disabled={!isCreatingContent}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Content Type *</label>
                  <select
                    value={contentFormData.contentType}
                    onChange={(e) => setContentFormData({ ...contentFormData, contentType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="banner">Banner</option>
                    <option value="announcement">Announcement Bar</option>
                    <option value="promo_card">Promo Card</option>
                    <option value="featured_section">Featured Section</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Title / Main Headline *</label>
                <input
                  type="text"
                  value={contentFormData.title}
                  onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Subtitle / Eyebrow Text</label>
                <input
                  type="text"
                  value={contentFormData.subtitle}
                  onChange={(e) => setContentFormData({ ...contentFormData, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold block">Description</label>
                <textarea
                  rows={2}
                  value={contentFormData.description}
                  onChange={(e) => setContentFormData({ ...contentFormData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Action Button Text</label>
                  <input
                    type="text"
                    value={contentFormData.linkText}
                    onChange={(e) => setContentFormData({ ...contentFormData, linkText: e.target.value })}
                    placeholder="e.g. Shop Now"
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold block">Action Button Link</label>
                  <input
                    type="text"
                    value={contentFormData.linkUrl}
                    onChange={(e) => setContentFormData({ ...contentFormData, linkUrl: e.target.value })}
                    placeholder="e.g. /shop"
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingContent(false);
                    setEditingContent(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContent}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold flex items-center justify-center gap-1.5"
                >
                  {submittingContent && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isCreatingContent ? 'Create Item' : 'Save Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. PRODUCT ARCHIVE CONFIRMATION MODAL (Phase 2) */}
      {archivingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-serif font-bold text-base text-stone-100">
                Archive Specialty Roast: {archivingProduct.name}
              </h3>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Archiving hides this coffee roast from the customer storefront and cart while preserving historical orders, inventory logs, and accounting reports.
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-stone-300 font-semibold block">Archival Reason (Optional)</label>
              <textarea
                rows={2}
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Seasonal lot depleted, green bean harvest discontinued..."
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-700">
              <button
                type="button"
                onClick={() => setArchivingProduct(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Safe Archival
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
