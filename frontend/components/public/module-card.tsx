import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

interface ModuleCardProps {
  title: string;
  description: string;
  href?: string;
}

export function ModuleCard({ title, description, href }: ModuleCardProps) {
  const content = (
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-xl">
      <CardContent className="space-y-3 p-5">
        <h3 className="heading-font text-base font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{description}</p>
        {href ? <p className="micro-label text-[0.62rem] text-[var(--brand-700)]">Learn more</p> : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
