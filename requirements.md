# Product Requirements Document (PRD) — Firedup Specialty Coffee

**Project:** Firedup Specialty Coffee Full-Stack E-Commerce Platform  
**Version:** 2.1.0  
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
- The entire application standardizes exclusively on **Indian Rupees (INR / ₹)**. No US Dollar (`$`) signs or assumptions are permitted anywhere in the UI or codebase.
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
  - Subscription discount: 15% recurring discount on scheduled deliveries

---

## 4. Authentication, Authorization & Security Requirements

### 4.1 Multi-Tier Roles & Access Control
The application strictly enforces three distinct user roles:
1. `customer`: Home brewers and individual buyers. Can browse, manage profile, save delivery addresses, maintain wishlist, order, and subscribe.
2. `wholesale`: Commercial cafes and bulk business partners. Must submit business registration details (company name, GST/tax ID, monthly estimated volume) and remain in `pending` status until manually reviewed and approved by an administrator.
3. `admin`: Internal roastery operations and store administrators. Can manage the product catalog, audit users, and approve/reject wholesale applications.

### 4.2 Secure Admin Provisioning
- Staff administrators cannot be created through public customer registration.
- Admin registration (`/register/admin` or `POST /api/v1/auth/register/admin`) requires a valid `ADMIN_INVITATION_SECRET` token; invalid or missing tokens return `403 Forbidden`.
- A dedicated, idempotent provisioning script (`npm run server:provision-admin`) allows initial setup of the root administrator account without credentials being hardcoded into repository code.

### 4.3 Session & Credential Security
- Passwords must be hashed using `bcryptjs` with a minimum of 10 (standard 12) salt rounds.
- Authentication tokens are delivered via `HttpOnly`, `SameSite: Lax` secure cookies to prevent XSS credential theft, with secondary Bearer token support for mobile or headless clients.
- Serialized JSON responses from any auth or user endpoint must strictly exclude password hashes, salt rounds, and admin invitation secrets.

---

## 5. Functional Requirements

### 5.1 Storefront & Coffee Discovery
1. **Public Browsing:**
   - Unauthenticated visitors can freely browse all storefront sections, the complete coffee catalogue (`/shop`), individual roast details (`/product/:id`), seasonal deals (`/deals`), subscriptions (`/subscribe`), and roastery stories (`/our-story`).
2. **Interactive Coffee Finder Quiz:**
   - Multi-step modal assisting users in selecting coffee based on brewing equipment (French press, espresso, pour over, AeroPress, South Indian filter), roast preference, milk pairing, and tasting notes.
3. **Product Compare Engine:**
   - Side-by-side comparison matrix evaluating up to 3 roasts across roast level, acidity, body, processing method, and price.
4. **Quick View Lightbox:**
   - Modal inspection of product specifications without leaving the current catalog page.

### 5.2 Guest Authentication Interception & Action Resumption
1. **Action Interception:**
   - When an unauthenticated visitor clicks **"Add to Cart"** or **"Wishlist / Favorite"**, the system intercepts the operation without modifying state.
   - The intercepted action (type, product data, quantity, grind, size, subscription frequency, and return target URL) is safely recorded in React state and backed up in `sessionStorage`.
2. **Authentication Required Modal (`AuthRequiredModal.tsx`):**
   - Renders a luxury dialog matching Firedup's brand aesthetic: warm cream backdrop (`#FAF6F0`), dark espresso buttons (`#2B170E`), and amber highlights.
   - Displays a dynamic product preview card showing the roast thumbnail, name, selected grind, bag size, and formatted INR price.
   - Offers accessible "Sign In" and "Create Account" buttons with automatic return URL parameters (`?redirect=...`).
   - Supports keyboard `Escape` dismissal, click-outside backdrop dismiss, and restores focus to the trigger button upon closure.
3. **Single-Execution Action Resumption:**
   - Upon successful login or customer registration, the pending action executes **exactly once**.
   - `sessionStorage` is cleared immediately upon execution to prevent duplicate triggering on subsequent reloads.
   - A personalized toast message confirms execution (e.g., *"Welcome, {Name}! Added {qty}x "{Product}" ({size}, {grind}) to your cart."*).
4. **Authenticated Users:**
   - Authenticated users perform cart and wishlist operations immediately without encountering the auth dialog.

### 5.3 Customer Dashboard (`/dashboard/customer`)
1. **Account Overview:**
   - Personalized greeting using the authenticated user's real name.
   - Summary tiles indicating account tier, active orders count, and wishlist count.
2. **Delivery Address Management:**
   - Displays default delivery address cleanly with distinct, separate address lines (Street, Apartment/Suite, City, State, PIN code, Country) sourced from live profile data.
   - Prevents unformatted single-line concatenation.
3. **Order Oversight:**
   - Lists recent orders with real status badges (`Pending`, `Processing`, `Dispatched`, `Delivered`).
4. **Saved Wishlist:**
   - Grid of bookmarked roasts with rapid "Move to Cart" and "Remove" triggers.
5. **Subscription Controls:**
   - Summary of active recurring roast deliveries with frequency adjustment and pause/resume capabilities.

### 5.4 Cart Drawer & Checkout Flow (`CartDrawer.tsx`)
1. **Slide-Over Panel:**
   - Accessible slide-out cart overlay with backdrop dismiss and keyboard support.
2. **Quantity & Stock Enforcement:**
   - Increment/decrement quantity controls that strictly enforce available inventory (`stockAvailable`).
   - Warning toast notifications when attempting to exceed available warehouse stock.
