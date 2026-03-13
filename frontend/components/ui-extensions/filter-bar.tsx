import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FilterBarProps {
  children: ReactNode;
  onReset?: () => void;
}

export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
        {onReset ? (
          <div>
            <Button variant="outline" size="sm" onClick={onReset}>
              Clear Filters
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
