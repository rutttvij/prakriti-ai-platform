"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FormSelectField } from "@/components/forms/form-fields";
import { MapCanvas } from "@/components/maps/map-canvas";
import { MapFilterBar } from "@/components/maps/map-filter-bar";
import { MapLegend } from "@/components/maps/map-legend";
import { MapSidePanel } from "@/components/maps/map-side-panel";
import { SelectedEntityCard } from "@/components/maps/selected-entity-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { COMPLIANCE_STATUSES, ONBOARDING_STATUSES } from "@/lib/constants";
import { roleCodes } from "@/lib/auth/permissions";
import { listAddresses, listBulkGenerators, listCities, listHouseholds, listWards, listZones } from "@/lib/api/services";
import { buildAddressCoordinateIndex, mapBulkGeneratorsToPoints, mapHouseholdsToPoints } from "@/lib/maps/normalize";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/types/query-keys";
import type { MapPoint } from "@/types/maps";

const ALL = "all";

export default function SourceMapsPage() {
  const user = useAuthStore((state) => state.user);

  const [cityId, setCityId] = useState(ALL);
  const [wardId, setWardId] = useState(ALL);
  const [zoneId, setZoneId] = useState(ALL);
  const [sourceType, setSourceType] = useState(ALL);
  const [onboardingStatus, setOnboardingStatus] = useState(ALL);
  const [complianceStatus, setComplianceStatus] = useState(ALL);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const roleCodeList = roleCodes(user);
  const canReadAddresses = roleCodeList.includes("SUPER_ADMIN") || roleCodeList.includes("CITY_ADMIN") || roleCodeList.includes("WARD_OFFICER") || Boolean(user?.is_superuser);

  const locationParams = useMemo(
    () => ({
      city_id: cityId !== ALL ? cityId : undefined,
      ward_id: wardId !== ALL ? wardId : undefined,
      zone_id: zoneId !== ALL ? zoneId : undefined,
    }),
    [cityId, wardId, zoneId],
  );

  const householdsParams = useMemo(
    () => ({ ...locationParams, onboarding_status: onboardingStatus !== ALL ? onboardingStatus : undefined }),
    [locationParams, onboardingStatus],
  );

  const bulkParams = useMemo(
    () => ({
      ...locationParams,
      onboarding_status: onboardingStatus !== ALL ? onboardingStatus : undefined,
      compliance_status: complianceStatus !== ALL ? complianceStatus : undefined,
    }),
    [locationParams, onboardingStatus, complianceStatus],
  );

  const citiesQuery = useQuery({ queryKey: queryKeys.cities.list(), queryFn: () => listCities() });
  const wardsQuery = useQuery({ queryKey: queryKeys.wards.list({ city_id: cityId !== ALL ? cityId : undefined }), queryFn: () => listWards({ city_id: cityId !== ALL ? cityId : undefined }) });
  const zonesQuery = useQuery({ queryKey: queryKeys.zones.list({ ward_id: wardId !== ALL ? wardId : undefined }), queryFn: () => listZones({ ward_id: wardId !== ALL ? wardId : undefined }) });

  const householdsQuery = useQuery({ queryKey: queryKeys.households.list(householdsParams), queryFn: () => listHouseholds(householdsParams) });
  const bulkGeneratorsQuery = useQuery({ queryKey: queryKeys.bulkGenerators.list(bulkParams), queryFn: () => listBulkGenerators(bulkParams) });

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

  const points = useMemo<MapPoint[]>(() => {
    if (sourceType === "HOUSEHOLD") return householdPoints;
    if (sourceType === "BULK_GENERATOR") return bulkGeneratorPoints;
    return [...householdPoints, ...bulkGeneratorPoints];
  }, [sourceType, householdPoints, bulkGeneratorPoints]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId],
  );

  const sideItems = useMemo(
    () => points.map((point) => ({
      id: point.id,
      title: point.title,
      subtitle: point.subtitle,
      meta: `${point.kind.replaceAll("_", " ")} • ${point.tags?.join(" • ") ?? ""}`,
    })),
    [points],
  );

  function resetFilters() {
    setCityId(ALL);
    setWardId(ALL);
    setZoneId(ALL);
    setSourceType(ALL);
    setOnboardingStatus(ALL);
    setComplianceStatus(ALL);
    setSelectedPointId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Source Maps" description="Visualize household and bulk generator geography for operations." />

      <MapFilterBar onReset={resetFilters}>
        <FormSelectField label="City" value={cityId} onChange={setCityId} options={[{ label: "All", value: ALL }, ...(citiesQuery.data ?? []).map((city) => ({ label: city.name, value: city.id }))]} />
        <FormSelectField label="Ward" value={wardId} onChange={setWardId} options={[{ label: "All", value: ALL }, ...(wardsQuery.data ?? []).map((ward) => ({ label: ward.name, value: ward.id }))]} />
        <FormSelectField label="Zone" value={zoneId} onChange={setZoneId} options={[{ label: "All", value: ALL }, ...(zonesQuery.data ?? []).map((zone) => ({ label: zone.name, value: zone.id }))]} />
        <FormSelectField label="Source Type" value={sourceType} onChange={setSourceType} options={[{ label: "All", value: ALL }, { label: "Household", value: "HOUSEHOLD" }, { label: "Bulk Generator", value: "BULK_GENERATOR" }]} />
        <FormSelectField label="Onboarding" value={onboardingStatus} onChange={setOnboardingStatus} options={[{ label: "All", value: ALL }, ...ONBOARDING_STATUSES.map((status) => ({ label: status, value: status }))]} />
        <FormSelectField label="Compliance" value={complianceStatus} onChange={setComplianceStatus} options={[{ label: "All", value: ALL }, ...COMPLIANCE_STATUSES.map((status) => ({ label: status, value: status }))]} />
      </MapFilterBar>

      {!canReadAddresses ? (
        <Alert>
          <AlertTitle>Coordinate data is restricted for your role</AlertTitle>
          <AlertDescription>Source entities may load, but map markers require address coordinates that are unavailable for this role.</AlertDescription>
        </Alert>
      ) : null}

      {(householdsQuery.isError || bulkGeneratorsQuery.isError) ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load source records</AlertTitle>
          <AlertDescription>Current role may not have source registry access. Try route maps for operational stop-level visibility.</AlertDescription>
        </Alert>
      ) : null}

      <MapLegend
        items={[
          { label: "Households", color: "#2563eb" },
          { label: "Bulk Generators", color: "#f59e0b" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <MapSidePanel
          title="Source List"
          description="Select a source to inspect details."
          items={sideItems}
          selectedId={selectedPointId}
          onSelect={setSelectedPointId}
          emptyText="No source records have valid coordinates for current filters."
        />

        <div className="space-y-4">
          <MapCanvas
            points={points}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
            emptyMessage="No source points could be plotted."
          />
          <SelectedEntityCard point={selectedPoint} title="Source Summary" />
        </div>
      </div>
    </div>
  );
}
