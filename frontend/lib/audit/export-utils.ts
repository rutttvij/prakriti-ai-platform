import type { AuditExportFormat } from "@/types/audit";

export function convertToCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replaceAll("\"", "\"\"")}"`;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  }
  return lines.join("\n");
}

export function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function flattenObject(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenObject(item));
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [{ value }];
}

export function exportPayload(payload: unknown, format: AuditExportFormat, fileNameBase: string) {
  if (format === "PDF") {
    throw new Error("PDF export is not available yet. Use JSON or CSV for now.");
  }

  if (format === "JSON") {
    const content = JSON.stringify(payload, null, 2);
    triggerDownload(content, `${fileNameBase}.json`, "application/json");
    return;
  }

  const rows = flattenObject(payload);
  const csv = convertToCsv(rows);
  triggerDownload(csv, `${fileNameBase}.csv`, "text/csv;charset=utf-8;");
}
