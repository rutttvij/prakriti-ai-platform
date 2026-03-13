import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 md:grid-cols-2", className)}>{children}</div>;
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}
