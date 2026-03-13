import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PublicHeroProps {
  headline: string;
  subheadline: string;
}

export function PublicHero({ headline, subheadline }: PublicHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-emerald-100 bg-[linear-gradient(140deg,#ecfdf5_0%,#f0fdfa_55%,#ffffff_100%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:px-6 md:py-24">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Municipal Waste Operations Platform
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">{headline}</h1>
          <p className="max-w-xl text-base text-slate-600 md:text-lg">{subheadline}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/request-demo">Request a Demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/platform">Explore Platform</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">What Prakriti.AI Connects</p>
          <div className="mt-4 space-y-3">
            {[
              "Source registry and route intelligence",
              "Worker execution with verification",
              "Transfer, processing, and recovery evidence",
              "Carbon ledger and audit-ready exports",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
