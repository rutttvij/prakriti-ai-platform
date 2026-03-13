"use client";

import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY = "prakriti_notifications_read_ids";

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function useNotificationReadState() {
  const [readIds, setReadIds] = useState<string[]>(() => readStorage());

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  const persist = useCallback((next: string[]) => {
    setReadIds(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const markRead = useCallback((id: string) => {
    if (readSet.has(id)) return;
    persist([...readIds, id]);
  }, [persist, readIds, readSet]);

  const markAllRead = useCallback((ids: string[]) => {
    const next = Array.from(new Set([...readIds, ...ids]));
    persist(next);
  }, [persist, readIds]);

  return {
    isRead: (id: string) => readSet.has(id),
    markRead,
    markAllRead,
    readCount: readIds.length,
  };
}
