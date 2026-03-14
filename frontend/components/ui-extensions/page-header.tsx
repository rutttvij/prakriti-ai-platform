import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="surface-card-strong animate-rise-fade flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <div>
        <p className="micro-label">Operations Console</p>
        <h1 className="heading-font text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
