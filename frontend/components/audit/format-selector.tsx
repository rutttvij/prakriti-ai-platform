import { FormSelectField } from "@/components/forms/form-fields";
import type { AuditExportFormat } from "@/types/audit";

const options = [
  { label: "JSON", value: "JSON" },
  { label: "CSV", value: "CSV" },
  { label: "PDF (Coming Soon)", value: "PDF" },
];

export function FormatSelector({ value, onChange }: { value: AuditExportFormat; onChange: (value: AuditExportFormat) => void }) {
  return <FormSelectField label="Export Format" value={value} onChange={(next) => onChange(next as AuditExportFormat)} options={options} />;
}
