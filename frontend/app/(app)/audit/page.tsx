"use client";

import Link from "next/link";

import { ExportHistoryTable } from "@/components/audit/export-history-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { useExportHistory } from "@/hooks/use-export-history";
import { roleCodes } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth-store";

export default function AuditHomePage() {
  const user = useAuthStore((state) => state.user);
  const codes = roleCodes(user);
  const { records } = useExportHistory();
  const recent = records.slice(0, 5);

  const canViewBatch = !codes.includes("BULK_GENERATOR");
  const canViewCarbon = !codes.includes("BULK_GENERATOR");

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Evidence Center" description="Centralized export workflows for operational lifecycle and environmental evidence." actions={<Button asChild variant="outline"><Link href="/audit/history">View Export History</Link></Button>} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Generate lifecycle evidence bundles for batch operations, bulk generator activity, and carbon records.</p>
          <p>Exports support JSON and CSV. PDF is staged as a placeholder for future document packaging.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {canViewBatch ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Batch Lifecycle Export</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-600">Export end-to-end chain from pickup to carbon ledger.</p>
              <Button asChild className="w-full"><Link href="/audit/export/batch">Open Batch Export</Link></Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle className="text-base">Generator Export</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-slate-600">Export generator pickup, certificate, and compliance evidence.</p>
            <Button asChild className="w-full"><Link href="/audit/export/generator">Open Generator Export</Link></Button>
          </CardContent>
        </Card>

        {canViewCarbon ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Carbon Export</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-600">Export carbon event lifecycle, ledger, and verification traces.</p>
              <Button asChild className="w-full"><Link href="/audit/export/carbon">Open Carbon Export</Link></Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportHistoryTable rows={recent} />
        </CardContent>
      </Card>
    </div>
  );
}
