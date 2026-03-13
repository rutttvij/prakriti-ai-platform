import type { MapLegendItem } from "@/types/maps";

export function MapLegend({ items }: { items: MapLegendItem[] }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
