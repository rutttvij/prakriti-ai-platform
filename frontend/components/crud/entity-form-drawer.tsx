"use client";

import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface EntityFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  mode: "create" | "edit";
  isSubmitting?: boolean;
  onSubmit?: () => void;
  children: ReactNode;
}

export function EntityFormDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  mode,
  isSubmitting = false,
  onSubmit,
  children,
}: EntityFormDrawerProps) {
  const readonlyEdit = mode === "edit";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[95vw] overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </SheetHeader>

        {readonlyEdit ? (
          <Alert className="mt-4">
            <AlertTitle>Edit API Pending</AlertTitle>
            <AlertDescription>
              Update endpoints are not available yet in backend. This form is shown in read-only mode.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4 space-y-4">{children}</div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={onSubmit}
            disabled={readonlyEdit || isSubmitting}
          >
            {readonlyEdit ? "Save Disabled" : isSubmitting ? "Saving..." : "Create"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
