import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-[rgba(58,135,102,0.46)] bg-[rgba(129,212,174,0.26)] text-[var(--brand-700)]",
        secondary: "border-[rgba(216,164,88,0.45)] bg-[rgba(245,188,96,0.22)] text-[rgb(125,74,19)]",
        destructive: "border-[rgba(204,96,96,0.45)] bg-[rgba(228,117,117,0.2)] text-[rgb(125,39,39)]",
        outline: "border-[var(--soft-border)] bg-[rgba(226,244,233,0.35)] text-[var(--ink-700)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
