# Product Requirements Document (PRD) — Firedup Coffee

**Project:** Firedup Coffee E-Commerce Web Application  
**Version:** 1.0.0  
**Target Platform:** Web (Desktop, Tablet, Mobile)  
**Status:** Active Development  

---

## 1. Executive Summary & Vision

**Firedup Coffee** is a modern, responsive specialty coffee e-commerce web application designed for passionate coffee lovers, casual drinkers, and wholesale partners. The platform blends storytelling, educational coffee discovery tools, and seamless cart/wishlist workflows to provide an artisan boutique shopping experience.

---

## 2. Technology Stack & Environment

| Component | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev) | Declarative UI library with latest concurrent rendering |
| **Language** | [TypeScript](https://www.typescriptlang.org) | Strict type definitions and safe data handling |
| **Bundler & Dev Server** | [Vite 8](https://vitejs.dev) | Fast build tool with Hot Module Replacement (HMR) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com) + PostCSS | Utility-first CSS with custom brand theme and typography |
| **Icons** | [Lucide React](https://lucide.dev) | Modern icon set for UI indicators |
| **Linter** | [Oxlint](https://oxc.rs) | High-performance JavaScript/TypeScript linter |
| **Persistence** | Browser `localStorage` | Client-side cache for cart and wishlist state |
| **Fonts** | Playfair Display & Plus Jakarta Sans | Google Fonts for editorial elegance and readability |

---

## 3. Data Models & Schemas

### 3.1 Coffee Product (`CoffeeProduct`)
```typescript
interface CoffeeProduct {
  id: string;
  name: string;
  subtitle?: string;
  category: 'cappuccino' | 'espresso' | 'moca' | 'latte' | 'americano' | 'cold_brew';
  price: number;
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
  description: string;
  stockAvailable: number;
}
```

### 3.2 Cart Item (`CartItem`)
```typescript
interface CartItem {
  product: CoffeeProduct;
  quantity: number;
  grind: 'Whole Bean' | 'French Press' | 'Pour Over' | 'Espresso' | 'Cold Brew';
  size: '250g' | '500g' | '1kg';
}
```

---

## 4. Functional Requirements

### 4.1 Header & Navigation (`Navbar.tsx`)
- **Brand Identity:** Prominent Firedup branding with logo link to top.
- **Navigation Links:** Smooth-scroll anchors to key sections: *Shop*, *Deals*, *Story*, *Wholesale*, *About*.
- **Live Search & Filter:** Search bar/modal to query coffees dynamically by roast level, category, and tasting notes.
- **Interactive Badges:**
  - Cart toggle button with dynamic badge showing total quantity of items.
  - Wishlist toggle button with dynamic badge showing count of bookmarked products.
- **Mobile Responsive Drawer:** Collapsible hamburger menu supporting all links on mobile and tablet breakpoints.
- **Announcement Bar:** Top notification banner highlighting free shipping promotions and discount codes.

### 4.2 Hero Section (`Hero.tsx`)
- **Headline & Value Proposition:** High-impact visual banner showcasing specialty single-origin and signature blends.
- **Call-to-Action (CTA):**
  - Primary CTA: "Explore Our Roasts" (scrolls down to product catalog).
  - Secondary CTA: "Take Coffee Quiz" (triggers interactive Coffee Finder modal).
- **Social Proof Highlights:** Customer ratings, fast dispatch badges, and ethically sourced credentials.

### 4.3 Category Navigation (`CategoryBar.tsx`)
- **Pill Filters:** Filters catalog by categories:
  - `All`
  - `Espresso`
  - `Cappuccino`
  - `Latte`
  - `Moca`
  - `Americano`
  - `Cold Brew`
- **Visual Feedback:** Active highlight state on the selected category with instantaneous catalog synchronization.

### 4.4 Promotional Deals (`DealsGrid.tsx`)
- **Special Offers:** Display curated bundles, BOGO deals, and limited-time discounts.
- **Badge Indicators:** Visual callouts such as `"Save 25%"`, `"Limited Edition"`, and discount comparisons against original pricing.

### 4.5 Product Catalog & Best Sellers (`BestSellerSection.tsx`)
- **Segmented Tabs:** Filter items by product tags:
  - *Best Sellers*
  - *New Arrivals*
  - *Top Rated*
- **Product Card Features:**
  - High-resolution product imagery and hover zoom effects.
  - Stock availability and roast-level pill indicator.
  - Interactive Star rating and review count.
  - Origin tags and tasting note tags (e.g., Chocolate, Citrus, Hazelnut).
  - Grind selector (`Whole Bean`, `French Press`, `Pour Over`, `Espresso`, `Cold Brew`).
  - Size selector (`250g`, `500g`, `1kg`).
  - Quick action buttons: *Add to Cart*, *Toggle Wishlist*, *Quick View*, and *Compare*.

### 4.6 Product Discovery & Decision Support
- **Interactive Coffee Finder Quiz (`CoffeeFinderModal.tsx`):**
  - Multi-step questionnaire based on brewing style, roast preference, milk preference, and tasting preferences.
  - Direct recommendation with single-click "Add to Cart" or "View Coffee".
- **Product Compare Modal (`CompareModal.tsx`):**
  - Side-by-side comparison table analyzing roast level, acidity, body, origin, pricing, and notes for up to 3 selections.
- **Quick View Modal (`QuickViewModal.tsx`):**
  - Detailed product card modal enabling inspection of bean notes, origin description, and order configuration without navigating away.

### 4.7 Cart Drawer & Checkout Experience (`CartDrawer.tsx`)
- **Slide-over Panel:** Non-blocking overlay with accessible backdrop dismiss.
- **Item Modification:**
  - Quantity increment/decrement buttons with validation against available stock.
  - Delete item action.
  - Display selected grind type and size packaging per item.
- **Progressive Free Shipping Bar:** Dynamic calculation indicating amount remaining to qualify for free shipping.
- **Financial Breakdown:** Subtotal calculation, discount deduction, and total calculation.
- **Checkout Action:** Seamless call-to-action button directing to checkout flow.

### 4.8 Wishlist Management (`WishlistDrawer.tsx`)
- **Slide-out Drawer:** Quick access to saved favorites.
- **Cart Migration:** "Move to Cart" button to transfer items directly into the active cart.
- **Removal Action:** Instant bookmark removal with confirmation.

### 4.9 Coffee Subscription Club (`SubscriptionBanner.tsx`)
- **Recurring Deliveries:** Promotional banner highlighting custom delivery frequencies (Weekly, Bi-weekly, Monthly).
- **Subscription Incentives:** 15% discount, complimentary sample bags, and VIP member benefits.

### 4.10 Brand Story & Sourcing (`BeanToBrewStory.tsx` & `CraftedWithPurpose.tsx`)
- **Direct Trade Narrative:** Highlights fair farm wages, organic cultivation, and single-estate partners.
- **Roasting Process:** Explains the precision small-batch roasting methodology.
- **Sustainability:** Zero-waste packaging, eco-friendly carbon-neutral shipping commitments.

### 4.11 Wholesale & B2B Inquiry (`WholesalePartner.tsx`)
- **Business Solutions:** Information for coffee shops, restaurants, corporate offices, and hospitality.
- **Inquiry Form:** Contact submission modal/form for customized wholesale quotes, equipment leasing, and bulk pricing.

### 4.12 Feedback & Notifications (`Toast.tsx`)
- Non-intrusive toast messages providing immediate user feedback on:
  - Product added to cart (including quantity and title).
  - Wishlist item addition or removal.
  - Error or validation warnings.

### 4.13 Footer (`Footer.tsx`)
- Newsletter subscription signup input.
- Navigation links, FAQ, Shipping & Returns policy, Terms of Service.
- Social media profiles, contact information, and copyright statements.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Responsiveness
- **Fast First Paint:** Vite-optimized assets and CSS minification.
- **Adaptive Layout:** 100% responsive across mobile (<640px), tablet (640px–1024px), and desktop (>1024px) viewports.
- **Optimized Assets:** Responsive image assets served locally via `/public/images/`.

### 5.2 State Management & Persistence
- Cart and Wishlist states must synchronize to browser `localStorage` on change (`firedup_cart`, `firedup_wishlist`).
- State must gracefully recover from corrupted or empty `localStorage` payloads without application crashes.

### 5.3 Accessibility (a11y) & Usability
- Semantic HTML tags (`<main>`, `<header>`, `<footer>`, `<nav>`, `<article>`, `<button>`).
- Keyboard dismissable modals (`Escape` key support and click-outside handling).
- Visual contrast adhering to WCAG 2.1 AA standards using warm neutral and deep espresso shades.

### 5.4 Code Quality & Maintainability
- Type safety enforced through strict TypeScript compilation (`tsc -b`).
- Code linting via Oxlint (`npm run lint`).
- Modular component structure with atomic division of concerns.

---

## 6. Project Directory Structure

```
coffee/
├── public/
│   └── images/               # High-res coffee product & lifestyle imagery
├── src/
│   ├── assets/               # Brand vectors and static graphics
│   ├── components/           # UI Components
│   │   ├── BeanToBrewStory.tsx
│   │   ├── BestSellerSection.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CategoryBar.tsx
│   │   ├── CoffeeFinderModal.tsx
│   │   ├── CompareModal.tsx
│   │   ├── CraftedWithPurpose.tsx
│   │   ├── DealsGrid.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Navbar.tsx
│   │   ├── QuickViewModal.tsx
│   │   ├── SubscriptionBanner.tsx
│   │   ├── Toast.tsx
│   │   ├── WholesalePartner.tsx
│   │   └── WishlistDrawer.tsx
│   ├── context/
│   │   └── CartContext.tsx   # Global cart, wishlist, and modal state
│   ├── data/
│   │   └── coffeeData.ts     # Mock product catalog and metadata
│   ├── types/
│   │   └── coffee.ts         # TypeScript interfaces and shared types
│   ├── App.css
│   ├── App.tsx               # Root application layout
│   ├── index.css             # Tailwind base & custom utility classes
│   └── main.tsx              # React DOM entry point
├── download-images.cjs       # Node.js script to download Unsplash assets
├── index.html                # HTML entry point with Google Fonts
├── package.json              # Dependencies and build scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Custom Tailwind color palette and font rules
├── tsconfig.json             # TypeScript project references
└── vite.config.ts            # Vite bundler configuration
```

---

## 7. Build & Execution Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local development server with Vite HMR |
| `npm run build` | Compiles TypeScript (`tsc -b`) and bundles for production (`vite build`) |
| `npm run preview` | Serves the production build locally for verification |
| `npm run lint` | Runs Oxlint across source files to verify syntax and best practices |
| `node download-images.cjs` | Fetches and populates remote images into `/public/images` |

