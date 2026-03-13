"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/worker" },
  { label: "Shifts", href: "/worker/shifts" },
  { label: "Routes", href: "/worker/routes" },
  { label: "Tasks", href: "/worker/tasks" },
];

export function WorkerMobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-base font-semibold text-slate-900">Worker Console</p>
        <p className="text-xs text-slate-500">Prakriti.AI sanitation workflow</p>
      </header>

      <main className="px-3 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white p-2">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.href}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
                className={cn("h-11 text-xs", active && "font-semibold")}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
