import { Card, CardContent } from "@/components/ui/card";

interface MetricHighlightCardProps {
  label: string;
  value: string;
}

export function MetricHighlightCard({ label, value }: MetricHighlightCardProps) {
  return (
    <Card className="border-emerald-100 bg-white/95">
      <CardContent className="space-y-1 p-5">
        <p className="text-3xl font-semibold text-emerald-700">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </CardContent>
    </Card>
  );
}
