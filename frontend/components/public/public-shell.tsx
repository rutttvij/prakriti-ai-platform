import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public/public-footer";
import { PublicNavbar } from "@/components/public/public-navbar";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_55%,#ecfeff_100%)] text-slate-900">
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
