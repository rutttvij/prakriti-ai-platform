"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { NotificationListItem } from "@/components/monitoring/notification-list-item";
import { FormSelectField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { useNotificationReadState } from "@/hooks/use-notification-read-state";
import { getMonitoringData } from "@/lib/monitoring/query";
import { roleCodes } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth-store";

const ALL = "all";

export default function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const [groupBy, setGroupBy] = useState<"RECENCY" | "TYPE">("RECENCY");
  const [severity, setSeverity] = useState(ALL);
  const [stateFilter, setStateFilter] = useState<"all" | "read" | "unread">("all");
  const [nowTs] = useState(() => Date.now());

  const codeList = roleCodes(user);
  const isBulkGeneratorOnly = codeList.includes("BULK_GENERATOR") && codeList.length === 1;

  const query = useQuery({ queryKey: ["monitoring", "bundle", "notifications"], queryFn: () => getMonitoringData({}), refetchInterval: 120000 });
  const { isRead, markRead, markAllRead } = useNotificationReadState();

  const filtered = useMemo(() => {
    const items = query.data?.notifications ?? [];
    return items.filter((item) => {
      if (severity !== ALL && item.severity !== severity) return false;
      if (stateFilter === "read" && !isRead(item.id)) return false;
      if (stateFilter === "unread" && isRead(item.id)) return false;
      return true;
    });
  }, [query.data?.notifications, severity, stateFilter, isRead]);

  const grouped = useMemo(() => {
    if (groupBy === "TYPE") {
      const result = new Map<string, typeof filtered>();
      for (const item of filtered) {
        const key = item.type;
        const prev = result.get(key) ?? [];
        result.set(key, [...prev, item]);
      }
      return result;
    }

    const today: typeof filtered = [];
    const thisWeek: typeof filtered = [];
    const earlier: typeof filtered = [];

    for (const item of filtered) {
      const age = nowTs - Date.parse(item.created_at);
      if (age <= 24 * 60 * 60 * 1000) today.push(item);
      else if (age <= 7 * 24 * 60 * 60 * 1000) thisWeek.push(item);
      else earlier.push(item);
    }

    return new Map<string, typeof filtered>([
      ["Today", today],
      ["This Week", thisWeek],
      ["Earlier", earlier],
    ]);
  }, [filtered, groupBy, nowTs]);

  const unreadCount = useMemo(() => filtered.filter((item) => !isRead(item.id)).length, [filtered, isRead]);

  if (query.isLoading) return <LoadingState title="Loading notifications" description="Collecting operational updates." />;
  if (query.isError) return <ErrorState title="Unable to load notifications" description="Please retry." onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Unified operational and exception notifications."
        actions={<Button variant="outline" onClick={() => markAllRead(filtered.map((item) => item.id))}>Mark all read ({unreadCount})</Button>}
      />

      {isBulkGeneratorOnly ? (
        <Card>
          <CardContent className="p-4 text-sm text-slate-600">
            Bulk generator notifications are currently limited to compliance integration. Dedicated bulk-generator notification feeds can be enabled when backend endpoints are available.
          </CardContent>
        </Card>
      ) : null}

      <FilterBar onReset={() => { setGroupBy("RECENCY"); setSeverity(ALL); setStateFilter("all"); }}>
        <FormSelectField label="Group By" value={groupBy} onChange={(value) => setGroupBy(value as "RECENCY" | "TYPE")} options={[{ label: "Recency", value: "RECENCY" }, { label: "Type", value: "TYPE" }]} />
        <FormSelectField label="Severity" value={severity} onChange={setSeverity} options={[{ label: "All", value: ALL }, { label: "Critical", value: "CRITICAL" }, { label: "High", value: "HIGH" }, { label: "Medium", value: "MEDIUM" }, { label: "Low", value: "LOW" }]} />
        <FormSelectField label="State" value={stateFilter} onChange={(value) => setStateFilter(value as "all" | "read" | "unread")} options={[{ label: "All", value: "all" }, { label: "Unread", value: "unread" }, { label: "Read", value: "read" }]} />
      </FilterBar>

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([group, items]) => (
          <section key={group} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group}</h2>
            <div className="grid gap-3">
              {items.map((item) => (
                <NotificationListItem key={item.id} item={item} isRead={isRead(item.id)} onMarkRead={markRead} />
              ))}
            </div>
          </section>
        ))}
        {!filtered.length ? <p className="text-sm text-slate-500">No notifications for selected filters.</p> : null}
      </div>
    </div>
  );
}
