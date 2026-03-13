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
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <LeafyGreen className="h-6 w-6 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Prakriti.AI</p>
          <p className="text-xs text-slate-500">Municipal Ops Console</p>
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav user={user} />
      </div>
    </aside>
  );
}
