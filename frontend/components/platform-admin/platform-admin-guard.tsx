"use client";

import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { roleCodes } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth-store";

export function PlatformAdminGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const codes = roleCodes(user);
  const allowed = Boolean(user?.is_superuser || codes.includes("SUPER_ADMIN"));

  if (!isHydrated || !user) {
    return <LoadingState title="Loading platform admin workspace" description="Checking super-admin access." />;
  }

  if (!allowed) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>Only SUPER_ADMIN users can view platform-admin controls.</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
