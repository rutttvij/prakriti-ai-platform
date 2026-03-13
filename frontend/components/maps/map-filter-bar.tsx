import type { ReactNode } from "react";

import { FilterBar } from "@/components/ui-extensions/filter-bar";

export function MapFilterBar({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  return <FilterBar onReset={onReset}>{children}</FilterBar>;
}
