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
import { roleCodes } from "@/lib/auth/permissions";
import { getFacilityReport, listAddresses, listCities, listFacilities, listWards, listZones } from "@/lib/api/services";
import { FACILITY_TYPES } from "@/lib/constants";
import { buildAddressCoordinateIndex, mapFacilitiesToPoints } from "@/lib/maps/normalize";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/types/query-keys";

const ALL = "all";

export default function FacilityMapsPage() {
  const user = useAuthStore((state) => state.user);

  const [cityId, setCityId] = useState(ALL);
  const [wardId, setWardId] = useState(ALL);
  const [zoneId, setZoneId] = useState(ALL);
  const [facilityType, setFacilityType] = useState(ALL);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const roleCodeList = roleCodes(user);
  const canReadAddresses = roleCodeList.includes("SUPER_ADMIN") || roleCodeList.includes("CITY_ADMIN") || roleCodeList.includes("WARD_OFFICER") || Boolean(user?.is_superuser);

  const params = useMemo(
    () => ({
      city_id: cityId !== ALL ? cityId : undefined,
      ward_id: wardId !== ALL ? wardId : undefined,
      zone_id: zoneId !== ALL ? zoneId : undefined,
      facility_type: facilityType !== ALL ? facilityType : undefined,
    }),
    [cityId, wardId, zoneId, facilityType],
  );

  const citiesQuery = useQuery({ queryKey: queryKeys.cities.list(), queryFn: () => listCities() });
  const wardsQuery = useQuery({ queryKey: queryKeys.wards.list({ city_id: cityId !== ALL ? cityId : undefined }), queryFn: () => listWards({ city_id: cityId !== ALL ? cityId : undefined }) });
  const zonesQuery = useQuery({ queryKey: queryKeys.zones.list({ ward_id: wardId !== ALL ? wardId : undefined }), queryFn: () => listZones({ ward_id: wardId !== ALL ? wardId : undefined }) });

  const facilitiesQuery = useQuery({ queryKey: queryKeys.facilities.list(params), queryFn: () => listFacilities(params) });
  const facilityReportQuery = useQuery({ queryKey: queryKeys.reports.facilities(params), queryFn: () => getFacilityReport(params) });

  const addressesQuery = useQuery({
    queryKey: queryKeys.addresses.list({ is_active: true }),
    queryFn: () => listAddresses({ is_active: true }),
    enabled: canReadAddresses,
  });

  const addressIndex = useMemo(
    () => buildAddressCoordinateIndex(addressesQuery.data ?? []),
    [addressesQuery.data],
  );

  const points = useMemo(() => {
    const basePoints = mapFacilitiesToPoints(facilitiesQuery.data ?? [], addressIndex);
    const reportIndex = new Map((facilityReportQuery.data?.rows ?? []).map((row) => [row.facility_id, row]));

    return basePoints.map((point) => {
      const metrics = reportIndex.get(point.id);
      return {
        ...point,
        metadata: {
          ...point.metadata,
          total_transfers: metrics?.total_transfers ?? 0,
          total_processed_weight_kg: metrics?.total_processed_weight_kg ?? 0,
          total_landfilled_weight_kg: metrics?.total_landfilled_weight_kg ?? 0,
        },
      };
    });
  }, [facilitiesQuery.data, addressIndex, facilityReportQuery.data]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId],
  );

  const sideItems = useMemo(
    () => points.map((point) => ({
      id: point.id,
      title: point.title,
      subtitle: point.subtitle,
      meta: `${point.tags?.[0] ?? "FACILITY"} • Transfers: ${point.metadata?.total_transfers ?? 0}`,
    })),
    [points],
  );

  function resetFilters() {
    setCityId(ALL);
    setWardId(ALL);
    setZoneId(ALL);
    setFacilityType(ALL);
    setSelectedPointId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Facility Maps" description="Track facilities spatially with operational throughput context." />

      <MapFilterBar onReset={resetFilters}>
        <FormSelectField label="City" value={cityId} onChange={setCityId} options={[{ label: "All", value: ALL }, ...(citiesQuery.data ?? []).map((city) => ({ label: city.name, value: city.id }))]} />
        <FormSelectField label="Ward" value={wardId} onChange={setWardId} options={[{ label: "All", value: ALL }, ...(wardsQuery.data ?? []).map((ward) => ({ label: ward.name, value: ward.id }))]} />
        <FormSelectField label="Zone" value={zoneId} onChange={setZoneId} options={[{ label: "All", value: ALL }, ...(zonesQuery.data ?? []).map((zone) => ({ label: zone.name, value: zone.id }))]} />
        <FormSelectField label="Facility Type" value={facilityType} onChange={setFacilityType} options={[{ label: "All", value: ALL }, ...FACILITY_TYPES.map((type) => ({ label: type, value: type }))]} />
      </MapFilterBar>

      {!canReadAddresses ? (
        <Alert>
          <AlertTitle>Coordinate data is restricted for your role</AlertTitle>
          <AlertDescription>Facility records are available, but map marker plotting requires address coordinate access.</AlertDescription>
        </Alert>
      ) : null}

      <MapLegend items={[{ label: "Facilities", color: "#7c3aed" }]} />

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <MapSidePanel
          title="Facility List"
          description="Select a facility to inspect map-linked metrics."
          items={sideItems}
          selectedId={selectedPointId}
          onSelect={setSelectedPointId}
          emptyText="No facilities with valid coordinates for current filters."
        />

        <div className="space-y-4">
          <MapCanvas points={points} selectedPointId={selectedPointId} onSelectPoint={setSelectedPointId} emptyMessage="No facilities could be plotted." />
          <SelectedEntityCard point={selectedPoint} title="Facility Summary" />
        </div>
      </div>
    </div>
  );
}
