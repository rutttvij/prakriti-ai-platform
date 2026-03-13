import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricStatCardProps {
  title: string;
  value: string;
  hint?: string;
}

export function MetricStatCard({ title, value, hint }: MetricStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
