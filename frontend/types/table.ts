import type { ReactNode } from "react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}
