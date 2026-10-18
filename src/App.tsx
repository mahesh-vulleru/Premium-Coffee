import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { AuthRequiredModal } from './components/AuthRequiredModal';
import { Toast } from './components/Toast';

// Pages
import { StorefrontPage } from './pages/StorefrontPage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DealsPage } from './pages/DealsPage';
import { SubscribePage } from './pages/SubscribePage';
import { OurStoryPage } from './pages/OurStoryPage';
import { WholesalePage } from './pages/WholesalePage';
import { WholesaleRegisterPage } from './pages/WholesaleRegisterPage';
import { RegisterSelectPage } from './pages/RegisterSelectPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import { AdminRegisterPage } from './pages/AdminRegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { WholesaleDashboardPage } from './pages/WholesaleDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';

// Scroll to top helper on route navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#231208] font-sans antialiased">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* 1. Public Landing Page */}
                <Route path="/" element={<StorefrontPage />} />

                {/* 2. Full Shop Catalogue & Filters */}
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />

                {/* 3. Offers & Deals */}
                <Route path="/deals" element={<DealsPage />} />

                {/* 4. Subscriptions Information & Customizer */}
                <Route path="/subscribe" element={<SubscribePage />} />

                {/* 5. Brand Story & Ethical Sourcing */}
                <Route path="/our-story" element={<OurStoryPage />} />

                {/* 6. Wholesale Partnership Info & Application */}
                <Route path="/wholesale" element={<WholesalePage />} />
                <Route path="/wholesale/register" element={<WholesaleRegisterPage />} />
                <Route path="/register/wholesale" element={<WholesaleRegisterPage />} />

                {/* 7. Authentication & Registration */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterSelectPage />} />
                <Route path="/register/customer" element={<CustomerRegisterPage />} />
                <Route path="/register/admin" element={<AdminRegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* 8. Role-Aware Dashboards */}
                <Route path="/dashboard/customer" element={<CustomerDashboardPage />} />
                <Route path="/dashboard/wholesale" element={<WholesaleDashboardPage />} />
                <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
                <Route path="/dashboard/staff" element={<StaffDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />

                {/* Fallback */}
                <Route path="*" element={<StorefrontPage />} />
              </Routes>
            </main>
            <Footer />

            {/* Global Overlays & Modals */}
            <CartDrawer />
            <WishlistDrawer />
            <QuickViewModal />
            <AuthRequiredModal />
            <Toast />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
