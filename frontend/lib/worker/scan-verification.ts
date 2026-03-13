import type { BulkGenerator, Household, PickupTask } from "@/types/domain";

export interface TaskSourceContext {
  task: PickupTask;
  household?: Household | null;
  bulkGenerator?: BulkGenerator | null;
}

export interface ScanVerificationResult {
  matched: boolean;
  reason: "MATCH" | "MISMATCH" | "INVALID";
  message: string;
  scannedValue: string;
}

function normalizeValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

function safeJsonParse(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function getFromRecord(record: Record<string, unknown>, keys: string[]): string[] {
  const values: string[] = [];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") values.push(value);
  }
  return values;
}

function extractTokensFromScan(raw: string): Set<string> {
  const tokens = new Set<string>();
  const trimmed = raw.trim();
  if (!trimmed) return tokens;

  tokens.add(normalizeValue(trimmed));

  const json = safeJsonParse(trimmed);
  if (json) {
    const jsonTokens = getFromRecord(json, [
      "code",
      "qr_code",
      "qrCode",
      "qr_tag_id",
      "qrTagId",
      "source_id",
      "sourceId",
      "entity_id",
      "entityId",
      "household_id",
      "bulk_generator_id",
      "household_code",
      "generator_code",
    ]);
    jsonTokens.forEach((item) => tokens.add(normalizeValue(item)));
  }

  try {
    const url = new URL(trimmed);
    const queryValues = [
      "code",
      "qr",
      "qr_code",
      "qr_tag_id",
      "source_id",
      "entity_id",
      "household_id",
      "bulk_generator_id",
      "household_code",
      "generator_code",
    ]
      .map((key) => url.searchParams.get(key))
      .filter((value): value is string => Boolean(value));
    queryValues.forEach((item) => tokens.add(normalizeValue(item)));

    const pathnameParts = url.pathname.split("/").map((part) => part.trim()).filter(Boolean);
    pathnameParts.forEach((part) => tokens.add(normalizeValue(part)));
  } catch {
    // Non-URL payload. Continue with delimiter tokenization.
  }

  const splitTokens = trimmed.split(/[:|,\s/]+/g).map((part) => part.trim()).filter(Boolean);
  splitTokens.forEach((item) => tokens.add(normalizeValue(item)));

  return tokens;
}

function getExpectedTokens(context: TaskSourceContext): Set<string> {
  const tokens = new Set<string>();
  const { task, household, bulkGenerator } = context;

  const add = (value: string | null | undefined) => {
    const normalized = normalizeValue(value);
    if (normalized) tokens.add(normalized);
  };

  add(task.id);
  add(task.household_id ?? undefined);
  add(task.bulk_generator_id ?? undefined);

  add(household?.id);
  add(household?.household_code);
  add(household?.qr_tag_id ?? undefined);

  add(bulkGenerator?.id);
  add(bulkGenerator?.generator_code);
  add(bulkGenerator?.qr_tag_id ?? undefined);

  return tokens;
}

export async function verifyTaskSourceScan(
  scannedValue: string,
  context: TaskSourceContext,
): Promise<ScanVerificationResult> {
  // Frontend-first verification. Backend API verification can be introduced here later
  // without changing calling components.
  const scannedTokens = extractTokensFromScan(scannedValue);
  const expectedTokens = getExpectedTokens(context);

  if (scannedTokens.size === 0) {
    return {
      matched: false,
      reason: "INVALID",
      message: "Scanned QR payload is empty or unreadable.",
      scannedValue,
    };
  }

  const hasMatch = Array.from(scannedTokens).some((token) => expectedTokens.has(token));
  if (hasMatch) {
    return {
      matched: true,
      reason: "MATCH",
      message: "QR code matched the assigned source.",
      scannedValue,
    };
  }

  return {
    matched: false,
    reason: "MISMATCH",
    message: "Scanned QR does not belong to this task source.",
    scannedValue,
  };
}
