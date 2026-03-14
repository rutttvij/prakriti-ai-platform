interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="micro-label">{eyebrow}</p> : null}
      <h2 className="heading-font text-2xl font-bold text-[var(--text-on-dark)] md:text-3xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm text-[var(--text-on-dark-muted)] md:text-base">{description}</p> : null}
    </div>
  );
}
