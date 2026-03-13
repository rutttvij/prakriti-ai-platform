"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { iconMap } from "@/components/layout/icon-map";
import { NAV_SECTIONS } from "@/components/layout/navigation-config";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { canViewMenuItem } from "@/lib/auth/permissions";
import type { User } from "@/types/auth";

interface SidebarNavProps {
  user: User | null;
  compact?: boolean;
}

export function SidebarNav({ user, compact = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-4", compact && "px-2")}>
      {NAV_SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => canViewMenuItem(user, item.roleCodes));
        if (!visibleItems.length) return null;

        return (
          <div key={section.title} className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{section.title}</p>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
            <Separator />
          </div>
        );
      })}
    </nav>
  );
}
