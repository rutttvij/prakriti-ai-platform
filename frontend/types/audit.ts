import type {
  Batch,
  BulkGenerator,
  CarbonEvent,
  CarbonLedgerEntry,
  CarbonVerification,
  EnvironmentalSummary,
  Facility,
  FacilityReceipt,
  LandfillRecord,
  PickupTask,
  ProcessingRecord,
  RecoveryCertificate,
  Transfer,
} from "@/types/domain";

export type AuditExportFormat = "JSON" | "CSV" | "PDF";

export interface BatchLifecycleAuditExport {
  batch: Batch;
  transfers: Transfer[];
  facility_receipts: FacilityReceipt[];
  processing_records: ProcessingRecord[];
  landfill_records: LandfillRecord[];
  recovery_certificates: RecoveryCertificate[];
  carbon_events: CarbonEvent[];
  carbon_ledger_entries: CarbonLedgerEntry[];
  generated_at: string;
}

export interface BulkGeneratorLifecycleAuditExport {
  generator: BulkGenerator;
  pickup_tasks: PickupTask[];
  recovery_certificates: RecoveryCertificate[];
  carbon_events: CarbonEvent[];
  carbon_ledger_entries: CarbonLedgerEntry[];
  generated_at: string;
}

export interface CarbonEventLifecycleAuditExport {
  carbon_event: CarbonEvent;
  batch: Batch | null;
  facility: Facility | null;
  processing_record: ProcessingRecord | null;
  landfill_record: LandfillRecord | null;
  recovery_certificate: RecoveryCertificate | null;
  ledger_entries: CarbonLedgerEntry[];
  verifications: CarbonVerification[];
  related_environmental_summaries: EnvironmentalSummary[];
  generated_at: string;
}

export interface ExportHistoryRecord {
  id: string;
  export_type: "BATCH" | "GENERATOR" | "CARBON";
  format: AuditExportFormat;
  generated_by: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  download_link: string | null;
  reference_id: string;
}
