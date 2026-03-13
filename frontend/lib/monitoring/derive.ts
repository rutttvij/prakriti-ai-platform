import type { MonitoringDataBundle, AlertItem, ExceptionItem, NotificationItem } from "@/types/monitoring";

import type { MonitoringRawData } from "@/lib/monitoring/service";
import { daysBetween, hoursSince, sortByLatest } from "@/lib/monitoring/utils";

function isPending(value: string | null | undefined): boolean {
  if (!value) return false;
  return ["PENDING", "UNDER_REVIEW", "IN_REVIEW", "DRAFT"].includes(value.toUpperCase());
}

function isRejected(value: string | null | undefined): boolean {
  if (!value) return false;
  return ["REJECTED", "FAILED", "INVALID"].includes(value.toUpperCase());
}

function buildExceptions(alerts: AlertItem[]): ExceptionItem[] {
  return alerts
    .filter((alert) => alert.severity === "HIGH" || alert.severity === "CRITICAL" || alert.category === "VERIFICATION")
    .map((alert) => ({
      id: `exception:${alert.id}`,
      type: alert.type,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: "OPEN",
      created_at: alert.created_at,
      related_entity_type: alert.related_entity_type,
      related_entity_id: alert.related_entity_id,
      related_entity_label: alert.related_entity_label,
      city_id: alert.city_id,
      ward_id: alert.ward_id,
      zone_id: alert.zone_id,
      assigned_owner_id: alert.assigned_owner_id,
      recommended_action: alert.recommended_action,
      href: alert.href,
      exception_code: alert.type,
      exception_group:
        alert.related_entity_type === "PICKUP_TASK"
          ? "TASK"
          : alert.related_entity_type === "TRANSFER"
            ? "TRANSFER"
            : alert.related_entity_type === "FACILITY_RECEIPT" || alert.related_entity_type === "RECOVERY_CERTIFICATE" || alert.related_entity_type === "FACILITY"
              ? "FACILITY"
              : alert.related_entity_type === "BULK_GENERATOR"
                ? "COMPLIANCE"
                : alert.related_entity_type === "CARBON_LEDGER"
                  ? "CARBON"
                  : "ASSET",
    }));
}

function buildNotifications(alerts: AlertItem[], exceptions: ExceptionItem[]): NotificationItem[] {
  const alertNotifications: NotificationItem[] = alerts.map((alert) => ({
    id: `notification:alert:${alert.id}`,
    type: alert.type,
    title: alert.title,
    message: alert.description,
    severity: alert.severity,
    created_at: alert.created_at,
    related_entity_type: alert.related_entity_type,
    related_entity_id: alert.related_entity_id,
    href: alert.href,
  }));

  const exceptionNotifications: NotificationItem[] = exceptions.map((exception) => ({
    id: `notification:exception:${exception.id}`,
    type: exception.type,
    title: `Exception: ${exception.title}`,
    message: exception.description,
    severity: exception.severity,
    created_at: exception.created_at,
    related_entity_type: exception.related_entity_type,
    related_entity_id: exception.related_entity_id,
    href: `/exceptions/${encodeURIComponent(exception.id)}`,
  }));

  return sortByLatest([...alertNotifications, ...exceptionNotifications]).slice(0, 200);
}

