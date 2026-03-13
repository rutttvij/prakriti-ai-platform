"use client";

import { useCallback, useEffect, useState } from "react";

import type { MonitoringStatus } from "@/types/monitoring";

function storageKey(scope: "alerts" | "exceptions") {
  return `prakriti_issue_status_${scope}`;
}

function readStatus(scope: "alerts" | "exceptions"): Record<string, MonitoringStatus> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(storageKey(scope));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, MonitoringStatus>) : {};
  } catch {
    return {};
  }
}

export function useIssueStatusState(scope: "alerts" | "exceptions") {
  const [statusMap, setStatusMap] = useState<Record<string, MonitoringStatus>>({});

  useEffect(() => {
    setStatusMap(readStatus(scope));
  }, [scope]);

  const updateStatus = useCallback((id: string, status: MonitoringStatus) => {
    setStatusMap((prev) => {
      const next = { ...prev, [id]: status };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(scope), JSON.stringify(next));
      }
      return next;
    });
  }, [scope]);

  return {
    statusMap,
    acknowledge: (id: string) => updateStatus(id, "ACKNOWLEDGED"),
    resolve: (id: string) => updateStatus(id, "RESOLVED"),
    escalate: (id: string) => updateStatus(id, "ESCALATED"),
  };
}
