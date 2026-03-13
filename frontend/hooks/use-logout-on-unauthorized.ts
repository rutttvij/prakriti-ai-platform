"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { setUnauthorizedHandler } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export function useLogoutOnUnauthorized() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      router.replace("/login");
    });

    return () => setUnauthorizedHandler(null);
  }, [logout, router]);
}
