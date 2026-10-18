# Product Requirements Document (PRD) — Firedup Specialty Coffee

**Project:** Firedup Specialty Coffee Full-Stack E-Commerce Platform  
**Version:** 2.4.0  
**Target Platform:** Web (Desktop, Tablet, Mobile)  
**Currency Standard:** Indian Rupee (INR / ₹)  
**Status:** Active Production-Ready Development  

---

## 1. Executive Summary & Vision

**Firedup Specialty Coffee** is a full-stack, enterprise-grade specialty coffee e-commerce platform designed for passionate home brewers, coffee connoisseurs, and commercial wholesale partners. The platform blends artisan roastery storytelling, interactive coffee discovery tools, and seamless cart/wishlist workflows with secure role-based access control (RBAC), multi-tiered customer experiences, and hybrid client-server persistence.

---

## 2. Technology Stack & Architecture

### 2.1 Architecture Overview
The system follows a client-server architecture with separation of concerns:
- **Frontend SPA:** React 19 single-page application built with Vite and TypeScript, styled with Tailwind CSS, utilizing React Router DOM v7 for declarative client-side routing.
- **Backend API:** Node.js Express REST API built with TypeScript and tsx, connecting to MongoDB Atlas with an automated local MongoDB fallback (`mongodb://127.0.0.1:27017/firedup_coffee`).
- **Communication:** Cookie-based authenticated JSON REST API over CORS with credentials.

### 2.2 Detailed Stack Specification

