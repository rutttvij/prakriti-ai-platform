import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeightSummaryCard({
  expectedWeightKg,
  actualWeightKg,
  dispatchedWeightKg,
  receivedWeightKg,
}: {
  expectedWeightKg?: number | null;
  actualWeightKg?: number | null;
  dispatchedWeightKg?: number | null;
  receivedWeightKg?: number | null;
}) {
  const variance =
    dispatchedWeightKg !== null &&
    dispatchedWeightKg !== undefined &&
    receivedWeightKg !== null &&
    receivedWeightKg !== undefined
      ? receivedWeightKg - dispatchedWeightKg
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weight Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Expected (kg)</p>
            <p className="mt-1 text-sm text-slate-800">{expectedWeightKg ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Actual (kg)</p>
            <p className="mt-1 text-sm text-slate-800">{actualWeightKg ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dispatched (kg)</p>
            <p className="mt-1 text-sm text-slate-800">{dispatchedWeightKg ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Received (kg)</p>
            <p className="mt-1 text-sm text-slate-800">{receivedWeightKg ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Variance (kg)</p>
            <p className="mt-1 text-sm text-slate-800">{variance ?? "-"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
