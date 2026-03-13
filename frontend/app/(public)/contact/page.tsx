import { PublicLeadForm } from "@/components/public/public-lead-form";
import { SectionHeader } from "@/components/public/section-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 md:px-6 md:py-16">
      <SectionHeader
        eyebrow="Contact"
        title="Talk to the Prakriti.AI team"
        description="Share your operational goals, compliance requirements, or deployment context. We will route your inquiry to the right product and implementation team."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PublicLeadForm mode="contact" />

        <Card className="h-fit border-slate-200 bg-white/95">
          <CardContent className="space-y-4 p-6 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-900">Response expectations</h3>
            <p>Initial response target: 1 business day for municipal and enterprise inquiries.</p>
            <p>For demos, use the dedicated request flow so we can tailor the walkthrough to your role and city context.</p>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Form submission currently uses a local placeholder handler until backend public form endpoints are connected.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
