"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

import { MarkerPopupCard } from "@/components/maps/marker-popup-card";
import type { MapLine, MapPoint } from "@/types/maps";

import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LeafletMapProps {
  points: MapPoint[];
  lines: MapLine[];
  selectedPointId?: string | null;
  onSelectPoint?: (pointId: string) => void;
}

function getCenter(points: MapPoint[]): [number, number] {
  if (!points.length) return DEFAULT_CENTER;
  const [first] = points;
  return [first.lat, first.lng];
}

function getMarkerByKind(kind: MapPoint["kind"]) {
  if (kind === "HOUSEHOLD") return "#2563eb";
  if (kind === "BULK_GENERATOR") return "#f59e0b";
  if (kind === "FACILITY") return "#7c3aed";
  return "#0f766e";
}

function getDivIcon(point: MapPoint, isSelected: boolean) {
  const color = getMarkerByKind(point.kind);
  const size = isSelected ? 18 : 14;

  return L.divIcon({
    className: "",
    html: `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function LeafletMap({ points, lines, selectedPointId, onSelectPoint }: LeafletMapProps) {
  const center = useMemo(() => getCenter(points), [points]);

  return (
    <MapContainer center={center} zoom={13} className="h-[460px] w-full rounded-md border border-slate-200">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {lines.map((line) => (
        <Polyline
          key={line.id}
          pathOptions={{ color: line.color ?? "#0f766e", weight: 4, opacity: 0.8 }}
          positions={line.points as LatLngExpression[]}
        />
      ))}

      {points.map((point) => {
        const isSelected = selectedPointId === point.id;
        return (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={getDivIcon(point, Boolean(isSelected))}
            eventHandlers={{
              click: () => onSelectPoint?.(point.id),
            }}
          >
            <Popup>
              <MarkerPopupCard point={point} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
