import Link from "next/link";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/about", label: "About" },
  { href: "/platform", label: "Platform" },
  { href: "/modules", label: "Modules" },
  { href: "/carbon-intelligence", label: "Carbon Intelligence" },
  { href: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-base font-semibold text-slate-900">Prakriti.AI</Link>
          <nav className="hidden items-center gap-5 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-slate-900">{link.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/login">Sign In</Link></Button>
            <Button asChild size="sm"><Link href="/request-demo">Request Demo</Link></Button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto pb-3 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-900">{link.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
