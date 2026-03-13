"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import { getHousehold } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function HouseholdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.households.detail(id), queryFn: () => getHousehold(id) });

  if (query.isLoading) return <LoadingState title="Loading household" description="Fetching household profile and related scope." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={`Household ${data.household_code}`} description="Household detail profile and hierarchy." actions={<Button variant="outline" asChild><Link href="/households">Back to Households</Link></Button>} />
      <EntityDetailsCard title="Summary" items={[{ label: "ID", value: data.id }, { label: "Household Code", value: data.household_code }, { label: "Head Name", value: data.household_head_name }, { label: "Onboarding", value: <StatusBadge value={data.onboarding_status} /> }, { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> }, { label: "Created", value: formatDate(data.created_at) }, { label: "Updated", value: formatDate(data.updated_at) }]} />
      <EntityDetailsCard title="Hierarchy" items={[{ label: "Organization ID", value: data.organization_id ?? "-" }, { label: "City ID", value: data.city_id }, { label: "Ward ID", value: data.ward_id }, { label: "Zone ID", value: data.zone_id ?? "-" }]} />
      <EntityDetailsCard title="Contact and Attributes" items={[{ label: "Phone", value: data.contact_phone ?? "-" }, { label: "Email", value: data.contact_email ?? "-" }, { label: "Members", value: data.number_of_members ?? "-" }, { label: "Dwelling Type", value: data.dwelling_type ?? "-" }, { label: "QR Tag ID", value: data.qr_tag_id ?? "-" }, { label: "Address ID", value: data.address_id ?? "-" }]} />
      <EntityDetailsCard title="Related Links" items={[{ label: "Ward", value: <Link className="text-emerald-700 underline" href="/wards">Open wards list</Link> }, { label: "Zone", value: <Link className="text-emerald-700 underline" href="/zones">Open zones list</Link> }]} />
    </div>
  );
}
