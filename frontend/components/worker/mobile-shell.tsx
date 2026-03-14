"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import { ProfileEditorSheet } from "@/components/layout/profile-editor-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/worker" },
  { label: "Shifts", href: "/worker/shifts" },
  { label: "Routes", href: "/worker/routes" },
  { label: "Tasks", href: "/worker/tasks" },
];

export function WorkerMobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen px-3 pb-24 pt-3">
      <header className="glass-nav sticky top-3 z-20 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="micro-label">Civic Intelligence</p>
            <p className="heading-font text-base font-semibold text-[var(--text-on-dark)]">Worker Console</p>
            <p className="text-xs text-[var(--text-on-dark-muted)]">Prakriti.AI sanitation workflow</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary">
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>Edit Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="pt-4">{children}</main>

      <nav className="fixed right-0 bottom-0 left-0 z-20 p-3">
        <div className="glass-nav mx-auto grid max-w-md grid-cols-4 gap-2 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.href}
                asChild
                size="sm"
                variant={active ? "primary" : "secondary"}
                className={cn("h-10 text-[0.68rem]", active && "font-semibold")}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </div>
      </nav>
      <ProfileEditorSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} user={user} />
    </div>
  );
}
