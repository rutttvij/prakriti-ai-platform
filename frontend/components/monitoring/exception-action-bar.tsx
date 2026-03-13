import { Button } from "@/components/ui/button";

interface ExceptionActionBarProps {
  onAcknowledge: () => void;
  onResolve: () => void;
  onEscalate: () => void;
  disabled?: boolean;
}

export function ExceptionActionBar({ onAcknowledge, onResolve, onEscalate, disabled }: ExceptionActionBarProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-3">
      <Button variant="outline" onClick={onAcknowledge} disabled={disabled}>Acknowledge</Button>
      <Button onClick={onResolve} disabled={disabled}>Resolve</Button>
      <Button variant="destructive" onClick={onEscalate} disabled={disabled}>Escalate</Button>
    </div>
  );
}
