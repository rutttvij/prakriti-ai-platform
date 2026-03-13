"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RoleDashboardContent } from "@/components/dashboard/role-dashboard-content";
import { getRoleLandingPath } from "@/lib/auth/rbac";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const landingPath = getRoleLandingPath(user);

  useEffect(() => {
    if (!user) return;
    if (landingPath !== "/dashboard") {
      router.replace(landingPath);
    }
  }, [landingPath, router, user]);

  if (!user || landingPath !== "/dashboard") {
    return null;
  }

  return <RoleDashboardContent />;
}
