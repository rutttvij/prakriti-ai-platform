import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

interface ModuleCardProps {
  title: string;
  description: string;
  href?: string;
}

export function ModuleCard({ title, description, href }: ModuleCardProps) {
  const content = (
    <Card className="h-full border-slate-200 bg-white/95 transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3 p-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
        {href ? <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Learn more</p> : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
