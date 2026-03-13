"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { roleCodes } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth-store";

export default function AuditExportLandingPage() {
  const user = useAuthStore((state) => state.user);
  const codes = roleCodes(user);

  const canViewBatch = !codes.includes("BULK_GENERATOR");
  const canViewCarbon = !codes.includes("BULK_GENERATOR");

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Exports" description="Choose an evidence export workflow." actions={<Button asChild variant="outline"><Link href="/audit">Back to Audit Center</Link></Button>} />

      <div className="grid gap-4 md:grid-cols-3">
        {canViewBatch ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Batch</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-600">Lifecycle chain export for a selected batch.</p>
              <Button asChild className="w-full"><Link href="/audit/export/batch">Continue</Link></Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle className="text-base">Bulk Generator</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-slate-600">Generator pickup, certificate, and compliance export.</p>
            <Button asChild className="w-full"><Link href="/audit/export/generator">Continue</Link></Button>
          </CardContent>
        </Card>

        {canViewCarbon ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Carbon Event</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-600">Carbon event lifecycle, ledger, and verification export.</p>
              <Button asChild className="w-full"><Link href="/audit/export/carbon">Continue</Link></Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
