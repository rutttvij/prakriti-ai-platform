"use client";

import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProfileEditorSheet } from "@/components/layout/profile-editor-sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types/auth";

interface TopNavbarProps {
  user: User | null;
}

export function TopNavbar({ user }: TopNavbarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  function onLogout() {
    logout();
    router.replace("/login");
  }

  const role = user?.roles?.[0]?.code?.replace("_", " ") ?? "Role";

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 lg:px-8">
      <div className="glass-nav mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-5">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[19rem] p-0 sm:w-80">
              <SheetHeader className="px-4 py-4">
                <p className="micro-label">Civic Intelligence</p>
                <SheetTitle>Prakriti.AI</SheetTitle>
              </SheetHeader>
              <div className="px-3 pb-4">
                <SidebarNav user={user} compact />
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:block">
            <p className="micro-label text-[0.6rem]">Civic Intelligence</p>
            <p className="heading-font text-base font-semibold text-[var(--text-on-dark)]">Prakriti.AI Control Panel</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-auto gap-3 border-[rgba(170,231,207,0.22)] bg-[rgba(229,247,239,0.9)] px-3 py-1.5">
                <div className="text-right leading-tight">
                  <p className="text-xs font-semibold text-ink">{user?.full_name ?? "User"}</p>
                  <p className="text-[0.68rem] text-ink-muted">{user?.email ?? ""}</p>
                </div>
                <span className="rounded-full border border-[rgba(24,79,60,0.4)] bg-[linear-gradient(135deg,var(--brand-500),var(--brand-700))] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white">
                  {role}
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>Edit Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ProfileEditorSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} user={user} />
    </header>
  );
}
