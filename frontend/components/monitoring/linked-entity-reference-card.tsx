import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonitoringBaseItem } from "@/types/monitoring";

export function LinkedEntityReferenceCard({ item }: { item: MonitoringBaseItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linked Entity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-700">
        <p><span className="text-slate-500">Entity Type:</span> {item.related_entity_type}</p>
        <p><span className="text-slate-500">Entity:</span> {item.related_entity_label}</p>
        <p><span className="text-slate-500">Entity ID:</span> {item.related_entity_id}</p>
        <Link href={item.href} className="inline-block text-sm font-medium text-emerald-700 hover:underline">
          Open linked record
        </Link>
      </CardContent>
    </Card>
  );
}
