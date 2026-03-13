import { CtaBanner } from "@/components/public/cta-banner";
import { SectionHeader } from "@/components/public/section-header";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    title: "Landfill Diversion Visibility",
    description: "Track how much waste is diverted away from landfill through structured operational evidence.",
  },
  {
    title: "Recycling and Composting Impact",
    description: "Connect processing outcomes to measurable impact categories and reporting-ready totals.",
  },
  {
    title: "Carbon Event Tracking",
    description: "Capture carbon-linked events from pickup, transfer, processing, and recovery workflows.",
  },
  {
    title: "Environmental Ledger",
    description: "Maintain a transparent ledger for carbon accounting with traceable source events.",
  },
  {
    title: "Audit-Ready Sustainability Reporting",
    description: "Prepare verification-aligned exports for internal audits, external reviews, and climate disclosures.",
  },
];

export default function CarbonIntelligencePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 md:px-6 md:py-16">
      <SectionHeader
        eyebrow="Carbon Intelligence"
        title="Turn waste operations into measurable environmental outcomes"
        description="Prakriti.AI connects field and facility evidence to carbon accounting workflows so sustainability reports are grounded in operational truth."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="border-slate-200 bg-white/95">
            <CardContent className="space-y-2 p-6">
              <h3 className="text-base font-semibold text-slate-900">{pillar.title}</h3>
              <p className="text-sm text-slate-600">{pillar.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CtaBanner
        headline="Operational carbon intelligence without spreadsheet fragmentation"
        subheadline="See how Prakriti.AI supports ledger discipline, verification workflows, and sustainability reporting."
      />
    </div>
  );
}
