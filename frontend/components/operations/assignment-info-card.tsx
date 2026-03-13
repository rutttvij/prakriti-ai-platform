import { EntityDetailsCard } from "@/components/crud/entity-details-card";

export function AssignmentInfoCard({
  workerId,
  vehicleId,
  routeId,
  shiftId,
  routeStopId,
}: {
  workerId?: string | null;
  vehicleId?: string | null;
  routeId?: string | null;
  shiftId?: string | null;
  routeStopId?: string | null;
}) {
  return (
    <EntityDetailsCard
      title="Assignment"
      items={[
        { label: "Worker ID", value: workerId ?? "-" },
        { label: "Vehicle ID", value: vehicleId ?? "-" },
        { label: "Route ID", value: routeId ?? "-" },
        { label: "Route Stop ID", value: routeStopId ?? "-" },
        { label: "Shift ID", value: shiftId ?? "-" },
      ]}
    />
  );
}
