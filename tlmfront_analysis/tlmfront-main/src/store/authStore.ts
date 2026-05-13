import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  has_active_subscription: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
  updateAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  updateAccessToken: (accessToken) => set({ accessToken }),
}));
