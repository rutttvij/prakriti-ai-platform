import { Button } from "@/components/ui/button";

export function TaskActionBar({
  onStart,
  onComplete,
  onMiss,
  disableStart,
  disableComplete,
  disableMiss,
  loading,
}: {
  onStart: () => void;
  onComplete: () => void;
  onMiss: () => void;
  disableStart?: boolean;
  disableComplete?: boolean;
  disableMiss?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onStart} disabled={loading || disableStart}>
        Start Task
      </Button>
      <Button onClick={onComplete} disabled={loading || disableComplete}>
        Complete Task
      </Button>
      <Button variant="destructive" onClick={onMiss} disabled={loading || disableMiss}>
        Mark Missed
      </Button>
    </div>
  );
}
