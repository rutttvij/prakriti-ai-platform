import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LifecyclePreviewItem {
  label: string;
  value: number;
}

export function LifecyclePreviewCard({ title, items }: { title: string; items: LifecyclePreviewItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        {items.map((item) => (
          <p key={item.label}><span className="text-slate-500">{item.label}:</span> {item.value}</p>
        ))}
      </CardContent>
    </Card>
  );
}
