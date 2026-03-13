import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Unable to load records", description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-10 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-red-600" />
      <h3 className="text-base font-semibold text-red-700">{title}</h3>
      <p className="mt-1 text-sm text-red-700">{description}</p>
      {onRetry ? (
        <Button className="mt-4" variant="destructive" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
