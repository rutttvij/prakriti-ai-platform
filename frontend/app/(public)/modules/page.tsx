import { CtaBanner } from "@/components/public/cta-banner";
import { ModuleCard } from "@/components/public/module-card";
import { SectionHeader } from "@/components/public/section-header";
import { MODULES } from "@/lib/public/content";

export default function ModulesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 md:px-6 md:py-16">
      <SectionHeader
        eyebrow="Modules"
        title="Purpose-built products across the municipal waste lifecycle"
        description="Each module can operate independently, while sharing one traceability backbone across operations, compliance, and environmental accounting."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <ModuleCard key={module.slug} title={module.title} description={module.description} />
        ))}
      </div>

      <CtaBanner
        headline="Build your rollout roadmap by module"
        subheadline="Start with priority operations and expand to a city-wide integrated platform."
      />
    </div>
  );
}
