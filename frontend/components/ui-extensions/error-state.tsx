import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Unable to load records", description, onRetry }: ErrorStateProps) {
  return (
    <div className="surface-card animate-rise-fade flex flex-col items-center justify-center p-10 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-[rgb(157,59,59)]" />
      <h3 className="heading-font text-base font-semibold text-[rgb(125,39,39)]">{title}</h3>
      <p className="mt-1 text-sm text-[rgb(125,39,39)]">{description}</p>
      {onRetry ? (
        <Button className="mt-4" variant="primary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
