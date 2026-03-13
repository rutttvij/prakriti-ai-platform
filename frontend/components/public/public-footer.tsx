import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} Prakriti.AI. Municipal waste operations and carbon intelligence.</p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-slate-900">About</Link>
          <Link href="/platform" className="hover:text-slate-900">Platform</Link>
          <Link href="/contact" className="hover:text-slate-900">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
