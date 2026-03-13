import { Button } from "@/components/ui/button";

interface ExportActionBarProps {
  onExport: () => void;
  onPreview?: () => void;
  exportLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ExportActionBar({ onExport, onPreview, exportLabel = "Export", disabled, isLoading }: ExportActionBarProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-3">
      {onPreview ? <Button variant="outline" onClick={onPreview} disabled={disabled}>Refresh Preview</Button> : null}
      <Button onClick={onExport} disabled={disabled || isLoading}>{isLoading ? "Exporting..." : exportLabel}</Button>
    </div>
  );
}
