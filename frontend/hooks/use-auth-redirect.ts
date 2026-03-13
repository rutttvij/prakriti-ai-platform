"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";

export function useAuthRedirect() {
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isFetchingUser = useAuthStore((state) => state.isFetchingUser);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!isFetchingUser && !user) {
      router.replace("/login");
    }
  }, [isFetchingUser, isHydrated, router, token, user]);

  return {
    isLoading: !isHydrated || (Boolean(token) && (isFetchingUser || !user)),
  };
}
