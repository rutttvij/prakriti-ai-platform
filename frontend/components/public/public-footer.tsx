import Link from "next/link";

const footerLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/modules", label: "Modules" },
  { href: "#", label: "Documentation" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
];

export function PublicFooter() {
  return (
    <footer className="px-4 pb-6 md:px-6 lg:px-8">
      <div className="surface-card mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
        <p>© Prakriti.AI – Intelligent Waste Operations Platform</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {footerLinks.map((item) => (
            <Link key={item.label} href={item.href} className="font-medium hover:text-ink">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
