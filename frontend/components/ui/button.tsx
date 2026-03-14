import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(179,238,210,0.7)]",
  {
    variants: {
      variant: {
        primary: "btn-primary",
        secondary: "btn-secondary",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type LegacyVariant = "default" | "destructive" | "outline" | "secondary" | "ghost";
type ButtonVariant = "primary" | "secondary" | LegacyVariant;

function mapVariant(variant?: ButtonVariant): "primary" | "secondary" {
  if (variant === "secondary" || variant === "outline" || variant === "ghost") return "secondary";
  return "primary";
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  Omit<VariantProps<typeof buttonVariants>, "variant"> & {
    variant?: ButtonVariant;
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant: mapVariant(variant), size, className }))} {...props} />;
}

export { Button, buttonVariants };
