import type { AlertItem, ExceptionItem, MonitoringBaseItem, MonitoringFilters, MonitoringStatus } from "@/types/monitoring";

export function normalizeDate(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hoursSince(dateValue: string): number {
  const then = normalizeDate(dateValue);
  if (!then) return 0;
  return Math.max(0, (Date.now() - then) / (1000 * 60 * 60));
}

export function daysBetween(dateIso: string): number {
  const parsed = Date.parse(dateIso);
  if (!Number.isFinite(parsed)) return 0;
  const start = new Date(parsed);
  const today = new Date();
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
}

function isInDateRange(createdAt: string, from?: string, to?: string): boolean {
  const value = normalizeDate(createdAt);
  if (!value) return false;

  if (from) {
    const fromValue = normalizeDate(from);
    if (fromValue && value < fromValue) return false;
  }
  if (to) {
    const toValue = normalizeDate(`${to}T23:59:59Z`);
    if (toValue && value > toValue) return false;
  }
  return true;
}

export function applyMonitoringFilters<T extends MonitoringBaseItem>(items: T[], filters: MonitoringFilters): T[] {
  return items.filter((item) => {
    if (filters.type && filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.severity && filters.severity !== "all" && item.severity !== filters.severity) return false;
    if (filters.status && filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.city_id && filters.city_id !== "all" && item.city_id !== filters.city_id) return false;
    if (filters.ward_id && filters.ward_id !== "all" && item.ward_id !== filters.ward_id) return false;
    if (filters.zone_id && filters.zone_id !== "all" && item.zone_id !== filters.zone_id) return false;
    if (filters.assigned_owner_id && filters.assigned_owner_id !== "all" && item.assigned_owner_id !== filters.assigned_owner_id) return false;
    if ((filters.date_from || filters.date_to) && !isInDateRange(item.created_at, filters.date_from, filters.date_to)) return false;
    return true;
  });
}

export function sortByLatest<T extends { created_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => normalizeDate(b.created_at) - normalizeDate(a.created_at));
}

export function withStatusOverrides<T extends AlertItem | ExceptionItem>(items: T[], overrides: Record<string, MonitoringStatus>): T[] {
  return items.map((item) => ({ ...item, status: overrides[item.id] ?? item.status }));
}
