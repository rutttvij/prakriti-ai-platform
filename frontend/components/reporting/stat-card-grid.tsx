import { MetricStatCard } from "@/components/ui-extensions/metric-stat-card";

export interface StatCardItem {
  title: string;
  value: string;
  hint?: string;
}

export function StatCardGrid({ items }: { items: StatCardItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <MetricStatCard key={item.title} title={item.title} value={item.value} hint={item.hint} />
      ))}
    </div>
  );
}
