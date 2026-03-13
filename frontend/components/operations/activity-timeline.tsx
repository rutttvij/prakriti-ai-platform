import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, toTitleCase } from "@/lib/utils";

export interface ActivityTimelineItem {
  id: string;
  eventType: string;
  occurredAt: string | null;
  actor?: string | null;
  notes?: string | null;
  weightKg?: number | null;
  photoUrl?: string | null;
}

export function ActivityTimeline({ title = "Activity Timeline", items }: { title?: string; items: ActivityTimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{toTitleCase(item.eventType)}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(item.occurredAt)}</p>
                </div>
                <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-500">Worker:</span> {item.actor ?? "-"}
                  </p>
                  <p>
                    <span className="text-slate-500">Weight (kg):</span> {item.weightKg ?? "-"}
                  </p>
                </div>
                {item.notes ? <p className="text-sm text-slate-700">{item.notes}</p> : null}
                {item.photoUrl ? (
                  <a href={item.photoUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">
                    Open proof photo
                  </a>
                ) : null}
                {index < items.length - 1 ? <Separator className="mt-4" /> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No activity logged yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
