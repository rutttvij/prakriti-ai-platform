"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { WorkerMobileShell } from "@/components/worker/mobile-shell";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { canAccessPath, getPrimaryRole, getRoleLandingPath } from "@/lib/auth/rbac";
import { useLogoutOnUnauthorized } from "@/hooks/use-logout-on-unauthorized";
import { useAuthStore } from "@/store/auth-store";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  useLogoutOnUnauthorized();

  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { isLoading } = useAuthRedirect();
  const isAuthorizedForPath = canAccessPath(user, pathname);
  const primaryRole = getPrimaryRole(user);
  const isWorkerRole = primaryRole === "WORKER";

  useEffect(() => {
    if (!user) return;
    if (!isAuthorizedForPath) {
      router.replace(getRoleLandingPath(user));
    }
  }, [isAuthorizedForPath, router, user]);

  if (isLoading || (user && !isAuthorizedForPath)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <LoadingState title="Loading workspace" description="Verifying your access and routing to your role portal." />
      </div>
    );
  }

  if (isWorkerRole) {
    return <WorkerMobileShell>{children}</WorkerMobileShell>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar user={user} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
