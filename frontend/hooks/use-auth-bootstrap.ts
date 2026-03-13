"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/store/auth-store";

export function useAuthBootstrap() {
  const hasRun = useRef(false);
  const hydrate = useAuthStore((state) => state.hydrate);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      hydrate();
    }
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) return;
    void fetchCurrentUser();
  }, [fetchCurrentUser, isHydrated, token]);
}
