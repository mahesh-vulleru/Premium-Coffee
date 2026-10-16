import React, { useState, useEffect, useCallback } from 'react';
import type {
  User,
  CustomerRegistrationPayload,
  WholesaleRegistrationPayload,
  AdminRegistrationPayload,
} from '../types/auth';
import { AuthContext } from './useAuth';

const API_BASE = '/api/v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeInvitationTokens, setActiveInvitationTokens] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch all users (admin-only)
  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setAllUsers(data.users);
        }
      }
    } catch (err) {
      console.warn('[Auth] Unable to fetch user registry:', err);
    }
  }, []);

  // Fetch admin tokens (admin-only)
  const fetchAdminTokens = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/tokens`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tokens)) {
          setActiveInvitationTokens(data.tokens.map((t: { token: string }) => t.token));
        }
      }
    } catch (err) {
      console.warn('[Auth] Unable to fetch admin tokens:', err);
    }
  }, []);

  // Check current session on mount via /auth/me
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            setCurrentUser(data.user);
            if (data.user.role === 'admin') {
              fetchAllUsers();
              fetchAdminTokens();
            }
          }
        } else if (isMounted) {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('[Auth] Backend session check failed:', err);
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [fetchAllUsers, fetchAdminTokens]);


  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed. Please verify your credentials.',
        };
      }

      setCurrentUser(data.user);
      if (data.user.role === 'admin') {
        fetchAllUsers();
        fetchAdminTokens();
      }

      return { success: true, user: data.user };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return {
        success: false,
        error: 'Unable to connect to the authentication server. Please ensure the backend is running.',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[Auth] Logout API call failed:', err);
    } finally {
      setCurrentUser(null);
      setAllUsers([]);
      setActiveInvitationTokens([]);
    }
  };

  const registerCustomer = async (
    payload: CustomerRegistrationPayload
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Customer registration failed. Please review your entries.',
        };
      }

      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('[Auth] Customer registration error:', err);
      return {
        success: false,
        error: 'Unable to connect to the registration server. Please try again.',
      };
    }
  };

  const registerWholesale = async (
    payload: WholesaleRegistrationPayload
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register/wholesale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Wholesale application failed. Please check required fields.',
        };
      }

      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('[Auth] Wholesale registration error:', err);
      return {
        success: false,
        error: 'Unable to submit wholesale application. Please try again.',
      };
    }
  };

  const registerAdmin = async (
    payload: AdminRegistrationPayload
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error:
            data.error ||
            'Administrative provisioning rejected. Invalid token or unauthorized request.',
        };
      }

      setCurrentUser(data.user);
      fetchAllUsers();
      fetchAdminTokens();

      return { success: true, user: data.user };
    } catch (err) {
      console.error('[Auth] Admin registration error:', err);
      return {
        success: false,
        error: 'Unable to connect to security provision server. Please try again.',
      };
    }
  };

  const approveWholesaleUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/wholesale/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setAllUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
          );
          if (currentUser?.id === userId) {
            setCurrentUser(data.user);
          }
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to approve wholesale user:', err);
    }
  };

  const rejectWholesaleUser = async (
    userId: string,
    reason = 'Documentation incomplete or volume under minimum.'
  ) => {
    try {
      const res = await fetch(`${API_BASE}/admin/wholesale/${userId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setAllUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
          );
          if (currentUser?.id === userId) {
            setCurrentUser(data.user);
          }
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to reject wholesale user:', err);
    }
  };

  // If initializing session, still render children so hydration & UI mount cleanly
  if (isInitializing) {
    return (
      <AuthContext.Provider
        value={{
          currentUser,
          allUsers,
          login,
          logout,
          registerCustomer,
          registerWholesale,
          registerAdmin,
          approveWholesaleUser,
          rejectWholesaleUser,
          activeInvitationTokens,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        logout,
        registerCustomer,
        registerWholesale,
        registerAdmin,
        approveWholesaleUser,
        rejectWholesaleUser,
        activeInvitationTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
