import { createContext, useContext } from 'react';
import type {
  User,
  CustomerRegistrationPayload,
  WholesaleRegistrationPayload,
  AdminRegistrationPayload,
} from '../types/auth';

export interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  registerCustomer: (payload: CustomerRegistrationPayload) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerWholesale: (payload: WholesaleRegistrationPayload) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerAdmin: (payload: AdminRegistrationPayload) => Promise<{ success: boolean; error?: string; user?: User }>;
  approveWholesaleUser: (userId: string) => void;
  rejectWholesaleUser: (userId: string, reason?: string) => void;
  activeInvitationTokens: string[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

