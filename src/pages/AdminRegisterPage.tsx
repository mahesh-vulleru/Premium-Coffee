import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  KeyRound,
  Mail,
  Lock,
  UserCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
interface AdminFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  invitationToken: string;
  department: string;
}

export const AdminRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerAdmin, activeInvitationTokens } = useAuth();

  const [formData, setFormData] = useState<AdminFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationToken: '',
    department: 'Operations',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = 'Full legal name is required';
    if (!formData.email.trim()) {
      errs.email = 'Official work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Security policy requires at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.invitationToken.trim()) {
      errs.invitationToken = 'Admin invitation token is strictly required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await registerAdmin({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        invitationToken: formData.invitationToken,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/admin');
        }, 2200);
      } else {
        setGeneralError(res.error || 'Registration failed');
      }
    } catch {
      setGeneralError('A network or server error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoToken = () => {
    if (activeInvitationTokens.length > 0) {
      setFormData((prev) => ({
        ...prev,
        invitationToken: activeInvitationTokens[0],
      }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.invitationToken;
        return copy;
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Admin Provisioned
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Invitation token successfully redeemed. Cryptographic session established. Redirecting to admin command center...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Launching Firedup Admin Operations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6F0]">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
          <Link
            to="/register"
            className="hover:text-stone-900 inline-flex items-center gap-1 transition-colors"
          >
            ← Back to Role Selection
          </Link>
          <span>Firedup Staff Provisioning Portal</span>
        </div>

        {/* Security Alert Header */}
        <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-stone-800 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                Restricted System Access
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                Staff & Admin Provisioning
              </h1>
              <p className="text-stone-400 text-xs sm:text-sm mt-1 leading-relaxed">
                Public self-registration for administrative credentials is strictly prohibited. You must provide a valid cryptographic invitation token issued by the security administrator.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
            <div className="flex items-center gap-1.5 text-amber-300/90 font-mono">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Token Verification: Mandatory</span>
            </div>
            <button
              type="button"
              onClick={handleUseDemoToken}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Fill Demo Staff Token (FIREDUP-ADMIN-SECURE-2026)
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
          {generalError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied / Verification Error</p>
                <p className="mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Invitation Token Field */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="invitationToken"
                  className="block text-xs font-bold text-stone-900 uppercase tracking-wider"
                >
                  Authorized Invitation Token *
                </label>
                <span className="text-[10px] text-stone-500">Issued by Chief Security Officer</span>
              </div>
              <div className="relative">
                <input
                  id="invitationToken"
                  type="text"
                  value={formData.invitationToken}
                  onChange={(e) =>
                    setFormData({ ...formData, invitationToken: e.target.value })
                  }
                  placeholder="e.g. FIREDUP-ADMIN-SECURE-2026"
                  className={`w-full font-mono text-sm px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.invitationToken
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                  }`}
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.invitationToken && (
                <p className="text-xs text-red-600 font-medium">{errors.invitationToken}</p>
              )}
            </div>

            {/* Admin Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
              >
                Legal Full Name *
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Christopher Vance"
                  className={`w-full text-sm px-4 py-2.5 rounded-xl border bg-stone-50/50 focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-stone-200 focus:ring-stone-900/20 focus:border-stone-900'
                  }`}
                />
                <UserCheck className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 font-medium mt-1">{errors.name}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
              >
                Department / Responsibility *
              </label>
              <div className="relative">
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
                >
                  <option value="Operations">Operations & Inventory Management</option>
                  <option value="Wholesale Review">B2B & Wholesale Verification</option>
                  <option value="Roasting & QC">Roastery & Quality Control</option>
                  <option value="Finance & Executive">Finance & Executive</option>
                </select>
                <Building className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Official Work Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
              >
                Official Corporate Email *
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@firedupcoffee.com"
                  className={`w-full text-sm px-4 py-2.5 rounded-xl border bg-stone-50/50 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-stone-200 focus:ring-stone-900/20 focus:border-stone-900'
                  }`}
                />
                <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 font-medium mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Min. 8 characters"
                    className={`w-full text-sm px-4 py-2.5 rounded-xl border bg-stone-50/50 focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? 'border-red-400 focus:ring-red-400/20'
                        : 'border-stone-200 focus:ring-stone-900/20 focus:border-stone-900'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Repeat password"
                    className={`w-full text-sm px-4 py-2.5 rounded-xl border bg-stone-50/50 focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword
                        ? 'border-red-400 focus:ring-red-400/20'
                        : 'border-stone-200 focus:ring-stone-900/20 focus:border-stone-900'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Policy Consent Note */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                Administrative Security & Audit Policy
              </div>
              <p>
                All account creations, order approvals, and wholesale validations are cryptographically signed and logged with timestamp and IP address.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating Cryptographic Token...</span>
                </>
              ) : (
                <>
                  <span>Redeem Token & Provision Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Already have an admin login?</span>
            <Link
              to="/login"
              className="font-bold text-stone-900 hover:underline inline-flex items-center gap-1"
            >
              Staff Sign In <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Brand footer indicator */}
        <div className="flex items-center justify-center gap-2 text-stone-400 text-xs">
          <Flame className="w-4 h-4 text-terracotta-500" />
          <span>Firedup Roastery Operations System • Internal & Confidential</span>
        </div>
      </div>
    </div>
  );
};
