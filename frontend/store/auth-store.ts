"use client";

import { create } from "zustand";

import { getCurrentUser, login as loginRequest } from "@/lib/api/services";
import { clearTokenFromStorage, getTokenFromStorage, setTokenInStorage } from "@/lib/auth/token-storage";
import type { LoginRequest, User } from "@/types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  isFetchingUser: boolean;
  hydrate: () => void;
  setUser: (user: User | null) => void;
  login: (payload: LoginRequest) => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isHydrated: false,
  isFetchingUser: false,

  hydrate: () => {
    const token = getTokenFromStorage();
    set({ token, isHydrated: true });
  },

  setUser: (user) => set({ user }),

  login: async (payload) => {
    const response = await loginRequest(payload);
    setTokenInStorage(response.access_token);
    set({ token: response.access_token });
    await get().fetchCurrentUser();
  },

  fetchCurrentUser: async () => {
    const token = get().token ?? getTokenFromStorage();
    if (!token) {
      set({ user: null, token: null, isFetchingUser: false });
      return null;
    }

    set({ isFetchingUser: true, token });

    try {
      const user = await getCurrentUser();
      set({ user, isFetchingUser: false });
      return user;
    } catch {
      get().logout();
      return null;
    }
  },

  logout: () => {
    clearTokenFromStorage();
    set({ token: null, user: null, isFetchingUser: false });
  },
}));
