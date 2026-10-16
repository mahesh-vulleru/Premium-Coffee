import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  Flame,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  User,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError('Please provide both email address and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        // Role-aware redirect routing
        if (res.user.role === 'admin') {
          navigate('/dashboard/admin');
        } else if (res.user.role === 'wholesale') {
          if (res.user.wholesaleDetails?.status === 'pending') {
            setNotice(
              'Welcome back! Your wholesale application is currently under review by our roasting team.'
            );
            setTimeout(() => {
              navigate('/dashboard/wholesale');
            }, 1200);
          } else {
            navigate('/dashboard/wholesale');
          }
        } else {
          // Regular customer
          navigate('/dashboard/customer');
        }
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch {
      setError('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setNotice(null);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6F0] flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-terracotta-500/10 flex items-center justify-center text-terracotta-600 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-terracotta-500 text-terracotta-600" />
            </div>
            <div className="text-left">
              <span className="font-serif text-2xl font-extrabold tracking-tight text-[#3A1E0E] block leading-none">
                Firedup
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-terracotta-600">
                Specialty Coffee
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-[#2B170E] pt-2">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-[#8A5934]">
            Unified authentication portal for Retail Customers, Wholesale Partners & Staff
          </p>
        </div>

        {/* Demo Fast-Switch Pills */}
        <div className="p-4 rounded-3xl bg-[#F5ECE1]/70 border border-[#EBDCCE] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#532D16]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
              Demo Role Quick-Switch
            </span>
            <span className="text-[10px] text-[#8A5934] font-normal">Click to prefill</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => fillDemoAccount('sarah@example.com')}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-left border border-[#EBDCCE] transition-colors flex items-center gap-2 text-[#3A1E0E]"
            >
              <User className="w-3.5 h-3.5 text-terracotta-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold truncate">Customer</div>
                <div className="text-[9px] text-[#8A5934] truncate">sarah@example.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('orders@artisanroasters.com')}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-left border border-[#EBDCCE] transition-colors flex items-center gap-2 text-[#3A1E0E]"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold truncate">Wholesale (Active)</div>
                <div className="text-[9px] text-[#8A5934] truncate">35% Tier Unlocked</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('cafe@highlandbrew.com')}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-left border border-[#EBDCCE] transition-colors flex items-center gap-2 text-[#3A1E0E]"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold truncate">Wholesale (Pending)</div>
                <div className="text-[9px] text-[#8A5934] truncate">Awaiting Approval</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('admin@firedupcoffee.com')}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-left border border-stone-800 transition-colors flex items-center gap-2 text-white"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold truncate">Admin Staff</div>
                <div className="text-[9px] text-stone-300 truncate">Operations Access</div>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EBDCCE] space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {notice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Notice</p>
                <p className="mt-0.5">{notice}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="loginEmail"
                className="block text-xs font-bold text-[#532D16] uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="loginEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  autoComplete="email"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0]/40 focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 transition-all text-[#2B170E]"
                />
                <Mail className="w-4 h-4 text-[#AF8359] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="loginPassword"
                  className="block text-xs font-bold text-[#532D16] uppercase tracking-wider"
                >
                  Password
                </label>
                <span className="text-[10px] text-[#8A5934]">Default demo pwd: password123</span>
              </div>
              <div className="relative">
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0]/40 focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 transition-all text-[#2B170E] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-[#AF8359] hover:text-[#532D16] absolute right-3 top-2.5 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-terracotta-600 hover:text-terracotta-700 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Options Footer */}
          <div className="pt-4 border-t border-[#EBDCCE] text-center space-y-2 text-xs">
            <span className="text-[#8A5934]">Don't have an account yet?</span>
            <div>
              <Link
                to="/register"
                className="font-bold text-terracotta-600 hover:text-terracotta-700 hover:underline inline-flex items-center gap-1"
              >
                Choose an Account Registration Type <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Storefront Link */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-[#8A5934] hover:text-[#2B170E] inline-flex items-center gap-1 font-medium transition-colors"
          >
            ← Return to Firedup Specialty Coffee Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};
