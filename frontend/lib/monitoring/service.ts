import {
  getTransferReport,
  listBulkGenerators,
  listCarbonLedger,
  listFacilities,
  listFacilityReceipts,
  listPickupTasks,
  listRecoveryCertificates,
  listVehicles,
  listWorkers,
} from "@/lib/api/services";
import type { BulkGenerator, CarbonLedgerEntry, Facility, FacilityReceipt, PickupTask, RecoveryCertificate, Vehicle, Worker } from "@/types/domain";
import type { TransferReportPage } from "@/types/reporting";
import type { MonitoringFetchParams } from "@/types/monitoring";

export interface MonitoringRawData {
  pickupTasks: PickupTask[];
  transferRows: TransferReportPage["rows"];
  facilityReceipts: FacilityReceipt[];
  recoveryCertificates: RecoveryCertificate[];
  carbonLedgerEntries: CarbonLedgerEntry[];
  bulkGenerators: BulkGenerator[];
  workers: Worker[];
  vehicles: Vehicle[];
  facilities: Facility[];
}

async function safeList<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export async function fetchMonitoringRawData(params: MonitoringFetchParams): Promise<MonitoringRawData> {
  const locationParams = {
    city_id: params.city_id,
    ward_id: params.ward_id,
    zone_id: params.zone_id,
  };

  const [
    pickupTasks,
    transferReport,
    facilityReceipts,
    recoveryCertificates,
    carbonLedgerEntries,
    bulkGenerators,
    workers,
    vehicles,
    facilities,
  ] = await Promise.all([
    safeList(listPickupTasks(locationParams), []),
    safeList(getTransferReport(locationParams), { meta: { total_count: 0, limit: 0, offset: 0, applied_filters: {} }, summary: { total_transfers: 0, received_transfers: 0, total_dispatched_weight_kg: 0, total_received_weight_kg: 0 }, rows: [] }),
    safeList(listFacilityReceipts(), []),
    safeList(listRecoveryCertificates(), []),
    safeList(listCarbonLedger({ city_id: params.city_id, ward_id: params.ward_id }), []),
    safeList(listBulkGenerators(locationParams), []),
    safeList(listWorkers(locationParams), []),
    safeList(listVehicles(locationParams), []),
    safeList(listFacilities(locationParams), []),
  ]);

  return {
    pickupTasks,
    transferRows: transferReport.rows,
    facilityReceipts,
    recoveryCertificates,
    carbonLedgerEntries,
    bulkGenerators,
    workers,
    vehicles,
    facilities,
  };
}
