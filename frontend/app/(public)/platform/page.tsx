import { CtaBanner } from "@/components/public/cta-banner";
import { SectionHeader } from "@/components/public/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_ARCHITECTURE } from "@/lib/public/content";

export default function PlatformPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 md:px-6 md:py-16">
      <SectionHeader
        eyebrow="Platform Architecture"
        title="A connected system for municipal waste operations and environmental accountability"
        description="Prakriti.AI unifies source registry, field execution, transfer operations, facility processing, carbon accounting, and governance workflows in one platform."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORM_ARCHITECTURE.map((item) => (
          <Card key={item.title} className="border-slate-200 bg-white/95">
            <CardContent className="space-y-2 p-6">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-200 bg-emerald-50/80">
        <CardContent className="space-y-2 p-6 text-sm text-emerald-900">
          <h3 className="text-base font-semibold">How this architecture helps operational teams</h3>
          <p>
            Teams can move from reactive firefighting to proactive operations with role-aware workflows, clear evidence
            chains, and reusable audit exports.
          </p>
        </CardContent>
      </Card>

      <CtaBanner
        headline="Need a platform walkthrough aligned to your existing operations stack?"
        subheadline="Request a guided demo for city admin, ward operations, processor, or audit workflows."
      />
    </div>
  );
}