3. **Progressive Free Shipping Tracker:**
   - Real-time progress bar calculating remaining amount needed to reach the ₹999 free shipping threshold.
4. **Financial Breakdown:**
   - Clear display of Subtotal, Applied Discounts, Shipping, and Total in INR (`₹`).
5. **Hybrid Synchronization:**
   - Guest items are stored in browser `localStorage`.
   - When authenticated, the cart synchronizes bidirectionally with the user's MongoDB `Cart` record via `/api/v1/cart`.

### 5.5 Wishlist Management (`WishlistDrawer.tsx`)
1. **Duplicate Prevention:**
   - Enforces unique entries per product ID.
2. **Cloud Sync:**
   - Synchronizes bookmarked items with the user's MongoDB `Wishlist` record via `/api/v1/wishlist`.

### 5.6 Wholesale B2B Portal (`/wholesale`, `/dashboard/wholesale`)
1. **Application Submission:**
   - Commercial cafes submit business name, commercial address, GSTIN/tax identification, contact person, and estimated monthly coffee volume (kg).
2. **Review Workflow:**
   - New applications default to `pending` status.
   - Wholesale dashboard displays a clear status notice while under roastery review.
   - Upon admin approval, the partner gains access to tier-based wholesale pricing and bulk order placement.

### 5.7 Roastery Administration Portal (`/dashboard/admin`)
1. **Wholesale Partner Review:**
   - Real-time list of pending applications with one-click "Approve" or "Reject" actions.
2. **Product Catalog Oversight:**
   - Inventory tracking, stock adjustment, and pricing updates.
3. **User Management:**
   - View registered users and verify assigned roles.

---

## 6. Data Schemas & Models

### 6.1 User Model (`User.ts`)
```typescript
interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'wholesale' | 'admin';
  phone?: string;
  shippingAddress?: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  wholesaleDetails?: {
    companyName: string;
    taxId?: string;
    estimatedMonthlyVolumeKg?: number;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: Date;
    rejectedReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 Product Model (`Product.ts` & `coffee.ts`)
```typescript
interface CoffeeProduct {
  id: string;
  _id?: string;
  name: string;
  subtitle?: string;
  category: 'espresso' | 'cappuccino' | 'latte' | 'moca' | 'americano' | 'cold_brew';
  price: number; // Base price in INR for 250g
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  isSale?: boolean;
  saleLabel?: string;
  tag: 'new_arrivals' | 'best_sellers' | 'top_rates';
  roastLevel: 'Light' | 'Medium' | 'Medium-Dark' | 'Dark';
  tastingNotes: string[];
  origin: string;
  altitude?: string;
  process?: string;
  description: string;
  stockAvailable: number;
}
```

### 6.3 Cart Model (`Cart.ts`)
```typescript
interface ICartItem {
  product: Types.ObjectId | CoffeeProduct;
  quantity: number;
  grind: 'Whole Bean' | 'French Press' | 'Pour Over' | 'Espresso' | 'Cold Brew';
  size: '250g' | '500g' | '1kg';
  frequency?: '2_weeks' | '3_weeks' | '4_weeks';
}

interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}
```

### 6.4 Wishlist Model (`Wishlist.ts`)
```typescript
interface IWishlist {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  updatedAt: Date;
}
```

### 6.5 Admin Token Model (`AdminToken.ts`)
```typescript
interface IAdminToken {
  tokenHash: string;
  createdBy: Types.ObjectId;
  isUsed: boolean;
  usedBy?: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}
```

---

## 7. Non-Functional Requirements

### 7.1 Performance & Responsiveness
- **Build Times:** Vite client production bundle completes in under 1 second (`~875ms`).
- **Responsive Breakpoints:** Fully fluid layouts across mobile (<640px), tablet (640px–1024px), and desktop (>1024px).
- **Zero Horizontal Overflow:** Strict layout bounds preventing horizontal scrolling on mobile viewports.
- **Graceful Image Fallbacks:** Automated fallback handling for remote product images to prevent broken UI tiles.

### 7.2 Accessibility & Usability (a11y)
- All modal dialogs implement ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`).
- Full keyboard support: Tab focus trap in active modals, `Escape` key closes overlays, focus restores to origin buttons.
- Color contrast meets WCAG 2.1 AA standards utilizing deep espresso shades (`#2B170E`, `#3A1E0E`) against warm neutral backgrounds (`#FAF6F0`, `#F5EBE1`).

### 7.3 Code Quality & Linter Compliance
- Strict TypeScript compilation (`tsc -b` on frontend, `tsc` on server) with zero type errors.
- Clean Oxlint linter results (`npm run lint` yields 0 warnings and 0 errors across all 82+ project files).
- Pure function compliance under React Compiler standards (avoiding unmemoized impure evaluations and avoiding synchronous setState calls in effects).

---

## 8. Build, Seed & Test Commands

| Command | Location | Description |
| :--- | :--- | :--- |
| `npm run dev` | Root | Starts frontend Vite dev server at `http://localhost:5173` |
| `npm run build` | Root | Compiles TypeScript and builds production frontend bundle |
| `npm run lint` | Root | Runs Oxlint check across the entire project |
| `npm run server:dev` | Root | Starts backend server with tsx hot reloading at `http://localhost:5000` |
| `npm run server:provision-admin` | Root | Provisions initial root administrator account securely |
| `npm run server:seed-products` | Root | Seeds MongoDB with specialty coffee catalogue in INR |
| `npm run server:test` | Root | Executes the 11-step backend security and RBAC test suite |
