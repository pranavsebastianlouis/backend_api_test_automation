import { create } from 'zustand';
import type { User } from '../api';

interface AuthStore {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;

  setAuth:   (user: User, token: string) => void;
  clearAuth: ()                          => void;
  initAuth:  ()                          => void;
}

function readStoredAuth(): Pick<AuthStore, 'user' | 'token' | 'isAuthenticated'> {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }
  const token = localStorage.getItem('luxe_token');
  const raw   = localStorage.getItem('luxe_user');
  if (!token || !raw) {
    return { user: null, token: null, isAuthenticated: false };
  }
  try {
    const user = JSON.parse(raw) as User;
    return { user, token, isAuthenticated: true };
  } catch {
    localStorage.removeItem('luxe_token');
    localStorage.removeItem('luxe_user');
    return { user: null, token: null, isAuthenticated: false };
  }
}

const boot = readStoredAuth();

export const useAuthStore = create<AuthStore>((set) => ({
  user:            boot.user,
  token:           boot.token,
  isAuthenticated: boot.isAuthenticated,

  setAuth: (user, token) => {
    localStorage.setItem('luxe_token', token);
    localStorage.setItem('luxe_user',  JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('luxe_token');
    localStorage.removeItem('luxe_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: () => {
    const next = readStoredAuth();
    set(next);
  },
}));
