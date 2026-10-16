import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Flame, CheckCircle2, AlertCircle, KeyRound, Info } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = email.trim();
    if (!clean) {
      setError('Please provide your account email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Please enter a valid email format');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 700);
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
            Reset Your Password
          </h1>
          <p className="text-xs text-[#8A5934]">
            Enter your account email and we will send you a secure password reset link.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EBDCCE] space-y-5">
          {isSent ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#3A1E0E]">
                  Reset Instructions Dispatched
                </h3>
                <p className="text-xs text-[#6E4022]">
                  If an account exists for <strong className="text-[#3A1E0E]">{email}</strong>, a one-time cryptographic reset token has been dispatched.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 text-left flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>
                  *Demonstration preview: In production, password reset links expire in 15 minutes and require verified SMTP token signature verification.
                </span>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-3 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-soft"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="resetEmail"
                  className="block text-xs font-bold text-[#532D16] uppercase tracking-wider mb-1.5"
                >
                  Account Email Address
                </label>
                <div className="relative">
                  <input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    autoComplete="email"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#EBDCCE] bg-[#FAF6F0]/40 focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 transition-all text-[#2B170E]"
                  />
                  <Mail className="w-4 h-4 text-[#AF8359] absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#2B170E] hover:bg-[#3A1E0E] text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Dispatching Token...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-[#8A5934] hover:text-[#2B170E] inline-flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
