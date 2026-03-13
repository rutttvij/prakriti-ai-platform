import Link from "next/link";

import { Button } from "@/components/ui/button";

interface RowActionsProps<T> {
  row: T;
  viewHref?: string;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
}

export function RowActions<T>({ row, viewHref, onView, onEdit }: RowActionsProps<T>) {
  return (
    <div className="inline-flex gap-2">
      {viewHref ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={viewHref}>View</Link>
        </Button>
      ) : onView ? (
        <Button variant="outline" size="sm" onClick={() => onView(row)}>
          View
        </Button>
      ) : null}
      {onEdit ? (
        <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
          Edit
        </Button>
      ) : null}
    </div>
  );
}
