interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p> : null}
      <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm text-slate-600 md:text-base">{description}</p> : null}
    </div>
  );
}
