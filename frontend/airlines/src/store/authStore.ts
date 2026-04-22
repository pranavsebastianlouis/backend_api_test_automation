import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;

  setAuth:   (user: User, token: string) => void;
  clearAuth: ()                          => void;
  initAuth:  ()                          => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:            null,
  token:           null,
  isAuthenticated: false,

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
    const token = localStorage.getItem('luxe_token');
    const raw   = localStorage.getItem('luxe_user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('luxe_token');
        localStorage.removeItem('luxe_user');
      }
    }
  },
}));
