import { deriveMonitoringData } from "@/lib/monitoring/derive";
import { fetchMonitoringRawData } from "@/lib/monitoring/service";
import type { MonitoringFetchParams } from "@/types/monitoring";

export async function getMonitoringData(params: MonitoringFetchParams) {
  const raw = await fetchMonitoringRawData(params);
  return deriveMonitoringData(raw);
}
