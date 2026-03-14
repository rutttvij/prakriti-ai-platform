import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({
  title = "Loading records",
  description = "Fetching latest data from the service.",
}: LoadingStateProps) {
  return (
    <div className="surface-card animate-rise-fade flex flex-col items-center justify-center p-10 text-center">
      <Loader2 className="mb-3 h-7 w-7 animate-spin text-[var(--brand-600)]" />
      <h3 className="heading-font text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
    </div>
  );
}
