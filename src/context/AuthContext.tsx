import React, { useState, useEffect } from 'react';
import type {
  User,
  CustomerRegistrationPayload,
  WholesaleRegistrationPayload,
  AdminRegistrationPayload,
} from '../types/auth';
import { AuthContext } from './useAuth';

const AUTH_USER_KEY = 'firedup_auth_current_user';
const ALL_USERS_KEY = 'firedup_auth_users';
const INVITES_KEY = 'firedup_auth_invites';

const INITIAL_INVITES = [
  'FIREDUP-ADMIN-SECURE-2026',
  'ROASTERY-HQ-INVITE-2026',
];

const INITIAL_USERS: User[] = [
  {
    id: 'user-cust-1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    phone: '+1 (503) 555-0192',
    role: 'customer',
    createdAt: '2026-01-15T10:00:00Z',
    shippingAddress: {
      street: '742 Evergreen Terrace',
      apartment: 'Apt 4B',
      city: 'Portland',
      state: 'OR',
      postalCode: '97201',
      country: 'United States',
    },
  },
  {
    id: 'user-wholes-pending',
    name: 'Liam Vance',
    email: 'orders@artisanroasters.com',
    phone: '+1 (206) 555-0143',
    role: 'wholesale',
    createdAt: '2026-03-01T14:30:00Z',
    wholesaleDetails: {
      businessName: 'Artisan Cafe & Bakery',
      taxId: 'WA-8472910',
      businessType: 'cafe',
      monthlyVolumeKg: '80-120',
      status: 'pending',
      submittedAt: '2026-03-01T14:30:00Z',
      deliveryAddress: {
        street: '1204 Pike St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'United States',
      },
    },
  },
  {
    id: 'user-wholes-approved',
    name: 'Marcus Bell',
    email: 'cafe@highlandbrew.com',
    phone: '+1 (303) 555-0188',
    role: 'wholesale',
    createdAt: '2026-02-10T09:15:00Z',
    wholesaleDetails: {
      businessName: 'Highland Specialty Coffee',
      taxId: 'CO-9182374',
      businessType: 'cafe',
      monthlyVolumeKg: '150+',
      status: 'approved',
      submittedAt: '2026-02-10T09:15:00Z',
      reviewedAt: '2026-02-11T11:00:00Z',
      deliveryAddress: {
        street: '450 16th St Mall',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'United States',
      },
    },
  },
  {
    id: 'user-admin-1',
    name: 'Alex Rivera (Master Roaster)',
    email: 'admin@firedupcoffee.com',
    phone: '+1 (415) 555-0100',
    role: 'admin',
    createdAt: '2025-11-01T08:00:00Z',
    adminSecurityBadge: 'SUPER-ADMIN-LVL3',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(ALL_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [activeInvitationTokens] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(INVITES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_INVITES;
    } catch {
      return INITIAL_INVITES;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (e) {
      console.warn('Unable to persist current user', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
    } catch (e) {
      console.warn('Unable to persist all users', e);
    }
  }, [allUsers]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    // Simulated network delay
    await new Promise((res) => setTimeout(res, 500));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const foundUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      return {
        success: false,
        error: 'No account registered with this email address. Please select your account type and register.',
      };
    }

    // Prototype note: In production, password hash is verified server-side using bcrypt/argon2
    if (cleanPass.length < 6) {
      return { success: false, error: 'Invalid credentials. Please verify your password.' };
    }

    setCurrentUser(foundUser);
    return { success: true, user: foundUser };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const registerCustomer = async (
    payload: CustomerRegistrationPayload
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    await new Promise((res) => setTimeout(res, 600));

    const cleanEmail = payload.email.trim().toLowerCase();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `cust-${Date.now()}`,
      name: payload.name.trim(),
      email: cleanEmail,
      phone: payload.phone.trim(),
      role: 'customer',
      createdAt: new Date().toISOString(),
      shippingAddress: payload.shippingAddress,
    };

    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const registerWholesale = async (
    payload: WholesaleRegistrationPayload
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    await new Promise((res) => setTimeout(res, 600));

    const cleanEmail = payload.email.trim().toLowerCase();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `wholes-${Date.now()}`,
      name: payload.contactName.trim(),
      email: cleanEmail,
      phone: payload.phone.trim(),
      role: 'wholesale',
      createdAt: new Date().toISOString(),
      wholesaleDetails: {
        businessName: payload.businessName.trim(),
        taxId: payload.taxId.trim(),
        businessType: payload.businessType,
        monthlyVolumeKg: payload.monthlyVolumeKg,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        deliveryAddress: payload.deliveryAddress,
      },
    };

    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const registerAdmin = async (
    payload: AdminRegistrationPayload
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    await new Promise((res) => setTimeout(res, 700));

    const cleanToken = payload.invitationToken.trim();
    if (!activeInvitationTokens.includes(cleanToken)) {
      return {
        success: false,
        error:
          'Security Error: Invalid or expired admin invitation token. Admin accounts cannot be created publicly.',
      };
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `admin-${Date.now()}`,
      name: payload.name.trim(),
      email: cleanEmail,
      phone: '+1 (800) 555-ROAST',
      role: 'admin',
      createdAt: new Date().toISOString(),
      adminSecurityBadge: 'SUPER-ADMIN-INVITED',
    };

    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const approveWholesaleUser = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && u.wholesaleDetails) {
          return {
            ...u,
            wholesaleDetails: {
              ...u.wholesaleDetails,
              status: 'approved',
              reviewedAt: new Date().toISOString(),
            },
          };
        }
        return u;
      })
    );

    if (currentUser?.id === userId && currentUser.wholesaleDetails) {
      setCurrentUser({
        ...currentUser,
        wholesaleDetails: {
          ...currentUser.wholesaleDetails,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
        },
      });
    }
  };

  const rejectWholesaleUser = (userId: string, reason = 'Documentation incomplete or volume under minimum.') => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && u.wholesaleDetails) {
          return {
            ...u,
            wholesaleDetails: {
              ...u.wholesaleDetails,
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
              rejectionReason: reason,
            },
          };
        }
        return u;
      })
    );

    if (currentUser?.id === userId && currentUser.wholesaleDetails) {
      setCurrentUser({
        ...currentUser,
        wholesaleDetails: {
          ...currentUser.wholesaleDetails,
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      });
    }
  };

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
