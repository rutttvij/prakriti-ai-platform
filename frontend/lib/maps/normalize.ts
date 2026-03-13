import type { Address, BulkGenerator, Facility, Household, PickupTask, RouteStop } from "@/types/domain";
import type { MapPoint } from "@/types/maps";

export interface Coordinate {
  lat: number;
  lng: number;
}

export function parseCoordinateValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function toCoordinate(lat: string | number | null | undefined, lng: string | number | null | undefined): Coordinate | null {
  const parsedLat = parseCoordinateValue(lat);
  const parsedLng = parseCoordinateValue(lng);
  if (parsedLat === null || parsedLng === null) return null;
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;
  return { lat: parsedLat, lng: parsedLng };
}

export function buildAddressCoordinateIndex(addresses: Address[]): Map<string, Coordinate> {
  const index = new Map<string, Coordinate>();
  for (const address of addresses) {
    const coordinate = toCoordinate(address.latitude, address.longitude);
    if (!coordinate) continue;
    index.set(address.id, coordinate);
  }
  return index;
}

export function mapHouseholdsToPoints(households: Household[], addressCoordinates: Map<string, Coordinate>): MapPoint[] {
  return households.flatMap((household) => {
    const coordinate = household.address_id ? addressCoordinates.get(household.address_id) : null;
    if (!coordinate) return [];

    return [{
      id: household.id,
      lat: coordinate.lat,
      lng: coordinate.lng,
      title: household.household_code,
      subtitle: household.household_head_name,
      kind: "HOUSEHOLD",
      city_id: household.city_id,
      ward_id: household.ward_id,
      zone_id: household.zone_id,
      source_type: "HOUSEHOLD",
      tags: [household.onboarding_status],
      metadata: {
        onboarding_status: household.onboarding_status,
        qr_tag_id: household.qr_tag_id,
        contact_phone: household.contact_phone,
      },
    }];
  });
}

export function mapBulkGeneratorsToPoints(generators: BulkGenerator[], addressCoordinates: Map<string, Coordinate>): MapPoint[] {
  return generators.flatMap((generator) => {
    const coordinate = generator.address_id ? addressCoordinates.get(generator.address_id) : null;
    if (!coordinate) return [];

    return [{
      id: generator.id,
      lat: coordinate.lat,
      lng: coordinate.lng,
      title: generator.entity_name,
      subtitle: generator.generator_code,
      kind: "BULK_GENERATOR",
      city_id: generator.city_id,
      ward_id: generator.ward_id,
      zone_id: generator.zone_id,
      source_type: "BULK_GENERATOR",
      tags: [generator.onboarding_status, generator.compliance_status],
      metadata: {
        onboarding_status: generator.onboarding_status,
        compliance_status: generator.compliance_status,
        contact_person_name: generator.contact_person_name,
      },
    }];
  });
}

export function mapFacilitiesToPoints(facilities: Facility[], addressCoordinates: Map<string, Coordinate>): MapPoint[] {
  return facilities.flatMap((facility) => {
    const coordinate = facility.address_id ? addressCoordinates.get(facility.address_id) : null;
    if (!coordinate) return [];

    return [{
      id: facility.id,
      lat: coordinate.lat,
      lng: coordinate.lng,
      title: facility.name,
      subtitle: facility.facility_code,
      kind: "FACILITY",
      city_id: facility.city_id,
      ward_id: facility.ward_id,
      zone_id: facility.zone_id,
      tags: [facility.facility_type],
      metadata: {
        facility_type: facility.facility_type,
        operator_name: facility.operator_name,
        capacity_kg_per_day: facility.capacity_kg_per_day,
      },
    }];
  });
}

export function mapRouteStopsToPoints(
  routeStops: RouteStop[],
  householdPoints: MapPoint[],
  bulkGeneratorPoints: MapPoint[],
  tasks: PickupTask[] = [],
): MapPoint[] {
  const householdPointById = new Map(householdPoints.map((item) => [item.id, item]));
  const bulkGeneratorPointById = new Map(bulkGeneratorPoints.map((item) => [item.id, item]));

  return routeStops.flatMap((stop) => {
    const sourcePoint = stop.source_type === "HOUSEHOLD"
      ? (stop.household_id ? householdPointById.get(stop.household_id) : null)
      : (stop.bulk_generator_id ? bulkGeneratorPointById.get(stop.bulk_generator_id) : null);

    if (!sourcePoint) return [];

    const linkedTaskCount = tasks.filter((task) => {
      if (stop.source_type === "HOUSEHOLD") {
        return Boolean(task.household_id && stop.household_id && task.household_id === stop.household_id);
      }
      return Boolean(task.bulk_generator_id && stop.bulk_generator_id && task.bulk_generator_id === stop.bulk_generator_id);
    }).length;

    return [{
      ...sourcePoint,
      id: stop.id,
      title: `Stop ${stop.stop_sequence}`,
      subtitle: sourcePoint.title,
      kind: "ROUTE_STOP",
      source_type: stop.source_type,
      tags: [stop.source_type],
      metadata: {
        route_id: stop.route_id,
        stop_sequence: stop.stop_sequence,
        expected_time: stop.expected_time,
        source_id: stop.household_id ?? stop.bulk_generator_id,
        linked_task_count: linkedTaskCount,
      },
    }];
  });
}
