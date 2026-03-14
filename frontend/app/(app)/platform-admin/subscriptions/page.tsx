"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FormSelectField } from "@/components/forms/form-fields";
import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { SubscriptionPlanCard } from "@/components/platform-admin/subscription-plan-card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { getPlatformSubscriptions } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";

const ALL = "all";

export default function PlatformSubscriptionsPage() {
  const [plan, setPlan] = useState(ALL);
  const [billingStatus, setBillingStatus] = useState(ALL);

  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.platformAdmin.subscriptions,
    queryFn: () => getPlatformSubscriptions(),
  });

  const filtered = useMemo(() => {
    return (subscriptionsQuery.data ?? []).filter((item) => {
      if (plan !== ALL && item.plan_name !== plan) return false;
      if (billingStatus !== ALL && item.billing_status !== billingStatus) return false;
      return true;
    });
  }, [subscriptionsQuery.data, plan, billingStatus]);

  const planOptions = useMemo(
    () => [
      { label: "All plans", value: ALL },
      ...Array.from(new Set((subscriptionsQuery.data ?? []).map((item) => item.plan_name))).map((value) => ({ label: value, value })),
    ],
    [subscriptionsQuery.data],
  );

  const billingOptions = useMemo(
    () => [
      { label: "All billing states", value: ALL },
      ...Array.from(new Set((subscriptionsQuery.data ?? []).map((item) => item.billing_status))).map((value) => ({ label: value, value })),
    ],
    [subscriptionsQuery.data],
  );

  return (
    <PlatformAdminGuard>
      {subscriptionsQuery.isLoading ? (
        <LoadingState title="Loading subscriptions" description="Fetching SaaS plan and entitlement readiness data." />
      ) : subscriptionsQuery.isError ? (
        <ErrorState title="Unable to load subscriptions" description="Please retry." onRetry={() => void subscriptionsQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Subscriptions"
            description="Plan, entitlements, and limits readiness view. Billing lifecycle is currently scaffolded in placeholder mode."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <FormSelectField label="Plan" value={plan} onChange={setPlan} options={planOptions} />
            <FormSelectField label="Billing Status" value={billingStatus} onChange={setBillingStatus} options={billingOptions} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((item) => (
              <SubscriptionPlanCard key={item.id} item={item} />
            ))}
            {!filtered.length ? <p className="text-sm text-slate-500">No subscriptions match selected filters.</p> : null}
          </div>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
