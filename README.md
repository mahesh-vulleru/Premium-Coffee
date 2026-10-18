# Firedup Specialty Coffee — Full-Stack E-Commerce Platform

> **Artisan Specialty Coffee Roasters** — A full-stack, enterprise-grade specialty coffee e-commerce platform built with React 19, TypeScript, Vite, Tailwind CSS, Node.js/Express, and MongoDB.

[![Lint Status](https://img.shields.io/badge/Oxlint-Passing-success)](https://oxc.rs)
[![Build Status](https://img.shields.io/badge/Vite%20Build-Passing-success)](https://vitejs.dev)
[![Backend Tests](https://img.shields.io/badge/All%20Suites-71%2F71%20Passed-success)](#testing--quality-verification)
[![Currency](https://img.shields.io/badge/Currency-INR%20(%E2%82%B9)-amber)](#indian-rupee-inr-pricing--currency-standard)

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Key Features](#key-features)
  - [1. Indian Rupee (INR) Pricing & Currency Standard](#1-indian-rupee-inr-pricing--currency-standard)
  - [2. Customer Shopping & Discovery Experience](#2-customer-shopping--discovery-experience)
  - [3. Guest Authentication Modal & Action Resumption](#3-guest-authentication-modal--action-resumption)
  - [4. Role-Aware Multi-Tier Authentication & RBAC](#4-role-aware-multi-tier-authentication--rbac)
  - [5. Customer Dashboard & Account Management](#5-customer-dashboard--account-management)
  - [6. Wholesale B2B Partner Portal](#6-wholesale-b2b-partner-portal)
  - [7. Administrator Portal & Security Controls](#7-administrator-portal--security-controls)
  - [8. Hybrid Cart & Wishlist Synchronization](#8-hybrid-cart--wishlist-synchronization)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Database Provisioning & Seeding](#database-provisioning--seeding)
  - [Running the Applications](#running-the-applications)
- [Testing & Quality Verification](#testing--quality-verification)
- [API Documentation](#api-documentation)
- [License](#license)

---

## Overview

**Firedup Specialty Coffee** delivers a complete digital specialty roastery experience. Home enthusiasts can explore ethically sourced single-origin and micro-lot coffees, discover ideal flavor profiles with an interactive quiz, configure custom grind types and bag sizes, manage orders with real-time stock limits, and track deliveries in real time. Commercial cafe partners apply for wholesale pricing tiers and place bulk orders under commercial credit terms. Roastery administrators manage applications, review order statuses, inspect live catalogue stock, and oversee the business securely.

---

## Architecture & Tech Stack

### Frontend Client
- **Framework:** [React 19](https://react.dev) with Concurrent Features
- **Language:** [TypeScript](https://www.typescriptlang.org) (Strict mode)
- **Bundler & Tooling:** [Vite 8](https://vitejs.dev) with lightning-fast HMR
- **Routing:** [React Router DOM v7](https://reactrouter.com)
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com) + PostCSS
- **Icons:** [Lucide React](https://lucide.dev)
- **Linter:** [Oxlint](https://oxc.rs) (high-speed AST-based linter)
- **Currency Engine:** Native `Intl.NumberFormat` with `en-IN` Indian Rupee standards

### Backend Server (`server/`)
- **Runtime:** Node.js with [tsx](https://github.com/privatenumber/tsx) execution
- **Framework:** Express.js (REST API architecture)
- **Language:** TypeScript with strict type checking
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) with automated local MongoDB fallback (`mongodb://127.0.0.1:27017/firedup_coffee`)
- **ODM:** Mongoose 8
- **Authentication & Security:** 12-round bcrypt password hashing, signed HttpOnly JWT cookies, token revocation, and role-based access control middleware

---

## Key Features

### 1. Indian Rupee (INR) Pricing & Currency Standard
- Formatted natively using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- 250g retail base price: ₹449 – ₹799.
- 500g bag scaling: ~1.85x base price.
- 1kg bag scaling: ~3.4x base price (bulk economy savings).
- Free delivery threshold: Orders of ₹999 or higher; flat ₹99 delivery fee below threshold.

### 2. Customer Shopping & Discovery Experience
- **Interactive Coffee Quiz:** 3-step recommendation engine matching brew method and tasting notes to coffees.
- **Grind & Size Selector:** Whole bean, Espresso, French Press, Filter grind options across 250g, 500g, and 1kg bags.
- **Compare Modal:** Side-by-side comparison matrix for origin, roast level, acidity, and tasting notes.
- **Live Stock Indicator:** Real-time stock alerts and quantity clamping preventing overselling.

### 3. Guest Authentication Modal & Action Resumption
- Unauthenticated guests can freely browse the catalogue and view product details.
- Protected actions (Add to Cart, Toggle Wishlist) trigger a coffee-themed authentication modal.
- Remembers intended action and product ID; immediately executes upon login or account creation.

### 4. Role-Aware Multi-Tier Authentication & RBAC
- Role-based redirection upon login:
  - `customer` → Returns to intended product page or `/dashboard/customer`.
  - `wholesale` → Directs to dedicated `/dashboard/wholesale` (with pending notice if under review).
  - `admin` → Directs to `/dashboard/admin`.
- Three onboarding paths:
  1. **Customer Registration (`/register/customer`):** Includes delivery address fields and defaults country to India.
  2. **Wholesale Application (`/register/wholesale`):** Captures business name, GST/tax ID, monthly estimated volume, and commercial facility address. Accounts remain in `pending` status until approved by an administrator.
  3. **Staff Admin Registration (`/register/admin`):** Requires an authorized invitation secret token; unauthorized requests are rejected with `403 Forbidden`.

### 5. Customer Dashboard & Account Management (`/dashboard/customer`)
- **Delivery Address Integrity:**
  - Database schema and validation schemas strictly default country to `India`.
  - Saved profile addresses load dynamically from the authenticated customer record.
  - Interactive confirmation banner for Andhra Pradesh and Indian addresses when legacy records have outdated country defaults (no silent overwrite).
  - Fully validated Edit Address form (Street $\ge 2$, City $\ge 2$, State $\ge 2$, Postal Code $\ge 3$, Phone $\ge 7$) persisting changes through authenticated `PUT /api/v1/auth/profile`.
- **Authoritative Cart & Wishlist:**
  - Active cart count and subtotal calculate directly from authoritative server-side prices (`formatCurrency(cartTotal)`).
  - Complete cross-account data isolation with zero data leakage.
- **Roaster Club Loyalty & Rewards:**
  - Transparent "Coming Soon" card detailing loyalty tier rules rather than fabricated fake bean balances or phantom credits.
- **Real Order Tracking & History:**
  - Fetches customer orders via `GET /api/v1/orders` and `GET /api/v1/orders/:id` with strict customer ownership boundaries.
  - Retail customer checkout (`POST /api/v1/orders`) with inventory deduction, promo code support (`FIREDUP15` for 15% discount), and automatic active cart clearing.
  - "Live Roaster Dispatch" active order card and detailed inspection modal.
- **Roaster Club Newsletter:**
  - Consent-based enrollment via `POST /api/v1/newsletter/subscribe` and status check via `GET /api/v1/newsletter/status`.
  - Graceful duplicate handling (`409 Conflict`) with informative user feedback.
- **Subscription Billing Transparency:**
  - Honest status notice that automated recurring credit card subscriptions are undergoing banking gateway integration; on-demand orders active.

### 6. Wholesale B2B Partner Portal (`/dashboard/wholesale`)
- **Business Overview & Approval Lifecycle:** Clear pending, approved, or rejected states backed by backend permissions.
- **Commercial Catalogue:** Shows 1kg bulk bags with wholesale discounts (30%–40% off retail) only to approved partners.
- **Server-Enforced 5kg MOQ:** Server rejects wholesale orders under 5kg with `400 Bad Request`.
- **Volume Tier Engine:** Automatic discount tiering based on order volume:
  - Tier 1 (5–24kg): 30% wholesale discount
  - Tier 2 (25–49kg): 35% wholesale discount + FREE freight
  - Tier 3 (50kg+): 40% wholesale discount + priority roasting slot
- **GST-Compliant Tax Invoices:** Official printable invoices with legal GSTIN, HSN codes, and business addresses.
- **1-Click Reorder Engine:** Rapid re-ordering of previous bulk orders.

### 7. Administrator Portal & Security Controls (`/dashboard/admin`)
- **Removed Exposed Secrets:** All admin invitation tokens and credentials removed from frontend components; managed exclusively via server-side environment variables.
- **Wholesale Partner Review:** Review pending applications with single-click approval or rejection with customized feedback reasons.
- **Order Fulfillment Stages:** Monitor orders and advance fulfillment stages (`received` $\rightarrow$ `roasting` $\rightarrow$ `dispatched` $\rightarrow$ `delivered`).
- **Safe Development Test Cleanup Utility (`npm run server:clean-tests`):** Cleans test fixtures safely while strictly protecting genuine accounts (`vullerumahesh14@gmail.com`, `admin@firedupcoffee.com`, `customer@gmail.com`, `wholesale@gmail.com`, etc.). Blocked in production environments.

### 8. Shop Maintenance Subsystem (Admin Command Center)
- **Product Catalogue Management:** Create, preview, edit, publish/unpublish, and safely archive specialty roasts with unique slug enforcement and category classification.
- **Public Storefront Isolation:** Unpublished and archived items are automatically excluded from storefront queries and rejected from direct retail cart additions and checkout.
- **Warehouse Stockroom View:** Real-time stock visibility with low-stock threshold alerting and out-of-stock badges.
- **Mandatory Stock Adjustment Reasons:** Every inventory change records delta, before/after values, and a mandatory operational reason ($\ge 3$ characters).
- **Negative Stock & Oversell Protection:** Clamps decrements to prevent negative inventory balances.
- **Immutable Movement Audit Trail:** Historical log tracking every stock adjustment, retail purchase, and wholesale order with actor accountability.

### 9. Hybrid Cart & Wishlist Synchronization
- **Client Cache:** Guest state is immediately saved to `localStorage` for offline persistence and instant UI updates.
- **Cloud Backend Sync:** Upon login or registration, client items merge with the user's MongoDB `Cart` and `Wishlist` records via authenticated `/api/v1/cart` and `/api/v1/wishlist` endpoints.

---

## Project Directory Structure

```
coffee/
├── public/
│   └── images/                     # High-resolution coffee product photography
├── server/                         # Express + TypeScript + MongoDB API
│   ├── src/
│   │   ├── config/                 # DB connection and Zod-validated environment config
│   │   ├── controllers/            # Auth, Admin, Product, Cart, Wishlist, Wholesale, Order, Newsletter controllers
│   │   ├── middleware/             # RBAC auth check, cookie parser, error handlers, Zod validation
│   │   ├── models/                 # Mongoose schemas: User, AdminToken, Product, Cart, Wishlist, Order, Newsletter
│   │   ├── routes/                 # REST endpoints: auth, admin, products, cart, wishlist, wholesale, orders, newsletter
│   │   ├── scripts/                # Admin provisioning, catalogue seeding, and safe test cleanup scripts
│   │   ├── app.ts                  # Express application setup with CORS & security headers
│   │   └── server.ts               # Server bootstrap & graceful shutdown handler
│   ├── .env.example                # Template for server environment variables
│   ├── package.json                # Server scripts & dependencies
│   ├── test-connection.ts          # 11-step backend security & RBAC verification test
│   ├── test-auth-isolation.ts      # 14-step auth & cross-account data isolation test
│   ├── test-wholesale-portal.ts    # 15-step wholesale B2B functional test
│   ├── test-customer-dashboard.ts  # 10-step customer dashboard & commerce test
│   ├── test-shop-maintenance.ts    # 11-step shop maintenance (product & inventory) test
│   └── tsconfig.json               # Backend TypeScript configuration
├── src/                            # Frontend React Application
│   ├── assets/                     # Static vectors & brand graphics
│   ├── components/                 # Reusable UI components
│   │   ├── AuthRequiredModal.tsx   # Premium guest auth interception modal
│   │   ├── BeanToBrewStory.tsx     # Direct-trade narrative section
│   │   ├── BestSellerSection.tsx   # Segmented roast showcase with grind selectors
│   │   ├── CartDrawer.tsx          # Slide-out cart with retail checkout & promo code
│   │   ├── CategoryBar.tsx         # Roast category filter tabs
│   │   ├── CoffeeFinderModal.tsx   # Interactive roast discovery quiz
│   │   ├── CompareModal.tsx        # Side-by-side bean comparison matrix
│   │   ├── Footer.tsx              # Footer with links, policies, and real newsletter subscription
│   │   ├── Hero.tsx                # High-impact hero section
│   │   ├── Navbar.tsx              # Responsive navigation with role-aware account menu
│   │   ├── ProductCard.tsx         # Product card with cart/wishlist actions
│   │   ├── ProductGrid.tsx         # Responsive product grid
│   │   ├── ReviewsModal.tsx        # Customer reviews modal
│   │   └── ShopMaintenanceSection.tsx # Admin product catalogue & stockroom maintenance
│   ├── context/                    # AuthContext and CartContext
│   ├── pages/                      # CustomerDashboardPage, WholesaleDashboardPage, AdminDashboardPage, etc.
│   ├── utils/                      # Pricing, currency, and image fallback utilities
│   ├── App.tsx                     # Main application routing
│   └── main.tsx                    # React DOM entry point
├── package.json                    # Root package scripts
├── requirements.md                 # Product Requirements Document (PRD)
└── README.md                       # Platform documentation
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (v18.x or v20.x recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account OR a local MongoDB instance running at `mongodb://127.0.0.1:27017`

### Environment Setup

1. **Frontend (`.env` in project root):**
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

2. **Backend Server (`server/.env`):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/firedup_coffee?retryWrites=true&w=majority
   MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/firedup_coffee
   JWT_SECRET=super-secret-jwt-key-change-this-in-production-min-32-chars
   JWT_EXPIRES_IN=7d
   ADMIN_INVITATION_SECRET=secure-admin-invitation-token-never-expose-to-frontend
   ADMIN_EMAIL=admin@firedupcoffee.com
   ADMIN_PASSWORD=SuperSecureAdminPassword123!
   CLIENT_URL=http://localhost:5173
   ```

### Database Provisioning & Seeding

```bash
# Provision root administrator account (idempotent, safe to rerun)
npm run server:provision-admin

# Seed catalogue with specialty coffee products in INR
npm run server:seed-products
```

### Running the Applications

Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
npm run server:dev
# Server starts at http://localhost:5000
# Health check: http://localhost:5000/api/v1/health
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev
# Frontend starts at http://localhost:5173
```

---

## Testing & Quality Verification

The project includes strict linting, zero-error type checks, and 50 automated backend verification tests across 4 complete suites:

```bash
# 1. Run ultra-fast Oxlint check (Zero warnings, Zero errors)
npm run lint
npm run server:lint

# 2. Compile TypeScript and build production bundle
npm run build
npm run server:build

# 3. Security & Admin Provisioning Suite (11/11 Passed)
npm run server:test

# 4. Auth & RBAC Data Isolation Suite (14/14 Passed)
npm run server:test-isolation

# 5. Wholesale B2B Functional Suite (15/15 Passed)
npm run server:test-wholesale

# 6. Customer Dashboard & Commerce Suite (10/10 Passed)
npm run server:test-customer

# 7. Shop Maintenance: Product & Inventory Suite (11/11 Passed)
npm run server:test-maintenance

# 8. Shop Maintenance: Pricing, Promotions, Categories & Content (10/10 Passed)
npm run server:test-phase3

# 9. Safe Development Test Data Cleanup (preserves genuine accounts)
npm run server:clean-tests
```

### Summary of Automated Test Suites (71/71 Passed)

| Suite | Command | Tests | Coverage Highlights |
| :--- | :--- | :---: | :--- |
| **Security & RBAC** | `npm run server:test` | **11/11** | Admin provisioning, bcrypt salts, token rejection (403), credential protection, logout cookie clearance. |
| **Auth & Isolation** | `npm run server:test-isolation` | **14/14** | Open redirect prevention, cross-account cart & wishlist isolation, inventory stock clamping, admin approvals. |
| **Wholesale B2B** | `npm run server:test-wholesale` | **15/15** | Commercial catalogue, 5kg MOQ enforcement, volume tiers (30%–40%), tax invoices, reorder engine, admin rejection with reasons. |
| **Customer Commerce** | `npm run server:test-customer` | **10/10** | Default India country, address validation, authoritative pricing, cart isolation, retail checkout, stock deduction, promo code (`FIREDUP15`), order privacy boundary, newsletter lifecycle. |
| **Shop Maintenance (P2)** | `npm run server:test-maintenance` | **11/11** | Product CRUD & unique slugs, unpublished/archived storefront protection, warehouse stock KPIs, mandatory stock adjustment reasons ($\ge 3$ chars), negative stock rejection, inventory movement logs, audit logs. |
| **Shop Maintenance (P3)** | `npm run server:test-phase3` | **10/10** | Retail pricing validations, date windows, authoritative effective price calculations, order snapshot immutability, promotion engine & coupon validation, category CRUD & safe archival protection, dynamic storefront content & publication toggling, full audit logging. |

---

## API Documentation

All backend endpoints are prefixed with `/api/v1`:

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public | Authenticate user & issue signed HttpOnly cookie |
| `POST` | `/register/customer` | Public | Register standard customer account (India default) |
| `POST` | `/register/wholesale` | Public | Submit commercial wholesale application (pending review) |
| `POST` | `/register/admin` | Secret Token | Register staff administrator with invitation secret |
| `POST` | `/logout` | Authenticated | Invalidate session & clear cookies |
| `GET` | `/me` | Authenticated | Retrieve authenticated user profile |
| `PUT` | `/profile` | Authenticated | Update user name, phone, and delivery address |

### Cart Management (`/api/v1/cart`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Fetch authenticated user's persistent cart with server pricing |
| `POST` | `/` or `/items` | Authenticated | Add item or increment quantity (stock-clamped) |
| `PUT` | `/items/:itemId` | Authenticated | Update quantity or grind selection |
| `DELETE` | `/items/:itemId` | Authenticated | Remove specific item |
| `POST` | `/sync` | Authenticated | Synchronize guest localStorage cart to cloud database |
| `DELETE` | `/` | Authenticated | Clear all items from cart |

### Wishlist (`/api/v1/wishlist`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Fetch bookmarked coffee roasts |
| `POST` | `/:productId` | Authenticated | Toggle product in/out of wishlist |
| `DELETE` | `/:productId` | Authenticated | Remove product from wishlist |
| `POST` | `/sync` | Authenticated | Synchronize guest bookmarks to database |

### Customer Retail Orders (`/api/v1/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | List authenticated customer's order history |
| `GET` | `/:id` | Authenticated | Retrieve single order details with ownership boundary |
| `POST` | `/` | Authenticated | Place retail order with locked price snapshots & stock deduction |
| `POST` | `/validate-coupon` | Authenticated | Authoritatively validate promo coupon against cart subtotal |

### Category Taxonomy (`/api/v1/categories`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Retrieve active categories sorted by displayOrder |

### Storefront Content (`/api/v1/content`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/?type=...` | Public | Retrieve active, published storefront announcements, banners, and cards |

### Wholesale Portal (`/api/v1/wholesale`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/catalog` | Approved Wholesale | View 1kg bulk catalogue with wholesale pricing tiers |
| `GET` | `/dashboard` | Wholesale Partner | Partner statistics, order metrics, and business overview |
| `POST` | `/orders` | Approved Wholesale | Submit bulk order (enforces 5kg MOQ and volume tiers) |
| `GET` | `/orders/:id/invoice` | Approved Wholesale | Download GST-compliant tax invoice |
| `POST` | `/orders/:id/reorder` | Approved Wholesale | Populate cart from previous bulk order |

### Administration (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/metrics` | Admin only | Database KPIs: users, orders, inventory units, low-stock SKUs |
| `GET` | `/products` | Admin only | Full product catalogue with search, pagination, and status filters |
| `POST` | `/products` | Admin only | Create new specialty roast with auto-slug or custom unique slug |
| `PUT`/`PATCH` | `/products/:id` | Admin only | Update roast details, pricing, threshold, notes, or tags |
| `PATCH` | `/products/:id/publication` | Admin only | Toggle publication status (`isPublished`) |
| `DELETE` | `/products/:id` | Admin only | Safe archival (`isArchived: true, isPublished: false`) |
| `GET` | `/inventory` | Admin only | Real-time warehouse stockroom with low-stock badges & metrics |
| `POST` | `/inventory/adjust` | Admin only | Atomic stock adjustment with mandatory reason ($\ge 3$ chars) |
| `GET` | `/inventory/logs` | Admin only | Immutable inventory movement history with actor & reason trail |
| `GET` | `/pricing` | Admin only | Retail pricing overview with active sale status |
| `PUT`/`PATCH` | `/pricing/:id` | Admin only | Update retail price, sale price, and date windows with audit logging |
| `GET` | `/promotions` | Admin only | List all database coupon promotions and usage counters |
| `POST` | `/promotions` | Admin only | Create percentage/fixed discount coupon with usage & order limits |
| `PUT`/`PATCH` | `/promotions/:id` | Admin only | Update promotion properties |
| `PATCH` | `/promotions/:id/status` | Admin only | Toggle promotion active/inactive status |
| `DELETE` | `/promotions/:id` | Admin only | Archive promotion code |
| `GET` | `/categories` | Admin only | List all categories with active product reference counts |
| `POST` | `/categories` | Admin only | Create category with unique slug and display ordering |
| `PUT`/`PATCH` | `/categories/:id` | Admin only | Update category name, description, icon, or slug |
| `PATCH` | `/categories/:id/status` | Admin only | Toggle category active status |
| `DELETE` | `/categories/:id` | Admin only | Safe archival (strictly blocks if active products reference category) |
| `GET` | `/content` | Admin only | List all storefront content items |
| `POST` | `/content` | Admin only | Create announcement bar or promo card with sanitized URLs |
| `PUT`/`PATCH` | `/content/:id` | Admin only | Update storefront content item |
| `PATCH` | `/content/:id/publication` | Admin only | Toggle publication status |
| `DELETE` | `/content/:id` | Admin only | Delete storefront content item |
| `GET` | `/audit-logs` | Admin only | Comprehensive administrative audit trail |

### Health Check (`/api/v1/health`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Server uptime and database connectivity check |

---

## License

This project is licensed under the [ISC License](LICENSE).
