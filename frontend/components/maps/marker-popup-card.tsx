import type { MapPoint } from "@/types/maps";

function toLabel(key: string): string {
  return key.replaceAll("_", " ").replace(/\b\w/g, (item) => item.toUpperCase());
}

export function MarkerPopupCard({ point }: { point: MapPoint }) {
  return (
    <div className="min-w-[220px] space-y-2 text-sm">
      <p className="font-semibold text-slate-900">{point.title}</p>
      {point.subtitle ? <p className="text-slate-600">{point.subtitle}</p> : null}
      <p className="text-xs text-slate-500">Type: {toLabel(point.kind)}</p>
      {point.metadata ? (
        <div className="space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600">
          {Object.entries(point.metadata).slice(0, 4).map(([key, value]) => (
            <p key={key}><span className="font-medium text-slate-700">{toLabel(key)}:</span> {String(value ?? "-")}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
