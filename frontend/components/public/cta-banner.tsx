import Link from "next/link";

import { Button } from "@/components/ui/button";

interface CtaBannerProps {
  headline: string;
  subheadline: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CtaBanner({
  headline,
  subheadline,
  primaryLabel = "Request Demo",
  primaryHref = "/request-demo",
  secondaryLabel = "Contact Team",
  secondaryHref = "/contact",
}: CtaBannerProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_70%)] p-6 md:p-8">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900 md:text-2xl">{headline}</h3>
          <p className="text-sm text-slate-600 md:text-base">{subheadline}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
