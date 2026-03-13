import type { Uuid } from "@/types/api";

export type MapEntityKind = "HOUSEHOLD" | "BULK_GENERATOR" | "FACILITY" | "ROUTE_STOP";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  kind: MapEntityKind;
  city_id?: Uuid | null;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  source_type?: string | null;
  tags?: string[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface MapLegendItem {
  label: string;
  color: string;
}

export interface MapLine {
  id: string;
  label?: string;
  points: Array<[number, number]>;
  color?: string;
}
