import Link from "next/link";
import {
  ArrowRight,
  ArrowRightCircle,
  BarChart3,
  Bike,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  Globe2,
  Leaf,
  LineChart,
  Map,
  Recycle,
  Route,
  Scale,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const challengeCards = [
  {
    title: "Lack of Traceability in Waste Flows",
    description: "Cities struggle to track movement from collection points to final recovery or disposal.",
    icon: Route,
  },
  {
    title: "Operational Inefficiencies",
    description: "Manual coordination and fragmented workflows reduce productivity and service reliability.",
    icon: UserCog,
  },
  {
    title: "Limited Environmental Reporting",
    description: "Environmental outcomes are hard to quantify without connected lifecycle data.",
    icon: BarChart3,
  },
  {
    title: "Poor Compliance Tracking for Bulk Waste Generators",
    description: "Segregation and service compliance records are often incomplete and difficult to verify.",
    icon: ClipboardCheck,
  },
  {
    title: "Difficulty Generating Carbon-Impact Data",
    description: "Carbon impact calculations require structured event logs and reliable material movement evidence.",
    icon: LineChart,
  },
];

const lifecycleFlow = [
  {
    title: "Source Registry",
    description: "Digitize households and bulk generators with geotagged source identity.",
    icon: Building2,
  },
  {
    title: "Field Operations",
    description: "Manage routes, assignments, and verified field execution in real time.",
    icon: Bike,
  },
  {
    title: "Transfer & Processing",
    description: "Capture transfer receipts, facility intake, and processing records.",
    icon: Warehouse,
  },
  {
    title: "Recovery & Disposal",
    description: "Track diversion, recycling, composting, and residual disposal pathways.",
    icon: Recycle,
  },
  {
    title: "Environmental Accounting",
    description: "Convert lifecycle events into environmental impact and carbon intelligence.",
    icon: Leaf,
  },
  {
    title: "Audit & Reporting",
    description: "Generate audit-ready reports, compliance evidence, and reporting exports.",
    icon: FileSearch,
  },
];

const coreModules = [
  {
    title: "Municipal Administration",
    description: "Manage cities, wards, zones, and users.",
    icon: Building2,
  },
  {
    title: "Worker Operations",
    description: "Routes, shifts, pickup tasks, and field execution.",
    icon: Truck,
  },
  {
    title: "Bulk Generator Compliance",
    description: "Monitor waste generators and enforce segregation compliance.",
    icon: ShieldCheck,
  },
  {
    title: "Transfer & Processing",
    description: "Track waste movement to facilities and processing outcomes.",
    icon: Warehouse,
  },
  {
    title: "Carbon Intelligence",
    description: "Calculate environmental impact and landfill diversion.",
    icon: LineChart,
  },
  {
    title: "Audit & Reporting",
    description: "Generate lifecycle evidence and compliance reports.",
    icon: FileCheck2,
  },
  {
    title: "Maps & Operations",
    description: "Visualize routes, sources, and facilities.",
    icon: Map,
  },
];

const roles = [
  {
    title: "City Administrator",
    description: "Operational dashboards and city-wide insights.",
    icon: Globe2,
  },
  {
    title: "Ward Officer",
    description: "Ward-level monitoring and performance management.",
    icon: Scale,
  },
  {
    title: "Sanitation Supervisor",
    description: "Field operations coordination.",
    icon: Users,
  },
  {
    title: "Waste Workers",
    description: "Mobile-first task execution.",
    icon: Truck,
  },
  {
    title: "Facility Operators",
    description: "Transfer receiving and processing workflows.",
    icon: Warehouse,
  },
  {
    title: "Auditors",
    description: "Lifecycle verification and environmental audits.",
    icon: FileSearch,
  },
  {
    title: "Bulk Generators",
    description: "Compliance tracking and recovery certificates.",
    icon: ClipboardCheck,
  },
];

const impactCards = [
  {
    title: "Landfill Diversion Tracking",
    icon: CheckCircle2,
  },
  {
    title: "Recycling & Composting Analytics",
    icon: Recycle,
  },
  {
    title: "Carbon Event Ledger",
    icon: LineChart,
  },
  {
    title: "Environmental Reporting",
    icon: FileCheck2,
  },
  {
    title: "ESG & Sustainability Insights",
    icon: Leaf,
  },
];

const benefits = [
  "Operational Transparency",
  "Waste Traceability",
  "Improved Worker Productivity",
  "Compliance Visibility",
  "Environmental Impact Measurement",
  "Audit-Ready Reporting",
];

export default function LandingPage() {
  return (
    <div className="space-y-10 pb-10 md:space-y-16 md:pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(31,107,79,0.18)] bg-[linear-gradient(145deg,rgba(228,247,239,0.75),rgba(243,252,247,0.92))] px-6 py-14 shadow-[0_20px_60px_rgba(14,31,44,0.12)] md:px-12 md:py-20">
        <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-[rgba(37,127,93,0.18)] blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-[rgba(79,115,136,0.16)] blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <p className="micro-label">GovTech + ClimateTech SaaS</p>
            <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl lg:text-6xl">
              Prakriti.AI – Intelligent Waste Operations & Carbon Intelligence Platform
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
              A digital platform that enables cities to manage waste operations, trace material flows, and generate
              audit-ready environmental insights.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/request-demo">Request Demo</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/platform">Explore Platform</Link>
              </Button>
            </div>
          </div>

          <Card className="surface-card-strong overflow-hidden border-[rgba(37,127,93,0.26)]">
            <CardHeader className="border-b border-[rgba(31,107,79,0.15)] pb-4">
              <CardTitle className="text-lg text-ink md:text-xl">Operations Intelligence Dashboard</CardTitle>
              <CardDescription className="text-ink-muted">
                Live operational, compliance, and environmental performance snapshot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Daily Pickups", "12,480"],
                  ["Segregation Compliance", "89%"],
                  ["Landfill Diversion", "64%"],
                  ["Carbon Events Logged", "3,120"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[rgba(51,76,91,0.18)] bg-white/80 p-3 shadow-[0_6px_16px_rgba(14,31,44,0.08)]"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[rgba(51,76,91,0.18)] bg-white/75 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
                  <span>Lifecycle Completion Trend</span>
                  <span>Last 30 Days</span>
                </div>
                <div className="h-24 rounded-lg bg-[linear-gradient(180deg,rgba(37,127,93,0.22),rgba(37,127,93,0.04))]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <p className="micro-label">Problem</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">The Waste Management Challenge</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challengeCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="surface-card border-[rgba(51,76,91,0.16)]">
                <CardContent className="space-y-3 p-5">
                  <div className="inline-flex rounded-lg border border-[rgba(31,107,79,0.2)] bg-[rgba(223,247,235,0.65)] p-2 text-[var(--brand-700)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <p className="micro-label">Platform Overview</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">One Platform for Complete Waste Lifecycle Management</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lifecycleFlow.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="surface-card relative border-[rgba(51,76,91,0.16)]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex rounded-lg border border-[rgba(31,107,79,0.2)] bg-[rgba(223,247,235,0.65)] p-2 text-[var(--brand-700)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{step.description}</p>
                  {index < lifecycleFlow.length - 1 ? (
                    <ArrowRightCircle className="absolute -bottom-3 right-4 hidden h-6 w-6 text-[rgba(31,107,79,0.55)] xl:block" />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <p className="micro-label">Modules</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">Powerful Modules Built for Cities</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coreModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="surface-card border-[rgba(51,76,91,0.16)]">
                <CardContent className="space-y-3 p-5">
                  <div className="inline-flex rounded-lg border border-[rgba(31,107,79,0.2)] bg-[rgba(223,247,235,0.65)] p-2 text-[var(--brand-700)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{module.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{module.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <p className="micro-label">Role Ecosystem</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">Designed for Every Stakeholder</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.title} className="surface-card border-[rgba(51,76,91,0.16)]">
                <CardContent className="space-y-3 p-5">
                  <div className="inline-flex rounded-lg border border-[rgba(31,107,79,0.2)] bg-[rgba(223,247,235,0.65)] p-2 text-[var(--brand-700)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-ink">{role.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{role.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <p className="micro-label">Environmental Impact</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">Turning Waste Data Into Environmental Intelligence</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {impactCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="surface-card border-[rgba(51,76,91,0.16)]">
                <CardContent className="space-y-3 p-5">
                  <div className="inline-flex rounded-lg border border-[rgba(31,107,79,0.2)] bg-[rgba(223,247,235,0.65)] p-2 text-[var(--brand-700)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold leading-snug text-ink">{item.title}</h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <p className="micro-label">Benefits</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">Why Cities Choose Prakriti.AI</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit) => (
            <Card key={benefit} className="surface-card border-[rgba(51,76,91,0.16)]">
              <CardContent className="flex items-center gap-3 p-5">
                <CheckCircle2 className="h-5 w-5 text-[var(--brand-700)]" />
                <p className="text-base font-medium text-ink">{benefit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="surface-card-strong overflow-hidden rounded-[2rem] border-[rgba(31,107,79,0.24)] px-6 py-12 text-center md:px-10 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <p className="micro-label">Demo Call To Action</p>
          <h2 className="text-3xl font-semibold text-ink md:text-5xl">Transform Waste Operations with Prakriti.AI</h2>
          <p className="text-base leading-relaxed text-ink-muted md:text-lg">
            See how cities can digitize waste management and generate real environmental insights.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/request-demo">Request a Demo</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact" className="inline-flex items-center gap-2">
                Contact Us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
