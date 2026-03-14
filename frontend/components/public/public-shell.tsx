import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public/public-footer";
import { PublicNavbar } from "@/components/public/public-navbar";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-[var(--text-on-dark)]">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-10 md:px-6 md:pt-4 lg:px-8">{children}</main>
      <PublicFooter />
    </div>
  );
}
