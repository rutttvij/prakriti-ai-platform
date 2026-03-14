"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

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
  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        visibleItems: section.items.filter((item) => canViewMenuItem(user, item.roleCodes)),
      })).filter((section) => section.visibleItems.length),
    [user],
  );

  const defaultExpandedSections = useMemo(() => {
    const nextState: Record<string, boolean> = {};
    for (const section of visibleSections) {
      const hasActiveItem = section.visibleItems.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
      );
      nextState[section.title] = hasActiveItem;
    }

    if (!Object.values(nextState).some(Boolean) && visibleSections[0]) {
      nextState[visibleSections[0].title] = true;
    }

    return nextState;
  }, [pathname, visibleSections]);

  const [sectionOverrides, setSectionOverrides] = useState<Record<string, boolean>>({});

  function toggleSection(sectionTitle: string, currentValue: boolean) {
    setSectionOverrides((prev) => ({ ...prev, [sectionTitle]: !currentValue }));
  }

  return (
    <nav className={cn("space-y-4", compact && "px-2")}>
      {visibleSections.map((section) => {
        const overrideValue = sectionOverrides[section.title];
        const isExpanded = overrideValue ?? defaultExpandedSections[section.title];
        return (
          <div key={section.title} className="space-y-2">
            <button
              type="button"
              onClick={() => toggleSection(section.title, Boolean(isExpanded))}
              className={cn(
                "micro-label flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[0.62rem] transition-colors",
                isExpanded ? "text-[var(--brand-700)]" : "hover:bg-[rgba(214,232,223,0.5)]",
              )}
              aria-expanded={isExpanded}
            >
              <span>{section.title}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isExpanded ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="space-y-1 pt-1">
                {section.visibleItems.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-[linear-gradient(135deg,var(--brand-500),var(--brand-700))] text-white shadow-[0_10px_18px_rgba(7,31,24,0.34)]"
                          : "text-ink-muted hover:bg-[rgba(214,232,223,0.55)] hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <Separator className="bg-[var(--soft-border)]" />
          </div>
        );
      })}
    </nav>
  );
}
