import Link from "next/link";

import { CtaBanner } from "@/components/public/cta-banner";
import { FeatureCard } from "@/components/public/feature-card";
import { MetricHighlightCard } from "@/components/public/metric-highlight-card";
import { ModuleCard } from "@/components/public/module-card";
import { PublicHero } from "@/components/public/public-hero";
import { QuotePlaceholder } from "@/components/public/quote-placeholder";
import { SectionHeader } from "@/components/public/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CTA_COPY, FEATURE_HIGHLIGHTS, METRICS, MODULES, ROLE_ECOSYSTEM } from "@/lib/public/content";

export default function LandingPage() {
  return (
    <div>
      <PublicHero
        headline="Unified municipal waste operations and carbon intelligence for accountable cities."
        subheadline="Prakriti.AI connects field execution, compliance, processing evidence, and environmental accounting so city teams can operate with confidence and audit readiness."
      />

      <section className="mx-auto w-full max-w-6xl space-y-12 px-4 py-14 md:px-6 md:py-18">
        <SectionHeader
          eyebrow="Platform Impact"
          title="Operational visibility, compliance confidence, and measurable climate outcomes"
          description="Track every stage from source pickup to processing and carbon verification in one role-aware municipal system."
        />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {METRICS.map((metric) => (
            <MetricHighlightCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-14 md:px-6">
        <SectionHeader
          eyebrow="Platform Overview"
          title="Built for end-to-end municipal lifecycle management"
          description="Prakriti.AI combines operations, traceability, governance, and sustainability into one connected product stack."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURE_HIGHLIGHTS.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} detail={feature.detail} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-14 md:px-6">
        <div className="flex items-end justify-between gap-3">
          <SectionHeader
            eyebrow="Module Highlights"
            title="One platform, specialized modules"
            description="Choose an integrated rollout or start with high-impact modules and scale city-wide."
          />
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link href="/modules">View All Modules</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.slice(0, 6).map((module) => (
            <ModuleCard key={module.slug} title={module.title} description={module.description} href="/modules" />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-14 md:px-6">
        <SectionHeader
          eyebrow="Role Ecosystem"
          title="Designed for every stakeholder in the waste value chain"
          description="Purpose-built portals keep each role focused while preserving shared operational truth."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROLE_ECOSYSTEM.map((role) => (
            <Card key={role.role} className="border-slate-200 bg-white/95">
              <CardContent className="space-y-2 p-5">
                <h3 className="text-base font-semibold text-slate-900">{role.role}</h3>
                <p className="text-sm text-slate-600">{role.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-14 md:px-6">
        <SectionHeader
          eyebrow="Field Perspective"
          title="What teams can expect"
          description="Representative implementation feedback placeholder for presentation workflows."
        />
        <QuotePlaceholder
          quote="With Prakriti.AI, our ward operations shifted from manual follow-ups to real-time exception resolution and cleaner audit preparation."
          author="Operations Leadership"
          title="Municipal Pilot Testimonial Placeholder"
        />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-20">
        <CtaBanner headline={CTA_COPY.headline} subheadline={CTA_COPY.subheadline} />
      </section>
    </div>
  );
}
