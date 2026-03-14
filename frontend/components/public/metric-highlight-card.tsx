import { Card, CardContent } from "@/components/ui/card";

interface MetricHighlightCardProps {
  label: string;
  value: string;
}

export function MetricHighlightCard({ label, value }: MetricHighlightCardProps) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="heading-font text-3xl font-semibold text-[var(--brand-700)]">{value}</p>
        <p className="text-sm text-ink-muted">{label}</p>
      </CardContent>
    </Card>
  );
}
