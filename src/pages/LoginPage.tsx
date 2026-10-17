import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  Flame,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
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
          // Regular customer: redirect back to intended page if returnUrl provided
          const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard/customer';
          navigate(target);
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

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#2B170E] text-amber-500 flex items-center justify-center shadow-md">
              <Flame className="w-6 h-6" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#2B170E]">
              FIREDUP <span className="text-terracotta-600 font-sans text-xs uppercase tracking-widest font-black">Coffee</span>
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-[#3A1E0E]">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-[#6E4022]">
            Access your customer dashboard, wholesale orders, or admin command.
          </p>
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
