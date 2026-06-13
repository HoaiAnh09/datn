'use client';

import { create } from 'zustand';
import type { User } from '@/common/types';
import { authApi } from '@/features/auth/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  getMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  clearAuth: () => set({ user: null, isLoading: false }),

  getMe: async () => {
    try {
      const res = await authApi.getMe();
      set({ user: res.data ?? null, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
