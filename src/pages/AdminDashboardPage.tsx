import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  KeyRound,
  LogOut,
  Store,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    allUsers,
    approveWholesaleUser,
    rejectWholesaleUser,
    activeInvitationTokens,
    logout,
  } = useAuth();

  const [notification, setNotification] = useState<string | null>(null);

  // Authorization check: Must be authenticated and have role === 'admin'
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen py-20 px-4 bg-[#FAF6F0] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              Access Restricted
            </h1>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              You must possess verified administrative credentials to access the Firedup Operations Command Center.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
            >
              Sign In with Staff Account
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const wholesaleUsers = allUsers.filter((u) => u.role === 'wholesale');
  const pendingWholesale = wholesaleUsers.filter(
    (u) => u.wholesaleDetails?.status === 'pending'
  );
  const approvedWholesale = wholesaleUsers.filter(
    (u) => u.wholesaleDetails?.status === 'approved'
  );
  const regularCustomers = allUsers.filter((u) => u.role === 'customer');

  const handleApprove = (userId: string, businessName?: string) => {
    approveWholesaleUser(userId);
    setNotification(
      `Wholesale application for "${businessName || 'Partner'}" has been approved. 35% commercial discount is now active.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReject = (userId: string, businessName?: string) => {
    rejectWholesaleUser(userId, 'Incomplete documentation or business verification failed.');
    setNotification(`Application for "${businessName || 'Partner'}" was declined.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Operational Nav */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  Operations & Wholesale Command
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Logged in as <strong className="text-stone-200">{currentUser.name}</strong> ({currentUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition-colors border border-stone-700"
            >
              <Store className="w-3.5 h-3.5" />
              Storefront View
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-xs font-semibold text-red-300 transition-colors border border-red-800/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Global Notification */}
        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-amber-400">
              {pendingWholesale.length}
            </div>
            <p className="text-[11px] text-stone-400">Awaiting wholesale qualification</p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Active Wholesale</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-emerald-400">
              {approvedWholesale.length}
            </div>
            <p className="text-[11px] text-stone-400">35% commercial discount unlocked</p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Retail Customers</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-stone-200">
              {regularCustomers.length}
            </div>
            <p className="text-[11px] text-stone-400">Standard retail accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Staff Tokens</span>
              <KeyRound className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-purple-400">
              {activeInvitationTokens.length}
            </div>
            <p className="text-[11px] text-stone-400">Cryptographically active</p>
          </div>
        </div>

        {/* Section 1: Pending Wholesale Applications Requiring Review */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Pending Wholesale Partner Approvals
              </h2>
              <p className="text-xs text-stone-400">
                Review commercial tax identifiers, projected monthly volume, and delivery locations before approving wholesale privileges.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
              {pendingWholesale.length} Pending Actions
            </span>
          </div>

          {pendingWholesale.length === 0 ? (
            <div className="p-8 rounded-2xl bg-stone-800/40 border border-stone-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">
                All wholesale applications have been reviewed!
              </p>
              <p className="text-xs text-stone-500">
                New B2B applications submitted via `/register/wholesale` will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingWholesale.map((user) => {
                const details = user.wholesaleDetails;
                return (
                  <div
                    key={user.id}
                    className="p-5 rounded-2xl bg-stone-800 border border-amber-500/40 shadow-lg space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 mb-1">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </div>
                        <h3 className="text-base font-bold text-white">
                          {details?.businessName || 'Business Partner'}
                        </h3>
                        <p className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>{details?.businessType}</span>
                          <span>•</span>
                          <span className="font-mono">Tax ID: {details?.taxId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-stone-900/60 p-3 rounded-xl border border-stone-700/60">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Primary Contact</span>
                        <span className="font-semibold text-stone-200">{user.name}</span>
                        <div className="text-stone-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Est. Monthly Volume</span>
                        <span className="font-semibold text-amber-300">
                          {details?.monthlyVolumeKg} kg / month
                        </span>
                        <div className="text-stone-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {details?.deliveryAddress ? `${details.deliveryAddress.city}, ${details.deliveryAddress.state}` : 'Address Pending'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApprove(user.id, details?.businessName)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Wholesale Account
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(user.id, details?.businessName)}
                        className="px-4 py-2 rounded-xl bg-stone-700 hover:bg-red-900/60 hover:text-red-200 text-stone-300 font-semibold text-xs transition-colors"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Active Wholesale Partners & Retail Users */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-400" />
              All User Accounts & Role Matrix
            </h2>
            <p className="text-xs text-stone-400">
              Live audit view of all provisioned accounts in the application store.
            </p>
          </div>

          <div className="bg-stone-800 rounded-2xl border border-stone-700/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-700">
                  <tr>
                    <th className="py-3 px-4">User / Contact</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Organization / Notes</th>
                    <th className="py-3 px-4">Status / Discount</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60 font-sans">
                  {allUsers.map((user) => {
                    return (
                      <tr key={user.id} className="hover:bg-stone-750/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-200">{user.name}</div>
                          <div className="text-[11px] text-stone-400">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : user.role === 'wholesale'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-stone-700 text-stone-300'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-300">
                          {user.wholesaleDetails?.businessName ? (
                            <div>
                              <span className="font-semibold">{user.wholesaleDetails.businessName}</span>
                              <span className="text-[11px] text-stone-400 block">
                                {user.wholesaleDetails.businessType}
                              </span>
                            </div>
                          ) : user.role === 'admin' ? (
                            <span className="text-stone-400 font-mono">Headquarters Admin</span>
                          ) : (
                            <span className="text-stone-400">Retail Direct Customer</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.role === 'wholesale' ? (
                            user.wholesaleDetails?.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approved (35% Tier)
                              </span>
                            ) : user.wholesaleDetails?.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                Pending Review
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                                <XCircle className="w-3.5 h-3.5" />
                                Declined
                              </span>
                            )
                          ) : user.role === 'admin' ? (
                            <span className="text-purple-300 font-semibold">System Administrator</span>
                          ) : (
                            <span className="text-stone-400">Standard Pricing</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {user.createdAt.slice(0, 10)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Cryptographic Token Security Notice */}
        <section className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 space-y-3">
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-serif font-bold text-stone-200">
                Staff Invitation Token Security Policy
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Active pre-authorized token for testing: <code className="px-2 py-0.5 rounded bg-stone-900 text-amber-300 font-mono text-xs">{activeInvitationTokens[0] || 'Managed via Server Secret / DB Tokens'}</code>. In production environments, tokens are single-use cryptographically signed JWTs with strict 24-hour expiration stored in an encrypted Redis key-value store.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
