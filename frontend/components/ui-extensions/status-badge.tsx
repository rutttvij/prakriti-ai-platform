import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";

interface StatusBadgeProps {
  value: string | null | undefined;
}

const positive = new Set(["ACTIVE", "COMPLETED", "VERIFIED", "COMPLIANT", "GENERATED"]);
const warning = new Set(["PENDING", "IN_PROGRESS", "UNDER_REVIEW", "INACTIVE", "MISSED"]);
const destructive = new Set(["REJECTED", "NON_COMPLIANT", "CANCELLED", "TERMINATED"]);

export function StatusBadge({ value }: StatusBadgeProps) {
  if (!value) {
    return <Badge variant="secondary">-</Badge>;
  }

  const normalized = value.toUpperCase();

  if (positive.has(normalized)) {
    return <Badge>{toTitleCase(value)}</Badge>;
  }

  if (warning.has(normalized)) {
    return <Badge variant="secondary">{toTitleCase(value)}</Badge>;
  }

  if (destructive.has(normalized)) {
    return <Badge variant="destructive">{toTitleCase(value)}</Badge>;
  }

  return <Badge variant="outline">{toTitleCase(value)}</Badge>;
}
