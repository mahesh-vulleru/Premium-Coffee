import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { CategoryBar } from '../components/CategoryBar';
import { HomePromoSection } from '../components/HomePromoSection';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { HomeSubscriptionCTA } from '../components/HomeSubscriptionCTA';
import { HomeBrandStory } from '../components/HomeBrandStory';
import { HomeWholesaleCTA } from '../components/HomeWholesaleCTA';
import { useAuth } from '../context/useAuth';
import { Building2, ShieldAlert, Clock, Sparkles } from 'lucide-react';

export const StorefrontPage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      {/* Role-Specific Status Banner */}
      {currentUser && (
        <div className="bg-[#2B170E] text-white border-b border-[#3A1E0E] px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            {currentUser.role === 'wholesale' &&
              currentUser.wholesaleDetails?.status === 'approved' && (
                <div className="flex items-center gap-2 text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong>Wholesale Partner Active:</strong> Welcome,{' '}
                    {currentUser.wholesaleDetails.businessName || currentUser.name}! 35% commercial volume pricing is unlocked.
                  </span>
                </div>
              )}

            {currentUser.role === 'wholesale' &&
              currentUser.wholesaleDetails?.status === 'pending' && (
                <div className="flex items-center gap-2 text-amber-200">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong>Wholesale Application In Review:</strong> Our master roaster is verifying your credentials for{' '}
                    {currentUser.wholesaleDetails.businessName || 'your business'}.
                  </span>
                </div>
              )}

            {currentUser.role === 'admin' && (
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Staff Admin Mode:</strong> You are logged in with administrative privileges.
                </span>
              </div>
            )}

            {currentUser.role === 'customer' && (
              <div className="flex items-center gap-2 text-[#D5BC9F]">
                <span>
                  Welcome back, <strong className="text-white">{currentUser.name}</strong>! You have access to member fresh-roast drops.
                </span>
              </div>
            )}

            {currentUser.role === 'admin' ? (
              <Link
                to="/dashboard/admin"
                className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold border border-amber-500/40 transition-colors"
              >
                Open Admin Dashboard →
              </Link>
            ) : currentUser.role === 'wholesale' ? (
              <Link
                to="/dashboard/wholesale"
                className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-mono"
              >
                <Building2 className="w-3.5 h-3.5" />
                Wholesale Dashboard →
              </Link>
            ) : (
              <Link
                to="/dashboard/customer"
                className="text-[11px] text-[#D5BC9F] hover:text-white underline"
              >
                My Account Dashboard →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Streamlined Landing Sections */}
      <Hero />
      <CategoryBar />
      <HomePromoSection />
      <FeaturedProducts />
      <HomeSubscriptionCTA />
      <HomeBrandStory />
      <HomeWholesaleCTA />
    </div>
  );
};
