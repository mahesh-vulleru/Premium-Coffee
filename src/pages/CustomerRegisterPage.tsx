import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, MapPin, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';

export const CustomerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();
  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const result = await registerCustomer({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      shippingAddress: {
        street: formData.street,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      },
    });

    setIsSubmitting(false);

    if (result.success) {
      showToast(`Welcome, ${result.user?.name}! Your customer account is active.`);
      navigate('/dashboard/customer');
    } else {
      setErrorMessage(result.error || 'Failed to complete registration.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <Link to="/register" className="font-bold text-terracotta-600 hover:text-terracotta-700">
            ← Back to Selection
          </Link>
          <span className="text-[#8A5934]">Customer Registration</span>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDCCE] shadow-soft space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#3A1E0E]">
                Customer Account Registration
              </h1>
              <p className="text-xs text-[#6E4022]">
                Personal profile and default delivery address for seamless ordering.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Personal Information */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1">
                1. Personal Details
              </h2>

              <div>
                <label htmlFor="name" className="text-xs font-bold text-[#532D16] block mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                  <User className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email" className="text-xs font-bold text-[#532D16] block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="sarah@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                    />
                    <Mail className="w-4 h-4 text-[#AF8359] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="text-xs font-bold text-[#532D16] block mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 019-2834"
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

            {/* 2. Shipping Details */}
            <div className="space-y-3 pt-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#8A5934] border-b border-[#FAF6F0] pb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
                <span>2. Default Shipping Address</span>
              </h2>

              <div>
                <label htmlFor="street" className="text-xs font-bold text-[#532D16] block mb-1">
                  Street Address *
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="742 Evergreen Terrace"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="apartment" className="text-xs font-bold text-[#532D16] block mb-1">
                    Apt / Suite / Unit (Optional)
                  </label>
                  <input
                    id="apartment"
                    name="apartment"
                    type="text"
                    value={formData.apartment}
                    onChange={handleChange}
                    placeholder="Apt 4B"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>

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
                    placeholder="Portland"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    placeholder="OR"
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
                    placeholder="97201"
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="text-xs font-bold text-[#532D16] block mb-1">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBDCCE] text-xs text-[#2B170E] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Customer Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Customer Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Alternate links */}
          <div className="text-center pt-2 text-xs text-[#6E4022]">
            Looking for wholesale supply?{' '}
            <Link to="/register/wholesale" className="font-bold text-terracotta-600 hover:text-terracotta-700 underline">
              Apply for Wholesale Partner Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
