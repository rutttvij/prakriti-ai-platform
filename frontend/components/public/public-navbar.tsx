"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/about", label: "About" },
  { href: "/platform", label: "Platform" },
  { href: "/modules", label: "Modules" },
  { href: "/carbon-intelligence", label: "Carbon Intelligence" },
  { href: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6 lg:px-8">
      <div className="glass-nav mx-auto flex w-full max-w-7xl flex-col px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="space-y-0.5">
            <p className="micro-label text-[0.6rem]">Civic Intelligence</p>
            <p className="heading-font text-base font-semibold text-[var(--text-on-dark)]">Prakriti.AI</p>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "bg-[linear-gradient(135deg,#0a1932,#0b2644)] text-[var(--text-on-dark)] shadow-[0_10px_16px_rgba(7,31,24,0.42)]"
                      : "text-[rgba(211,233,224,0.92)] hover:bg-[rgba(215,244,230,0.16)] hover:text-[var(--text-on-dark)]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="border-[rgba(170,231,207,0.22)] bg-[rgba(233,248,241,0.9)]">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/request-demo">Request Demo</Link>
            </Button>
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto md:hidden">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em]",
                  active
                    ? "bg-[rgba(214,245,231,0.88)] text-[var(--brand-700)]"
                    : "bg-[rgba(213,244,229,0.14)] text-[rgba(213,236,226,0.88)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
