import { CtaBanner } from "@/components/public/cta-banner";
import { SectionHeader } from "@/components/public/section-header";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 md:px-6 md:py-16">
      <SectionHeader
        eyebrow="About Prakriti.AI"
        title="Building trusted municipal waste traceability and carbon intelligence"
        description="Prakriti.AI helps city governments digitize operations, prove compliance, and connect waste outcomes to environmental accountability."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 bg-white/95">
          <CardContent className="space-y-3 p-6 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-900">Our Vision</h3>
            <p>
              Cities should be able to run waste systems with the same precision expected in critical urban infrastructure.
              Prakriti.AI creates a single operational truth across field, facility, compliance, and audit teams.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95">
          <CardContent className="space-y-3 p-6 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-900">The Municipal Waste Challenge</h3>
            <p>
              Fragmented records, delayed reporting, and low traceability make it difficult to enforce compliance,
              optimize routes, and verify environmental claims with confidence.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 bg-white/95">
          <CardContent className="space-y-3 p-6 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-900">Why Traceability Matters</h3>
            <p>
              Source-to-disposal lineage enables transparent service delivery, stronger compliance enforcement, and
              faster exception handling when operations break down.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95">
          <CardContent className="space-y-3 p-6 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-900">Why Carbon Intelligence Matters</h3>
            <p>
              Cities need measurable evidence of diversion, recovery, and processing impact. Prakriti.AI links
              operational events to carbon records and reporting workflows in an audit-ready format.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white/95">
        <CardContent className="space-y-3 p-6 text-sm text-slate-700">
          <h3 className="text-base font-semibold text-slate-900">Value of Digitized Waste Operations</h3>
          <p>
            Digitization reduces blind spots, standardizes operational evidence, and gives governments a reliable way
            to improve service quality, regulatory compliance, and environmental outcomes at scale.
          </p>
        </CardContent>
      </Card>

      <CtaBanner
        headline="See how Prakriti.AI aligns operations, compliance, and sustainability reporting."
        subheadline="Book a walkthrough tailored for your city or municipal program."
      />
    </div>
  );
}
