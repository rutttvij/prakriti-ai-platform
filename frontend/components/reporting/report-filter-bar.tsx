import type { ReactNode } from "react";

import { FilterBar } from "@/components/ui-extensions/filter-bar";

export function ReportFilterBar({ children, onReset }: { children: ReactNode; onReset: () => void }) {
  return <FilterBar onReset={onReset}>{children}</FilterBar>;
}
