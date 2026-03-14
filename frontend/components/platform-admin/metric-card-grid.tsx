import { MetricStatCard } from "@/components/ui-extensions/metric-stat-card";

interface MetricCardGridItem {
  title: string;
  value: string;
  hint?: string;
}

export function MetricCardGrid({ items }: { items: MetricCardGridItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <MetricStatCard key={item.title} title={item.title} value={item.value} hint={item.hint} />
      ))}
    </div>
  );
}