| Tier | Technology / Library | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev) | 19.2.x | Concurrent rendering, declarative component tree |
| **Frontend Tooling** | [Vite](https://vitejs.dev) | 8.3.x | Lightning-fast HMR and production asset bundling |
| **Frontend Routing** | [React Router](https://reactrouter.com) | 7.18.x | Client-side routing, protected routes, search params |
| **Type Safety** | [TypeScript](https://www.typescriptlang.org) | 5.7+ / 6.0+ | Strict typing across client and server |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com) | 3.4.x | Utility-first CSS with bespoke roastery palette |
| **Icons** | [Lucide React](https://lucide.dev) | 1.57.x | Accessible vector iconography |
| **Frontend Linter** | [Oxlint](https://oxc.rs) | 1.81.x | Ultra-fast AST-based JavaScript/TypeScript linter |
| **Backend Runtime** | [Node.js](https://nodejs.org) | 18.x+ / 22.x | Server environment with tsx TypeScript executor |
| **Backend Framework** | [Express](https://expressjs.com) | 4.21.x | REST API routing and middleware pipeline |
| **Database & ODM** | [MongoDB](https://www.mongodb.com) / [Mongoose](https://mongoosejs.com) | 8.9.x | Document database with schema validation |
| **Security & Auth** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) & [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 2.4.x / 9.0.x | 12-round password hashing and signed JWT cookies |

---

## 3. Currency & Localization Standard

### 3.1 Indian Rupee (INR) Requirement
- The entire application standardizes exclusively on **Indian Rupees (INR / ₹)**. No foreign currency symbols or assumptions are permitted anywhere in the UI or codebase.
- Currency formatting must use JavaScript's native `Intl.NumberFormat` with locale `en-IN` and currency `INR`:
  ```ts
  export const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  ```
- **Sensible Indian Market Pricing:**
  - Base 250g coffee bags: ₹449 – ₹799 (depending on micro-lot rarity and origin)
  - 500g bag scaling: ~1.85x base price
  - 1kg bag scaling: ~3.4x base price (bulk economy savings)
  - Free delivery threshold: Orders of ₹999 or higher; flat ₹99 shipping below threshold

---

## 4. User Roles & Experience Specifications

### 4.1 Guest (Unauthenticated Visitor)
- Unrestricted browsing of product catalogue, tasting notes, roast profiles, stories, and the coffee finder quiz.
- Protected action interception: Clicking "Add to Cart" or "Wishlist" opens the premium `AuthRequiredModal` rather than completing the action.
- Action preservation: Upon successful login or registration, the modal executes the preserved action and shows visual confirmation.

### 4.2 Customer (Retail Enthusiast)
- **Delivery Address Integrity:**
  - Database schema defaults country to `India`.
  - Profile dynamically loads the customer's persisted shipping address.
  - Confirmation banner is rendered if legacy data has non-Indian country for an Indian address (e.g. Andhra Pradesh), allowing explicit customer confirmation without silent overwrites.
  - Fully validated Edit Address form (Street $\ge 2$, City $\ge 2$, State $\ge 2$, Postal Code $\ge 3$, Phone $\ge 7$) persisting via `PUT /api/v1/auth/profile`.
- **Authoritative Cart & Wishlist:**
  - Active cart count and subtotal calculate directly from server-side database prices.
  - Strict data isolation across accounts (zero leakage).
- **Roaster Club Loyalty:**
  - Displays honest "Coming Soon" card explaining loyalty tier mechanics rather than fabricated beans or credit.
- **Order Tracking & Retail Checkout:**
  - Placed orders fetch via `GET /api/v1/orders` and `GET /api/v1/orders/:id`.
  - Order placement via `POST /api/v1/orders` validates stock, applies promo codes (`FIREDUP15`), decrements warehouse inventory, and clears the active cart.
  - Live dispatch card displays current order progress (`received` $\rightarrow$ `roasting` $\rightarrow$ `dispatched` $\rightarrow$ `delivered`).
- **Newsletter Subscription:**
  - Real consent-based endpoint `POST /api/v1/newsletter/subscribe` and `GET /api/v1/newsletter/status` with polite duplicate handling (`409 Conflict`).
- **Subscriptions:**
  - Honest disclosure that recurring card billing is under payment gateway integration; on-demand ordering is fully active.

### 4.3 Wholesale Partner (B2B Cafe & Restaurant)
- Separate dedicated B2B portal (`/dashboard/wholesale`).
- Applications submitted via `/register/wholesale` default to `pending` status.
- Restricted access: Pending or rejected partners cannot access commercial volume pricing or bulk checkout.
- Approved partners unlock 1kg bulk bag catalogue with wholesale discounts (30% to 40% off).
- Minimum Order Quantity (MOQ): Server-enforced 5kg minimum order volume.
- Automatic volume tiers:
  - Tier 1 (5–24kg): 30% wholesale discount
  - Tier 2 (25–49kg): 35% wholesale discount + free commercial freight
  - Tier 3 (50kg+): 40% wholesale discount + priority roasting queue
- Downloadable official GST-compliant Tax Invoices.
- 1-click reorder engine.

### 4.4 Administrator (Staff & Management)
- Secret token registration (`POST /api/v1/auth/register/admin`) with zero frontend token exposure.
- Administrative dashboard (`/dashboard/admin`):
  - Review pending wholesale applications with one-click approve or reject (with customized feedback reasons).
  - Inspect orders and update fulfillment stages.
  - Real-time catalogue stock monitoring.
  - Safe development test data cleanup script (`npm run server:clean-tests`) preventing database pollution while strictly protecting genuine production accounts.

---

## 5. Core Data Models

### 5.1 User Model (`User.ts`)
```typescript
interface IUser {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'customer' | 'wholesale' | 'admin';
  shippingAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string; // Defaults to 'India'
  };
  wholesaleDetails?: {
    businessName: string;
    businessType: 'cafe' | 'restaurant' | 'office' | 'retailer' | 'hotel' | 'other';
    taxId: string;
    monthlyVolumeKg: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    approvedAt?: Date;
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}
```

### 5.2 Product Model (`Product.ts`)
```typescript
interface IProduct {
  name: string;
  category: 'espresso' | 'pour_over' | 'cold_brew' | 'french_press' | 'aeropress';
  price: number; // Base retail price in INR for 250g
  rating: number;
  reviewsCount: number;
  image: string;
  tag: 'best_sellers' | 'single_origin' | 'special_reserve' | 'signature_blends';
  roastLevel: 'Light' | 'Medium' | 'Medium-Dark' | 'Dark';
  tastingNotes: string[];
  origin: string;
  description: string;
  stockAvailable: number;
}
```

### 5.3 Order Model (`Order.ts`)
```typescript
interface IOrder {
  orderNumber: string; // e.g., 'FD-20261018-1234' or 'WS-20261018-5678'
  userId: Types.ObjectId;
  orderType: 'retail' | 'wholesale';
  items: Array<{
    product: Types.ObjectId;
    productName: string;
    quantity: number;
    size: string;
    grind: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalKg: number;
  subtotal: number;
  discountTier?: string;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: {
    businessName?: string;
    contactName: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'net_terms' | 'bank_transfer' | 'credit_card' | 'cod';
  paymentStatus: 'pending' | 'terms_approved' | 'paid' | 'failed';
  orderStatus: 'received' | 'processing' | 'roasting' | 'dispatched' | 'delivered' | 'cancelled';
  notes?: string;
}
```

### 5.4 Cart Model (`Cart.ts`)
```typescript
interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  grind: string;
  size: string;
  frequency?: string;
}

interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
}
```

### 5.5 Wishlist Model (`Wishlist.ts`)
```typescript
interface IWishlist {
  userId: Types.ObjectId;
  products: Types.ObjectId[];
}
```

### 5.6 Newsletter Model (`Newsletter.ts`)
```typescript
interface INewsletter {
  email: string;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribedAt: Date;
}
```

### 5.7 Inventory Movement Log Model (`InventoryLog.ts`)
```typescript
interface IInventoryLog {
  product: Types.ObjectId;
  previousStock: number;
  newStock: number;
  quantityChange: number;
  reason: string; // Mandatory, min 3 characters
  referenceType: 'admin_adjustment' | 'order_fulfillment' | 'wholesale_order' | 'restock' | 'spoilage';
  referenceId?: string;
  actor?: Types.ObjectId;
  actorRole: 'admin' | 'system' | 'customer' | 'wholesale';
  createdAt: Date;
}
```

### 5.8 Administrative Audit Log Model (`AuditLog.ts`)
```typescript
interface IAuditLog {
  action: string;
  actorId?: Types.ObjectId;
  actorEmail?: string;
  actorRole: string;
  targetModel: string;
  targetId?: string;
  details?: Record<string, any>; // Sensitive fields automatically redacted
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

---

## 6. Security, Isolation & Integrity Standards

1. **Role-Based Access Control (RBAC):** Backend route middleware strictly enforces access permissions (`requireAuth`, `requireRole('admin')`, `requireApprovedWholesale`).
2. **Authoritative Server Pricing:** Cart totals, discounts, and order amounts are calculated server-side from database prices, ignoring arbitrary client values.
3. **Data Boundary Protection:** Users cannot view or modify carts, wishlists, addresses, or orders belonging to another user.
4. **Credential Confidentiality:** Passwords are never sent over API responses (`toJSON` excludes `passwordHash`). Admin secret invitation tokens are never rendered in frontend components.
5. **Mandatory Inventory Movement Justifications:** Every stock adjustment must record previous/new stock, quantity delta, and an operational reason ($\ge 3$ characters). Negative inventory adjustments and overselling are strictly rejected.
6. **Storefront Public Isolation:** Unpublished or archived roasts are automatically excluded from public storefront queries (`$ne: true`), cart addition, and checkout.
7. **Safe Data Cleanup:** `cleanupTestData()` safely clears test fixtures matching automated patterns while preserving genuine user records.

---

## 7. Verification & Quality Assurance Suite

The system maintains 100% passing automated test coverage across five distinct test suites (61/61 tests passing):

```bash
# 1. Frontend & Backend Linting
npm run lint
npm run server:lint

# 2. Production Build Verification
npm run build
npm run server:build

# 3. Backend Test Suites
npm run server:test             # 11/11 Security & Admin Provisioning
npm run server:test-isolation   # 14/14 Auth & RBAC Data Isolation
npm run server:test-wholesale   # 15/15 Wholesale B2B Portal
npm run server:test-customer    # 10/10 Customer Dashboard & Commerce
npm run server:test-maintenance # 11/11 Shop Maintenance (Product & Inventory)
```

---

## 8. Preserved Genuine Test & Seed Accounts

The following accounts are designated as genuine records in the local development database and are strictly protected during test data cleanup:

| Email | Role | Description |
| :--- | :--- | :--- |
| `vullerumahesh14@gmail.com` | Customer / Lead | Primary development account |
| `admin@firedupcoffee.com` | Administrator | Default roastery administrator |
| `customer@gmail.com` | Customer | Standard retail customer fixture |
| `wholesale@gmail.com` | Wholesale Partner | Approved commercial partner fixture |
| `sarah@example.com` | Customer | Regular customer fixture |
| `orders@artisanroasters.com` | Wholesale Partner | Commercial cafe account |
| `cafe@highlandbrew.com` | Wholesale Partner | Commercial cafe account |
