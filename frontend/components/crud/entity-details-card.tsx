import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

export function EntityDetailsCard({ title, items }: { title: string; items: KeyValueItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
              <div className="mt-1 text-sm text-slate-800">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
