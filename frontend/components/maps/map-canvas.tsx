"use client";

import dynamic from "next/dynamic";

import type { MapLine, MapPoint } from "@/types/maps";

const LeafletMap = dynamic(() => import("@/components/maps/leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => <div className="flex h-[460px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-600">Loading map...</div>,
});

interface MapCanvasProps {
  points: MapPoint[];
  lines?: MapLine[];
  selectedPointId?: string | null;
  onSelectPoint?: (pointId: string) => void;
  emptyMessage?: string;
}

export function MapCanvas({ points, lines = [], selectedPointId, onSelectPoint, emptyMessage }: MapCanvasProps) {
  if (!points.length) {
    return (
      <div className="flex h-[460px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-600">
        {emptyMessage ?? "No mappable records for current filters."}
      </div>
    );
  }

  return (
    <LeafletMap
      points={points}
      lines={lines}
      selectedPointId={selectedPointId}
      onSelectPoint={onSelectPoint}
    />
  );
}
