import { PublicLeadForm } from "@/components/public/public-lead-form";
import { SectionHeader } from "@/components/public/section-header";
import { Card, CardContent } from "@/components/ui/card";

export default function RequestDemoPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 md:px-6 md:py-16">
      <SectionHeader
        eyebrow="Request Demo"
        title="Book a tailored Prakriti.AI walkthrough"
        description="Tell us about your city operations, team structure, and reporting priorities. We will customize the demo around your use case."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PublicLeadForm mode="demo" />

        <Card className="h-fit border-slate-200 bg-white/95">
          <CardContent className="space-y-4 p-6 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-900">Typical demo agenda</h3>
            <ul className="space-y-2">
              <li>1. Source registry and route execution workflows</li>
              <li>2. Exceptions, alerts, and map-based operations</li>
              <li>3. Audit evidence exports and carbon intelligence reporting</li>
            </ul>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
              This form is production-ready in structure and currently scaffolded with mock/local submission behavior.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