export function deriveMonitoringData(raw: MonitoringRawData): MonitoringDataBundle {
  const alerts: AlertItem[] = [];

  for (const task of raw.pickupTasks) {
    if (task.pickup_status === "MISSED") {
      alerts.push({
        id: `alert:missed-pickup:${task.id}`,
        type: "MISSED_PICKUP",
        title: "Missed pickup detected",
        description: `Task ${task.id} is marked MISSED and requires route follow-up.`,
        severity: "HIGH",
        status: "OPEN",
        created_at: task.updated_at,
        related_entity_type: "PICKUP_TASK",
        related_entity_id: task.id,
        related_entity_label: task.id,
        city_id: task.city_id,
        ward_id: task.ward_id,
        zone_id: task.zone_id,
        assigned_owner_id: task.assigned_worker_id,
        recommended_action: "Review reason and schedule corrective pickup.",
        href: `/pickup-tasks/${task.id}`,
        category: "OPERATIONS",
      });
      continue;
    }

    if (["PENDING", "IN_PROGRESS"].includes(task.pickup_status)) {
      const overdueDays = daysBetween(task.scheduled_date);
      if (overdueDays > 0) {
        alerts.push({
          id: `alert:overdue-pickup:${task.id}`,
          type: "OVERDUE_PICKUP_TASK",
          title: "Overdue pickup task",
          description: `Task ${task.id} is overdue by ${overdueDays} day(s).`,
          severity: overdueDays > 2 ? "HIGH" : "MEDIUM",
          status: "OPEN",
          created_at: task.updated_at,
          related_entity_type: "PICKUP_TASK",
          related_entity_id: task.id,
          related_entity_label: task.id,
          city_id: task.city_id,
          ward_id: task.ward_id,
          zone_id: task.zone_id,
          assigned_owner_id: task.assigned_worker_id,
          recommended_action: "Escalate to supervisor and re-prioritize task queue.",
          href: `/pickup-tasks/${task.id}`,
          category: "OPERATIONS",
        });
      }
    }
  }

  for (const transfer of raw.transferRows) {
    if (transfer.transfer_status === "RECEIVED") continue;
    const ageHours = hoursSince(transfer.dispatched_at);
    if (ageHours < 24) continue;

    alerts.push({
      id: `alert:delayed-transfer:${transfer.transfer_id}`,
      type: "DELAYED_TRANSFER",
      title: "Delayed transfer receipt",
      description: `Transfer ${transfer.transfer_id} is pending receipt for ${Math.floor(ageHours)} hour(s).`,
      severity: ageHours > 72 ? "CRITICAL" : "HIGH",
      status: "OPEN",
      created_at: transfer.dispatched_at,
      related_entity_type: "TRANSFER",
      related_entity_id: transfer.transfer_id,
      related_entity_label: transfer.transfer_id,
      city_id: transfer.city_id,
      ward_id: transfer.ward_id,
      zone_id: null,
      recommended_action: "Contact facility and transport team to confirm handoff status.",
      href: `/transfers/${transfer.transfer_id}`,
      category: "OPERATIONS",
    });
  }

  const facilitiesById = new Map(raw.facilities.map((item) => [item.id, item]));

  for (const receipt of raw.facilityReceipts) {
    if (!isRejected(receipt.verification_status)) continue;
    const facility = facilitiesById.get(receipt.facility_id);

    alerts.push({
      id: `alert:receipt-rejected:${receipt.id}`,
      type: "REJECTED_FACILITY_RECEIPT",
      title: "Facility receipt rejected",
      description: `Receipt ${receipt.id} has verification status ${receipt.verification_status}.`,
      severity: "HIGH",
      status: "OPEN",
      created_at: receipt.updated_at,
      related_entity_type: "FACILITY_RECEIPT",
      related_entity_id: receipt.id,
      related_entity_label: receipt.id,
      city_id: facility?.city_id,
      ward_id: facility?.ward_id,
      zone_id: facility?.zone_id,
      assigned_owner_id: receipt.received_by_user_id,
      recommended_action: "Review receipt documentation and resubmit verification evidence.",
      href: `/facility-receipts`,
      category: "VERIFICATION",
    });
  }

  for (const cert of raw.recoveryCertificates) {
    if (!isPending(cert.verification_status)) continue;
    const facility = facilitiesById.get(cert.facility_id);

    alerts.push({
      id: `alert:recovery-pending:${cert.id}`,
      type: "PENDING_RECOVERY_CERTIFICATE",
      title: "Recovery certificate pending",
      description: `Certificate ${cert.certificate_number} is pending verification.`,
      severity: "MEDIUM",
      status: "OPEN",
      created_at: cert.updated_at,
      related_entity_type: "RECOVERY_CERTIFICATE",
      related_entity_id: cert.id,
      related_entity_label: cert.certificate_number,
      city_id: facility?.city_id,
      ward_id: facility?.ward_id,
      zone_id: facility?.zone_id,
      assigned_owner_id: cert.issued_by_user_id,
      recommended_action: "Complete verification and publish certificate outcome.",
      href: `/recovery-certificates`,
      category: "VERIFICATION",
    });
  }

  for (const entry of raw.carbonLedgerEntries) {
    if (!isPending(entry.verification_status)) continue;

    alerts.push({
      id: `alert:carbon-verification:${entry.id}`,
      type: "PENDING_CARBON_VERIFICATION",
      title: "Carbon ledger entry pending verification",
      description: `Carbon ledger entry ${entry.ledger_entry_code} awaits verification.`,
      severity: "MEDIUM",
      status: "OPEN",
      created_at: entry.updated_at,
      related_entity_type: "CARBON_LEDGER",
      related_entity_id: entry.id,
      related_entity_label: entry.ledger_entry_code,
      city_id: entry.city_id,
      ward_id: entry.ward_id,
      zone_id: null,
      recommended_action: "Assign auditor and resolve verification backlog.",
      href: `/carbon-ledger`,
      category: "VERIFICATION",
    });
  }

  for (const generator of raw.bulkGenerators) {
    const compliance = generator.compliance_status?.toUpperCase() ?? "";
    if (!["NON_COMPLIANT", "UNDER_REVIEW", "REJECTED"].includes(compliance)) continue;

    alerts.push({
      id: `alert:generator-compliance:${generator.id}`,
      type: "COMPLIANCE_RISK_BULK_GENERATOR",
      title: "Bulk generator compliance risk",
      description: `${generator.entity_name} has compliance status ${generator.compliance_status}.`,
      severity: compliance === "NON_COMPLIANT" ? "HIGH" : "MEDIUM",
      status: "OPEN",
      created_at: generator.updated_at,
      related_entity_type: "BULK_GENERATOR",
      related_entity_id: generator.id,
      related_entity_label: generator.entity_name,
      city_id: generator.city_id,
      ward_id: generator.ward_id,
      zone_id: generator.zone_id,
      recommended_action: "Initiate compliance outreach and corrective inspection.",
      href: `/bulk-generators/${generator.id}`,
      category: "COMPLIANCE",
    });
  }

  for (const worker of raw.workers) {
    const inactive = !worker.is_active || worker.employment_status !== "ACTIVE";
    if (!inactive) continue;

    alerts.push({
      id: `alert:worker-inactive:${worker.id}`,
      type: "INACTIVE_WORKER",
      title: "Inactive or blocked worker profile",
      description: `Worker ${worker.employee_code} is ${worker.employment_status}.`,
      severity: "MEDIUM",
      status: "OPEN",
      created_at: worker.updated_at,
      related_entity_type: "WORKER",
      related_entity_id: worker.id,
      related_entity_label: worker.employee_code,
      city_id: worker.city_id,
      ward_id: worker.ward_id,
      zone_id: worker.zone_id,
      assigned_owner_id: worker.user_id,
      recommended_action: "Review assignment load and workforce availability.",
      href: `/workers/${worker.id}`,
      category: "OPERATIONS",
    });
  }

  for (const vehicle of raw.vehicles) {
    if (vehicle.is_active) continue;

    alerts.push({
      id: `alert:vehicle-inactive:${vehicle.id}`,
      type: "INACTIVE_VEHICLE",
      title: "Inactive vehicle detected",
      description: `Vehicle ${vehicle.registration_number} is inactive and unavailable for routing.`,
      severity: "MEDIUM",
      status: "OPEN",
      created_at: vehicle.updated_at,
      related_entity_type: "VEHICLE",
      related_entity_id: vehicle.id,
      related_entity_label: vehicle.registration_number,
      city_id: vehicle.city_id,
      ward_id: vehicle.ward_id,
      zone_id: vehicle.zone_id,
      recommended_action: "Validate fleet readiness and reassign tasks.",
      href: `/vehicles`,
      category: "OPERATIONS",
    });
  }

  const sortedAlerts = sortByLatest(alerts);
  const exceptions = sortByLatest(buildExceptions(sortedAlerts));
  const notifications = buildNotifications(sortedAlerts, exceptions);

  return {
    alerts: sortedAlerts,
    exceptions,
    notifications,
  };
}
