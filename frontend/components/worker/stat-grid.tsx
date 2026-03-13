import { Card, CardContent } from "@/components/ui/card";

export function WorkerStatGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="text-xl font-semibold text-slate-900">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
