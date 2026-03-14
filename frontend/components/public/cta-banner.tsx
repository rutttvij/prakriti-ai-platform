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
    <section className="surface-card-strong p-6 md:p-8">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        <div className="space-y-2">
          <h3 className="heading-font text-xl font-semibold text-ink md:text-2xl">{headline}</h3>
          <p className="text-sm text-ink-muted md:text-base">{subheadline}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
