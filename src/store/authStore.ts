import { create } from 'zustand';
import { storage } from '../utils/storage';

interface User {
  username: string;
  token: string;
  role: 'driver' | 'manager';
  driverID?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoggedIn: false,
  isHydrated: false,

  hydrate: async () => {
    const user = await storage.getItem<User>(storage.KEYS.AUTH_USER);
    set({ user, isLoggedIn: !!user, isHydrated: true });
  },

  login: async (user: User) => {
    await storage.setItem(storage.KEYS.AUTH_USER, user);
    set({ user, isLoggedIn: true });
  },

  logout: async () => {
    await storage.removeItem(storage.KEYS.AUTH_USER);
    set({ user: null, isLoggedIn: false });
  },
}));
