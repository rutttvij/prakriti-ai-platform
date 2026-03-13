"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

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

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation menu">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-slate-200 p-4">
              <SheetTitle>Prakriti.AI</SheetTitle>
            </SheetHeader>
            <div className="p-3">
              <SidebarNav user={user} compact />
            </div>
          </SheetContent>
        </Sheet>
        <p className="text-sm font-semibold text-slate-900">Prakriti.AI</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.full_name ?? "User"}</p>
          <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Account</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>{user?.full_name ?? "Unknown User"}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
