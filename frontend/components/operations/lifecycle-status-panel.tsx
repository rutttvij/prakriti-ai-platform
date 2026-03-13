import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui-extensions/status-badge";

export function LifecycleStatusPanel({
  title,
  status,
  summary,
}: {
  title?: string;
  status: string;
  summary?: Array<{ label: string; value: string | number | null | undefined }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title ?? "Lifecycle Status"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Current Status</p>
          <StatusBadge value={status} />
        </div>
        {summary?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.map((item) => (
              <div key={item.label}>
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm text-slate-800">{item.value ?? "-"}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
