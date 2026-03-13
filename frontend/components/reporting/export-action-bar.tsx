import { Button } from "@/components/ui/button";

export interface ExportAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ExportActionBar({ actions }: { actions: ExportAction[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button key={action.label} variant="outline" onClick={action.onClick} disabled={action.disabled || action.isLoading}>
          {action.isLoading ? `${action.label}...` : action.label}
        </Button>
      ))}
    </div>
  );
}
