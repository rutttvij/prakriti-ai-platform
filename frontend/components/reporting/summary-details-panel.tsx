import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DetailItem {
  label: string;
  value: string;
}

export function SummaryDetailsPanel({ title, items }: { title: string; items: DetailItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
