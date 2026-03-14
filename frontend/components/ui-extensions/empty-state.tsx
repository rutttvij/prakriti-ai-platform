import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="surface-card animate-rise-fade flex flex-col items-center justify-center p-10 text-center">
      <Inbox className="mb-3 h-8 w-8 text-ink-muted" />
      <h3 className="heading-font text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>
    </div>
  );
}
