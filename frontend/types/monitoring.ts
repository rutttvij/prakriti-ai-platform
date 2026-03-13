import type { Uuid } from "@/types/api";

export type MonitoringSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MonitoringStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "ESCALATED";

export type MonitoringEntityType =
  | "PICKUP_TASK"
  | "TRANSFER"
  | "FACILITY_RECEIPT"
  | "RECOVERY_CERTIFICATE"
  | "CARBON_LEDGER"
  | "BULK_GENERATOR"
  | "WORKER"
  | "VEHICLE"
  | "FACILITY"
  | "ROUTE";

export interface MonitoringBaseItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: MonitoringSeverity;
  status: MonitoringStatus;
  created_at: string;
  related_entity_type: MonitoringEntityType;
  related_entity_id: Uuid;
  related_entity_label: string;
  city_id?: Uuid | null;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  assigned_owner_id?: Uuid | null;
  recommended_action?: string;
  href: string;
}

export interface AlertItem extends MonitoringBaseItem {
  category: "OPERATIONS" | "COMPLIANCE" | "VERIFICATION";
}

export interface ExceptionItem extends MonitoringBaseItem {
  exception_code: string;
  exception_group: "TASK" | "TRANSFER" | "FACILITY" | "COMPLIANCE" | "CARBON" | "ASSET";
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: MonitoringSeverity;
  created_at: string;
  related_entity_type: MonitoringEntityType;
  related_entity_id: Uuid;
  href: string;
}

export interface MonitoringFilters {
  type?: string;
  severity?: MonitoringSeverity | "all";
  status?: MonitoringStatus | "all";
  city_id?: string;
  ward_id?: string;
  zone_id?: string;
  assigned_owner_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface MonitoringDataBundle {
  alerts: AlertItem[];
  exceptions: ExceptionItem[];
  notifications: NotificationItem[];
}

export interface MonitoringFetchParams {
  city_id?: string;
  ward_id?: string;
  zone_id?: string;
}
