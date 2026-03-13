"use client";

import { useCallback, useMemo, useState } from "react";

import type { ExportHistoryRecord } from "@/types/audit";

const STORAGE_KEY = "prakriti_audit_export_history";

function readHistory(): ExportHistoryRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ExportHistoryRecord[] : [];
  } catch {
    return [];
  }
}

export function useExportHistory() {
  const [history, setHistory] = useState<ExportHistoryRecord[]>(() => readHistory());

  const save = useCallback((items: ExportHistoryRecord[]) => {
    setHistory(items);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, []);

  const addRecord = useCallback((record: ExportHistoryRecord) => {
    save([record, ...history].slice(0, 200));
  }, [history, save]);

  return {
    records: useMemo(() => [...history], [history]),
    addRecord,
  };
}
