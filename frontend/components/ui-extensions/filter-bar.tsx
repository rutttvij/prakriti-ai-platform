import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface FilterBarProps {
  children: ReactNode;
  onReset?: () => void;
}

export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div className="filter-strip animate-rise-fade p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      {onReset ? (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onReset}>
            Clear Filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
