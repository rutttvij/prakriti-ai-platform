import type { MonitoringStatus } from "@/types/monitoring";

const ORDER: MonitoringStatus[] = ["OPEN", "ACKNOWLEDGED", "ESCALATED", "RESOLVED"];

export function ExceptionStatusTimeline({ status }: { status: MonitoringStatus }) {
  const activeIndex = ORDER.indexOf(status);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="mb-2 text-sm font-semibold text-slate-900">Status Timeline</p>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((step, index) => (
          <span
            key={step}
            className={`rounded-full px-2 py-1 text-xs ${index <= activeIndex ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
