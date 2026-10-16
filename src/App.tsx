import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryBar } from './components/CategoryBar';
import { DealsGrid } from './components/DealsGrid';
import { BestSellerSection } from './components/BestSellerSection';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { BeanToBrewStory } from './components/BeanToBrewStory';
import { WholesalePartner } from './components/WholesalePartner';
import { CraftedWithPurpose } from './components/CraftedWithPurpose';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { Toast } from './components/Toast';

export function App() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#231208] font-sans antialiased">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <CategoryBar />
          <DealsGrid />
          <BestSellerSection />
          <SubscriptionBanner />
          <BeanToBrewStory />
          <WholesalePartner />
          <CraftedWithPurpose />
        </main>
        <Footer />

        {/* Global Overlays & Modals */}
        <CartDrawer />
        <WishlistDrawer />
        <QuickViewModal />
        <Toast />
      </div>
    </CartProvider>
  );
}

export default App;
