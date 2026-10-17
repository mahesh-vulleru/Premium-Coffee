# Firedup Specialty Coffee — Full-Stack E-Commerce Platform

> **Artisan Specialty Coffee Roasters** — A full-stack, enterprise-grade specialty coffee e-commerce platform built with React 19, TypeScript, Vite, Tailwind CSS, Node.js/Express, and MongoDB.

[![Lint Status](https://img.shields.io/badge/Oxlint-Passing-success)](https://oxc.rs)
[![Build Status](https://img.shields.io/badge/Vite%20Build-Passing-success)](https://vitejs.dev)
[![Backend Tests](https://img.shields.io/badge/Security%20Tests-11%2F11%20Passed-success)](server/test-connection.ts)
[![Currency](https://img.shields.io/badge/Currency-INR%20(%E2%82%B9)-amber)](#indian-rupee-inr-pricing--currency-standard)

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Key Features](#key-features)
  - [1. Indian Rupee (INR) Pricing & Currency Standard](#1-indian-rupee-inr-pricing--currency-standard)
  - [2. Customer Shopping & Discovery Experience](#2-customer-shopping--discovery-experience)
  - [3. Guest Authentication Modal & Action Resumption](#3-guest-authentication-modal--action-resumption)
  - [4. Role-Aware Multi-Tier Authentication](#4-role-aware-multi-tier-authentication)
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

**Firedup Specialty Coffee** delivers a complete digital specialty roastery experience. Home enthusiasts can explore ethically sourced single-origin and micro-lot coffees, discover ideal flavor profiles with an interactive quiz, configure custom grind types and bag sizes, manage recurring subscriptions, and seamlessly order with real-time stock limits. Commercial cafe partners can apply for wholesale pricing tiers, and roastery administrators manage applications, inventory, and users from a secure administrative portal.

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
- **Authentication & Security:** 
  - JWT tokens stored in secure `HttpOnly` cookies + Bearer header support
  - 12-round `bcryptjs` password hashing
  - Role-based Access Control (RBAC) middleware (`customer`, `wholesale`, `admin`)
  - Staff invitation token verification for admin creation
  - Zero credential leakage on JSON serialization

---

## Key Features

### 1. Indian Rupee (INR) Pricing & Currency Standard
- **Currency Format:** All prices throughout the storefront, shop, subscriptions, cart, and dashboard are presented in Indian Rupees (`₹`) via a centralized utility:
  ```ts
  export const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  ```
- **Market Calibration:** Product prices, bag-size scaling (250g baseline, 500g, 1kg), free-shipping thresholds (free above ₹999), and subscription discounts (15% off) are realistically calibrated for the Indian specialty coffee market.

### 2. Customer Shopping & Discovery Experience
- **Interactive Storefront (`/`):** Hero section with quick actions, roast explorer, interactive Coffee Finder quiz, brand story, and customer reviews.
- **Full Catalog (`/shop`):** Category filtering (`Espresso`, `Cappuccino`, `Latte`, `Moca`, `Americano`, `Cold Brew`), tasting note badges, live search, sorting by price and rating, and stock visibility.
- **Product Details (`/product/:id`):** Deep dive into roast profiles, altitude, washing processes, tasting notes, grind selector (`Whole Bean`, `French Press`, `Pour Over`, `Espresso`, `Cold Brew`), and bag sizes.
- **Deals & Bundles (`/deals`):** Curated roaster bundles and promotional offers with automatic savings calculations.
- **Subscription Club (`/subscribe`):** Flexible recurring coffee deliveries (every 2, 3, or 4 weeks) with 15% VIP discount.

### 3. Guest Authentication Modal & Action Resumption
- **Frictionless Guest Browsing:** Guests can freely view every page, roast story, and product detail without logging in.
- **Action Interception:** Clicking **Add to Cart** or **Wishlist** as a guest halts the action and opens a luxury dialog modal (`AuthRequiredModal`).
- **Product Preview Card:** Displays the roast photo, title, selected size, grind, and formatted price inside the dialog.
- **Single-Execution Resumption:** The visitor's intended action and return URL are saved in session storage. Upon logging in or creating an account, the action runs **exactly once** and confirms via a personalized toast message without duplicating cart or wishlist items.
- **Accessibility & Focus:** Full ARIA dialog semantics (`role="dialog"`, `aria-modal="true"`), `Escape`-key dismissal, backdrop dismiss, and focus restoration to the trigger element.

### 4. Role-Aware Multi-Tier Authentication
- **Unified Login (`/login`):** Automatically routes users according to their verified role:
  - `customer` → Returns to intended product page or `/dashboard/customer`
  - `wholesale` → Directs to `/dashboard/wholesale` (with pending notice if under review)
  - `admin` → Directs to `/dashboard/admin`
- **Registration Hub (`/register`):** Three distinct onboarding paths:
  1. **Customer Registration (`/register/customer`):** Includes delivery address fields and redirects back to intercepted shopping tasks.
  2. **Wholesale Application (`/register/wholesale`):** Captures business name, GST/tax ID, monthly estimated volume, and commercial address. Accounts remain in `pending` status until approved by an administrator.
  3. **Staff Admin Registration (`/register/admin`):** Requires an authorized invitation secret token; unauthorized requests are rejected with `403 Forbidden`.

### 5. Customer Dashboard & Account Management (`/dashboard/customer`)
- **Account Overview:** Personalized greeting, customer loyalty status, and quick shortcuts.
- **Delivery Address Management:** Clean, multi-line formatted shipping address view with inline updates.
- **Order History:** Direct view of placed orders, line items, timestamps, and order statuses.
- **Wishlist Manager:** Quick access to saved favorites with single-click migration to active cart.
- **Subscription Management:** Pause, resume, or adjust roast frequencies directly from the dashboard.

### 6. Wholesale B2B Partner Portal (`/dashboard/wholesale`)
- Commercial coffee shop and restaurant dashboard displaying tier-based wholesale pricing, pallet volume orders, and application status indicators.

### 7. Administrator Portal & Security Controls (`/dashboard/admin`)
- **Wholesale Application Oversight:** Review incoming cafe applications with single-click approve or reject actions.
- **Catalog Management:** View stock levels and product catalog availability.
- **User Auditing:** Inspect registered accounts and verify RBAC assignments.

### 8. Hybrid Cart & Wishlist Synchronization
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
│   │   ├── controllers/            # Auth, Admin, Product, Cart, Wishlist controllers
│   │   ├── middleware/             # RBAC auth check, cookie parser, error handlers
│   │   ├── models/                 # Mongoose schemas: User, AdminToken, Product, Cart, Wishlist, Order
│   │   ├── routes/                 # REST endpoints: auth, admin, products, cart, wishlist, health
│   │   ├── scripts/                # One-time admin provisioning and product seed scripts
│   │   ├── app.ts                  # Express application setup with CORS & security headers
│   │   └── server.ts               # Server bootstrap & graceful shutdown handler
│   ├── .env.example                # Template for server environment variables
│   ├── package.json                # Server scripts & dependencies
│   ├── test-connection.ts          # 11-step backend security & RBAC verification test
│   └── tsconfig.json               # Backend TypeScript configuration
├── src/                            # Frontend React Application
│   ├── assets/                     # Static vectors & brand graphics
│   ├── components/                 # Reusable UI components
│   │   ├── AuthRequiredModal.tsx   # Premium guest auth interception modal
│   │   ├── BeanToBrewStory.tsx     # Direct-trade narrative section
│   │   ├── BestSellerSection.tsx   # Segmented roast showcase with grind selectors
│   │   ├── CartDrawer.tsx          # Slide-out cart with free-shipping indicator
│   │   ├── CategoryBar.tsx         # Roast category filter tabs
│   │   ├── CoffeeFinderModal.tsx   # Interactive roast discovery quiz
│   │   ├── CompareModal.tsx        # Side-by-side bean comparison matrix
│   │   ├── Footer.tsx              # Footer with links, policies, and newsletter
│   │   ├── Hero.tsx                # High-impact hero section
│   │   ├── Navbar.tsx              # Responsive navigation with cart/wishlist badges
│   │   ├── QuickViewModal.tsx      # Product quick-inspection modal
│   │   ├── SubscriptionBanner.tsx  # Coffee club subscription promotion
│   │   ├── Toast.tsx               # Animated feedback toasts
│   │   ├── WholesalePartner.tsx    # B2B partnership callout
│   │   └── WishlistDrawer.tsx      # Saved favorites drawer
│   ├── context/
│   │   ├── AuthContext.tsx         # Authentication state, login, register, session hydration
│   │   ├── CartContext.tsx         # Cart, wishlist, guest modal, and MongoDB synchronization
│   │   ├── useAuth.ts              # Auth hook & types
│   │   └── useCart.ts              # Cart hook & types
│   ├── data/
│   │   └── coffeeData.ts           # Canonical specialty coffee product catalog & metadata
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx      # Administration portal
│   │   ├── AdminRegisterPage.tsx       # Secret token admin registration
│   │   ├── CustomerDashboardPage.tsx   # Customer account & order hub
│   │   ├── CustomerRegisterPage.tsx    # Customer registration with delivery address
│   │   ├── DealsPage.tsx               # Curated promotional bundles
│   │   ├── ForgotPasswordPage.tsx      # Password recovery page
│   │   ├── LoginPage.tsx               # Unified login with return redirect
│   │   ├── OurStoryPage.tsx            # Ethical sourcing & roasting story
│   │   ├── ProductDetailPage.tsx       # In-depth product view
│   │   ├── RegisterSelectPage.tsx      # Account role selection hub
│   │   ├── ShopPage.tsx                # Catalog browsing with filters & sorting
│   │   ├── StorefrontPage.tsx          # Primary customer landing page
│   │   ├── SubscribePage.tsx           # Coffee subscription customizer
│   │   ├── WholesaleDashboardPage.tsx  # Wholesale partner dashboard
│   │   ├── WholesalePage.tsx           # B2B partnership details
│   │   └── WholesaleRegisterPage.tsx   # Commercial partner application
│   ├── types/
│   │   ├── auth.ts                 # User, Role, and address type definitions
│   │   └── coffee.ts               # Product, Cart, and Subscription interfaces
│   ├── utils/
│   │   ├── imageFallback.ts        # Image fallback handlers
│   │   └── pricing.ts              # INR formatting, bag size pricing, discount logic
│   ├── App.tsx                     # Main router & global modal provider layout
│   ├── index.css                   # Tailwind directives & luxury styling
│   └── main.tsx                    # React DOM root entry
├── package.json                    # Root scripts & frontend dependencies
├── tailwind.config.js              # Roastery color palette & typography
├── tsconfig.json                   # Root TypeScript configuration
└── vite.config.ts                  # Vite build & proxy settings
```

---

## Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **MongoDB:** A MongoDB Atlas URI or a running local MongoDB instance on `mongodb://127.0.0.1:27017`

### Environment Setup

1. Copy the server environment template:
   ```bash
   cp server/.env.example server/.env
   ```

2. Configure `server/.env` with your secrets:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/firedup_coffee
   DB_NAME=firedup_coffee
   CLIENT_ORIGIN=http://localhost:5173
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars_long
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=your_cookie_signing_secret_key
   ADMIN_INVITATION_SECRET=your_authorized_admin_token
   ADMIN_INITIAL_EMAIL=vullerumahesh14@gmail.com
   ADMIN_INITIAL_PASSWORD=your_secure_password
   ```

### Database Provisioning & Seeding

Run the provisioning and product seed scripts from the project root:

```bash
# 1. Provision initial secure administrator account
npm run server:provision-admin

# 2. Seed catalog with specialty coffee micro-lots
npm run server:seed-products
```

### Running the Applications

#### Option A: Run Backend & Frontend in Parallel
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

The project includes strict linting, zero-error type checks, and comprehensive backend security tests:

```bash
# 1. Run ultra-fast Oxlint check (Zero warnings, Zero errors)
npm run lint

# 2. Compile TypeScript and build production bundle
npm run build

# 3. Execute 11-step backend security & RBAC verification suite
npm run server:test
```

### Automated Security Suite Coverage (`server:test`)
- `[0/11]` Database connection established (Atlas with local fallback).
- `[1/11]` Administrator provisioning on clean database.
- `[2/11]` Safe idempotent provisioning without duplicate accounts.
- `[3/11]` Verification of bcrypt password hash with salt rounds.
- `[4/11]` Authentication success & 401 Unauthorized on invalid passwords.
- `[5/11]` Rejection of missing/invalid admin invitation tokens with 403 Forbidden.
- `[6/11]` Prevention of role elevation via public registration endpoints.
- `[7/11]` Role-based access to restricted `/api/v1/admin/*` endpoints.
- `[8/11]` Strict blocking of customers, wholesale users, and guests from admin routes.
- `[9/11]` Wholesale partner workflow: accounts remain pending until approved.
- `[10/11]` Current user session retrieval (`/auth/me`) and cookie clearance on logout.
- `[11/11]` Zero password or secret exposure in any API JSON response.

---

## API Documentation

All backend endpoints are prefixed with `/api/v1`:

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public | Authenticate user & issue signed HttpOnly cookie |
| `POST` | `/register/customer` | Public | Register standard customer account |
| `POST` | `/register/wholesale` | Public | Submit commercial wholesale application (pending review) |
| `POST` | `/register/admin` | Secret Token | Register staff administrator with invitation secret |
| `POST` | `/logout` | Authenticated | Invalidate session & clear cookies |
| `GET` | `/me` | Authenticated | Retrieve authenticated user profile |
| `PUT` | `/profile` | Authenticated | Update user name, phone, and delivery preferences |
| `POST` | `/address` | Authenticated | Save new shipping address |

### Cart Management (`/api/v1/cart`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Fetch authenticated user's persistent cart |
| `POST` | `/items` | Authenticated | Add item or increment quantity |
| `POST` | `/sync` | Authenticated | Synchronize guest localStorage cart to cloud database |
| `DELETE` | `/` | Authenticated | Clear all items from cart |

### Wishlist (`/api/v1/wishlist`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Fetch bookmarked coffee roasts |
| `POST` | `/:productId` | Authenticated | Toggle product in/out of wishlist |
| `POST` | `/sync` | Authenticated | Synchronize guest bookmarks to database |

### Administration (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/pending-wholesale` | Admin only | List commercial partner applications awaiting review |
| `POST` | `/approve-wholesale/:id`| Admin only | Approve wholesale account and unlock tiered pricing |
| `POST` | `/reject-wholesale/:id` | Admin only | Reject wholesale application with optional reason |
| `GET` | `/stats` | Admin only | Overview of users, orders, and sales statistics |

### Health Check (`/api/v1/health`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Server uptime and database connectivity check |

---

## License

This project is licensed under the [ISC License](LICENSE).
