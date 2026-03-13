"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { MapCanvas } from "@/components/maps/map-canvas";
import { MapFilterBar } from "@/components/maps/map-filter-bar";
import { MapLegend } from "@/components/maps/map-legend";
import { MapSidePanel } from "@/components/maps/map-side-panel";
import { SelectedEntityCard } from "@/components/maps/selected-entity-card";
import { FormSelectField } from "@/components/forms/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { roleCodes } from "@/lib/auth/permissions";
import {
  listAddresses,
  listBulkGenerators,
  listCities,
  listHouseholds,
  listPickupTasks,
  listRouteStops,
  listRoutes,
  listWards,
  listZones,
} from "@/lib/api/services";
import { buildAddressCoordinateIndex, mapBulkGeneratorsToPoints, mapHouseholdsToPoints, mapRouteStopsToPoints } from "@/lib/maps/normalize";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/types/query-keys";

const ALL = "all";

export default function RouteMapsPage() {
  const user = useAuthStore((state) => state.user);

  const [cityId, setCityId] = useState(ALL);
  const [wardId, setWardId] = useState(ALL);
  const [zoneId, setZoneId] = useState(ALL);
  const [routeId, setRouteId] = useState(ALL);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const roleCodeList = roleCodes(user);
  const canReadAddresses = roleCodeList.includes("SUPER_ADMIN") || roleCodeList.includes("CITY_ADMIN") || roleCodeList.includes("WARD_OFFICER") || Boolean(user?.is_superuser);

  const routeParams = useMemo(
    () => ({
      city_id: cityId !== ALL ? cityId : undefined,
      ward_id: wardId !== ALL ? wardId : undefined,
      zone_id: zoneId !== ALL ? zoneId : undefined,
    }),
    [cityId, wardId, zoneId],
  );

  const routesQuery = useQuery({ queryKey: queryKeys.routes.list(routeParams), queryFn: () => listRoutes(routeParams) });
  const routeStopsQuery = useQuery({ queryKey: queryKeys.routeStops.list({ route_id: routeId !== ALL ? routeId : undefined }), queryFn: () => listRouteStops({ route_id: routeId !== ALL ? routeId : undefined }) });
  const tasksQuery = useQuery({ queryKey: queryKeys.pickupTasks.list({ route_id: routeId !== ALL ? routeId : undefined }), queryFn: () => listPickupTasks({ route_id: routeId !== ALL ? routeId : undefined }) });

  const citiesQuery = useQuery({ queryKey: queryKeys.cities.list(), queryFn: () => listCities() });
  const wardsQuery = useQuery({ queryKey: queryKeys.wards.list({ city_id: cityId !== ALL ? cityId : undefined }), queryFn: () => listWards({ city_id: cityId !== ALL ? cityId : undefined }) });
  const zonesQuery = useQuery({ queryKey: queryKeys.zones.list({ ward_id: wardId !== ALL ? wardId : undefined }), queryFn: () => listZones({ ward_id: wardId !== ALL ? wardId : undefined }) });

  const householdsQuery = useQuery({ queryKey: queryKeys.households.list(routeParams), queryFn: () => listHouseholds(routeParams) });
  const bulkGeneratorsQuery = useQuery({ queryKey: queryKeys.bulkGenerators.list(routeParams), queryFn: () => listBulkGenerators(routeParams) });

  const addressesQuery = useQuery({
    queryKey: queryKeys.addresses.list({ is_active: true }),
    queryFn: () => listAddresses({ is_active: true }),
    enabled: canReadAddresses,
  });

  const addressIndex = useMemo(
    () => buildAddressCoordinateIndex(addressesQuery.data ?? []),
    [addressesQuery.data],
  );

  const householdPoints = useMemo(
    () => mapHouseholdsToPoints(householdsQuery.data ?? [], addressIndex),
    [householdsQuery.data, addressIndex],
  );

  const bulkGeneratorPoints = useMemo(
    () => mapBulkGeneratorsToPoints(bulkGeneratorsQuery.data ?? [], addressIndex),
    [bulkGeneratorsQuery.data, addressIndex],
  );

  const routeStopPoints = useMemo(
    () => mapRouteStopsToPoints(routeStopsQuery.data ?? [], householdPoints, bulkGeneratorPoints, tasksQuery.data ?? []),
    [routeStopsQuery.data, householdPoints, bulkGeneratorPoints, tasksQuery.data],
  );

  const orderedStops = useMemo(
    () => [...routeStopPoints].sort((a, b) => Number(a.metadata?.stop_sequence ?? 0) - Number(b.metadata?.stop_sequence ?? 0)),
    [routeStopPoints],
  );

  const routeLines = useMemo(() => {
    if (!orderedStops.length) return [];
    return [{
      id: `route-${routeId}`,
      label: "Route path",
      color: "#0f766e",
      points: orderedStops.map((point) => [point.lat, point.lng] as [number, number]),
    }];
  }, [orderedStops, routeId]);

  const selectedPoint = useMemo(
    () => routeStopPoints.find((item) => item.id === selectedPointId) ?? null,
    [routeStopPoints, selectedPointId],
  );

  const sideItems = useMemo(
    () => orderedStops.map((point) => ({
      id: point.id,
      title: point.title,
      subtitle: point.subtitle,
      meta: `${point.source_type ?? "SOURCE"} • Tasks: ${point.metadata?.linked_task_count ?? 0}`,
    })),
    [orderedStops],
  );

  function resetFilters() {
    setCityId(ALL);
    setWardId(ALL);
    setZoneId(ALL);
    setRouteId(ALL);
    setSelectedPointId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Route Maps" description="Plot route stops with source and linked task context." />

      <MapFilterBar onReset={resetFilters}>
        <FormSelectField label="City" value={cityId} onChange={setCityId} options={[{ label: "All", value: ALL }, ...(citiesQuery.data ?? []).map((city) => ({ label: city.name, value: city.id }))]} />
        <FormSelectField label="Ward" value={wardId} onChange={setWardId} options={[{ label: "All", value: ALL }, ...(wardsQuery.data ?? []).map((ward) => ({ label: ward.name, value: ward.id }))]} />
        <FormSelectField label="Zone" value={zoneId} onChange={setZoneId} options={[{ label: "All", value: ALL }, ...(zonesQuery.data ?? []).map((zone) => ({ label: zone.name, value: zone.id }))]} />
        <FormSelectField label="Route" value={routeId} onChange={setRouteId} options={[{ label: "All", value: ALL }, ...(routesQuery.data ?? []).map((route) => ({ label: `${route.route_code} - ${route.name}`, value: route.id }))]} />
      </MapFilterBar>

      {!canReadAddresses ? (
        <Alert>
          <AlertTitle>Limited map detail for your role</AlertTitle>
          <AlertDescription>Address coordinates are not available for this role. Route stop map markers appear only when source coordinates are accessible.</AlertDescription>
        </Alert>
      ) : null}

      <MapLegend
        items={[
          { label: "Route Stop", color: "#0f766e" },
          { label: "Household source", color: "#2563eb" },
          { label: "Bulk generator source", color: "#f59e0b" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <MapSidePanel
          title="Route Stops"
          description="Select a stop to inspect source and task summary."
          items={sideItems}
          selectedId={selectedPointId}
          onSelect={setSelectedPointId}
          emptyText="No mappable route stops for selected filters."
        />

        <div className="space-y-4">
          <MapCanvas
            points={routeStopPoints}
            lines={routeLines}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
            emptyMessage="No route stops could be plotted. Check coordinates and route/source filters."
          />
          <SelectedEntityCard point={selectedPoint} title="Stop Summary" />
        </div>
      </div>
    </div>
  );
}
