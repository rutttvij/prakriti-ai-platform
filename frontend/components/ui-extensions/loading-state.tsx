import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({ title = "Loading data", description = "Please wait while we fetch the latest records." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-10 text-center">
      <Loader2 className="mb-3 h-7 w-7 animate-spin text-emerald-600" />
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}
