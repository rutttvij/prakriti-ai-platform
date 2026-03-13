"use client";

import { ExportHistoryTable } from "@/components/audit/export-history-table";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { useExportHistory } from "@/hooks/use-export-history";

export default function AuditHistoryPage() {
  const { records } = useExportHistory();

  return (
    <div className="space-y-6">
      <PageHeader title="Export History" description="Track generated audit exports and download records." />
      <ExportHistoryTable rows={records} />
    </div>
  );
}
