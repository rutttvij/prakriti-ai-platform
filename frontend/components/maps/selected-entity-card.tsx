import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MapPoint } from "@/types/maps";

function toLabel(key: string): string {
  return key.replaceAll("_", " ").replace(/\b\w/g, (item) => item.toUpperCase());
}

export function SelectedEntityCard({ point, title = "Selected Entity" }: { point: MapPoint | null; title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-700">
        {point ? (
          <>
            <p className="font-semibold text-slate-900">{point.title}</p>
            {point.subtitle ? <p>{point.subtitle}</p> : null}
            <p><span className="text-slate-500">Coordinates:</span> {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
            <p><span className="text-slate-500">Type:</span> {toLabel(point.kind)}</p>
            {point.metadata ? (
              <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
                {Object.entries(point.metadata).slice(0, 6).map(([key, value]) => (
                  <p key={key}><span className="font-medium text-slate-700">{toLabel(key)}:</span> {String(value ?? "-")}</p>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-slate-500">Select a marker or list item to view details.</p>
        )}
      </CardContent>
    </Card>
  );
}
