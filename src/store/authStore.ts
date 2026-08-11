import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface AuthUser {
  token: string;

  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoggedIn: false,
  isHydrated: false,

  hydrate: async () => {
    const user = await storage.getItem<AuthUser>(storage.KEYS.AUTH_USER);
    set({ user, isLoggedIn: !!user, isHydrated: true });
  },

  login: async (user: AuthUser) => {
    await storage.setItem(storage.KEYS.AUTH_USER, user);
    set({ user, isLoggedIn: true });
  },

  logout: async () => {
    await storage.removeItem(storage.KEYS.AUTH_USER);
    await storage.removeItem(storage.KEYS.SHIPMENTS);
    set({ user: null, isLoggedIn: false });
  },
}));
