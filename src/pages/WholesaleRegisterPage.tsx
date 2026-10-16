import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, Lock, MapPin, ArrowRight, Loader2, AlertCircle, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';

export const WholesaleRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerWholesale } = useAuth();
  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'cafe' as const,
    taxId: '',
    monthlyVolumeKg: '50-100',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplicationSuccess, setIsApplicationSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await registerWholesale({
      contactName: formData.contactName,
      businessName: formData.businessName,
      businessType: formData.businessType,
      taxId: formData.taxId,
      monthlyVolumeKg: formData.monthlyVolumeKg,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      deliveryAddress: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      },
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsApplicationSuccess(true);
      showToast('Wholesale application registered! Pending roastery review.', 'info');
    } else {
      setErrorMessage(result.error || 'Failed to submit wholesale application.');
    }
  };

  if (isApplicationSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-[#EBDCCE] shadow-elevated space-y-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold uppercase tracking-wider">
              Application Under Review
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#3A1E0E]">
              Wholesale Application Submitted
            </h1>
            <p className="text-xs text-[#6E4022] leading-relaxed">
              Thank you, <strong>{formData.contactName}</strong>. Your commercial wholesale account for{' '}
              <strong>{formData.businessName}</strong> has been registered with status{' '}
              <span className="font-bold text-amber-700">pending verification</span>.
            </p>
          </div>

          {/* Policy Explanation Banner */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EBDCCE] text-left text-xs space-y-2 text-[#532D16]">
            <div className="flex items-center gap-2 font-bold text-[#2B170E]">
              <ShieldCheck className="w-4 h-4 text-terracotta-600" />
              <span>Admin Verification Policy</span>
            </div>
            <p className="text-[11px] text-[#6E4022] leading-relaxed">
              To protect artisan farm pricing and guarantee specialty single-origin volume, our roastery team manually verifies commercial credentials (Tax ID: <code className="font-mono text-terracotta-700">{formData.taxId}</code>).
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Expected review turnaround: 24 to 48 business hours.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all"
            >
              Explore Storefront
            </button>
            <Link
              to="/login"
              className="flex-1 py-3 rounded-full border border-[#D5BC9F] text-[#6E4022] hover:bg-[#FAF6F0] font-bold text-xs transition-colors flex items-center justify-center"
            >
              Check Login Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <Link to="/register" className="font-bold text-terracotta-600 hover:text-terracotta-700">
            ← Back to Selection
          </Link>
          <span className="text-[#8A5934]">Commercial Wholesale Partner</span>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#3A1E0E]">
                Wholesale Partner Application
              </h1>
              <p className="text-xs text-[#6E4022]">
                Commercial cafe, restaurant, and office specialty supply with tiered pricing.
              </p>
            </div>
          </div>

          {/* Approval Notice Callout */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Manual Roastery Approval Required</span>
            </div>
            <p className="text-[11px] text-[#6E4022] leading-relaxed">
              Wholesale accounts are set to <em>pending approval</em> upon submission. Wholesale pricing (35% off) is unlocked after business verification.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Business Credentials */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                1. Commercial Credentials
              </h2>

              <div>
                <label htmlFor="businessName" className="text-xs font-bold text-[#532D16] block mb-1">
                  Business / Cafe Name *
                </label>
                <div className="relative">
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Blue Ridge Artisan Coffee Bar"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                  <Building2 className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="businessType" className="text-xs font-bold text-[#532D16] block mb-1">
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  >
                    <option value="cafe">Specialty Cafe</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="office">Corporate / Office</option>
                    <option value="retailer">Specialty Retailer</option>
                    <option value="hotel">Boutique Hotel</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="taxId" className="text-xs font-bold text-[#532D16] block mb-1">
                    Tax ID / EIN *
                  </label>
                  <input
                    id="taxId"
                    name="taxId"
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={handleChange}
                    placeholder="XX-1234567"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>

                <div>
                  <label htmlFor="monthlyVolumeKg" className="text-xs font-bold text-[#532D16] block mb-1">
                    Est. Monthly Vol. *
                  </label>
                  <select
                    id="monthlyVolumeKg"
                    name="monthlyVolumeKg"
                    value={formData.monthlyVolumeKg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  >
                    <option value="20-50">20 - 50 kg / mo</option>
                    <option value="50-100">50 - 100 kg / mo</option>
                    <option value="100-250">100 - 250 kg / mo</option>
                    <option value="250+">250+ kg / mo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Contact & Credentials */}
            <div className="space-y-3 pt-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                2. Primary Contact & Authentication
              </h2>

              <div>
                <label htmlFor="contactName" className="text-xs font-bold text-[#532D16] block mb-1">
                  Primary Contact Full Name *
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Liam Vance (Head Barista / Manager)"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email" className="text-xs font-bold text-[#532D16] block mb-1">
                    Business Email Address *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="orders@cafename.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                    <Mail className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="text-xs font-bold text-[#532D16] block mb-1">
                    Business Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (206) 555-0143"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                    <Phone className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="text-xs font-bold text-[#532D16] block mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                    <Lock className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="text-xs font-bold text-[#532D16] block mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                    <Lock className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Delivery Location */}
            <div className="space-y-3 pt-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
                <span>3. Roastery Dispatch Delivery Location</span>
              </h2>

              <div>
                <label htmlFor="street" className="text-xs font-bold text-[#532D16] block mb-1">
                  Commercial Facility Street Address *
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="1204 Pike St (Loading Dock / Counter)"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="city" className="text-xs font-bold text-[#532D16] block mb-1">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Seattle"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="text-xs font-bold text-[#532D16] block mb-1">
                    State / Region *
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="WA"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="text-xs font-bold text-[#532D16] block mb-1">
                    Postal Code *
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="98101"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Wholesale Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Wholesale Application for Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
