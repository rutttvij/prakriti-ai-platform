"use client";

import { LeafyGreen } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { User } from "@/types/auth";

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 p-3 lg:flex lg:flex-col xl:w-80 xl:p-4">
      <div className="surface-card-strong flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden px-4 py-5 xl:max-h-[calc(100vh-2.5rem)]">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,var(--brand-500),var(--brand-700))] text-white shadow-lg">
            <LeafyGreen className="h-5 w-5" />
          </div>
          <div>
            <p className="micro-label">Civic Intelligence</p>
            <p className="heading-font text-lg font-semibold text-ink">Prakriti.AI</p>
          </div>
        </div>
        <Separator className="my-4 bg-[var(--soft-border)]" />
        <div className="overflow-y-auto pr-1">
          <SidebarNav user={user} />
        </div>
      </div>
    </aside>
  );
}
