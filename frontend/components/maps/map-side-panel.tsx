import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SidePanelItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

interface MapSidePanelProps {
  title: string;
  description?: string;
  items: SidePanelItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  emptyText?: string;
}

export function MapSidePanel({ title, description, items, selectedId, onSelect, emptyText }: MapSidePanelProps) {
  return (
    <Card className="h-[560px] overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </CardHeader>
      <CardContent className="h-[470px] space-y-2 overflow-y-auto">
        {items.map((item) => {
          const selected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left",
                selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.subtitle ? <p className="text-xs text-slate-600">{item.subtitle}</p> : null}
              {item.meta ? <p className="text-xs text-slate-500">{item.meta}</p> : null}
            </button>
          );
        })}
        {!items.length ? <p className="text-sm text-slate-500">{emptyText ?? "No records available."}</p> : null}
      </CardContent>
    </Card>
  );
}
