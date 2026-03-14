"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { getPlatformTenants } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function PlatformAdminTenantsPage() {
  const [search, setSearch] = useState("");

  const tenantsQuery = useQuery({
    queryKey: queryKeys.platformAdmin.tenants,
    queryFn: () => getPlatformTenants(),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tenantsQuery.data ?? [];
    return (tenantsQuery.data ?? []).filter((item) =>
      [item.name, item.slug, item.type].some((field) => field.toLowerCase().includes(term)),
    );
  }, [search, tenantsQuery.data]);

  return (
    <PlatformAdminGuard>
      {tenantsQuery.isLoading ? (
        <LoadingState title="Loading tenants" description="Fetching organization and tenant summaries." />
      ) : tenantsQuery.isError ? (
        <ErrorState title="Unable to load tenants" description="Please retry." onRetry={() => void tenantsQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Tenant Management"
            description="View organizations, status, linked cities, admins, and operational activity summaries."
            actions={<Button asChild><Link href="/platform-admin/city-onboarding">Start City Onboarding</Link></Button>}
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tenant by name, slug, or type"
            className="max-w-sm"
          />

          <div className="rounded-xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cities</TableHead>
                  <TableHead>Admins</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-900">{tenant.name}</p>
                      <p className="text-xs text-slate-500">{tenant.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.is_active ? "default" : "secondary"}>{tenant.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>{tenant.linked_city_count}</TableCell>
                    <TableCell>{tenant.linked_admin_count}</TableCell>
                    <TableCell>{tenant.linked_user_count}</TableCell>
                    <TableCell>{tenant.linked_worker_count}</TableCell>
                    <TableCell>{formatDateTime(tenant.last_activity_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm"><Link href={`/platform-admin/tenants/${tenant.id}`}>Open</Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-slate-500">No tenants found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
