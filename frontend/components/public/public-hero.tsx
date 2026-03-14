import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PublicHeroProps {
  headline: string;
  subheadline: string;
}

export function PublicHero({ headline, subheadline }: PublicHeroProps) {
  return (
    <section className="relative overflow-hidden py-8 md:py-10">
      <div className="surface-card-strong mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.15fr_0.85fr] md:items-center md:px-8 md:py-14">
        <div className="space-y-6">
          <p className="micro-label rounded-full border border-[var(--soft-border)] bg-[rgba(218,244,229,0.35)] px-4 py-1.5">Municipal Waste Operations Platform</p>
          <h1 className="heading-font text-3xl font-extrabold leading-tight text-[var(--text-on-dark)] md:text-5xl">{headline}</h1>
          <p className="max-w-xl text-base text-[var(--text-on-dark-muted)] md:text-lg">{subheadline}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/request-demo">Request a Demo</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/platform">Explore Platform</Link>
            </Button>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="micro-label">What Prakriti.AI Connects</p>
          <div className="mt-4 space-y-3">
            {[
              "Source registry and route intelligence",
              "Worker execution with verification",
              "Transfer, processing, and recovery evidence",
              "Carbon ledger and audit-ready exports",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-[var(--soft-border)] bg-[rgba(228,251,239,0.45)] px-3 py-2 text-sm text-ink">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
