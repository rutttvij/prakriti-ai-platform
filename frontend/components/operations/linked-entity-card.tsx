import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LinkedEntityItem {
  label: string;
  value?: string | null;
  href?: string;
}

export function LinkedEntityCard({ title, items }: { title: string; items: LinkedEntityItem[] }) {
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
              {item.href && item.value ? (
                <Link className="mt-1 block text-sm text-emerald-700 underline" href={item.href}>
                  {item.value}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-slate-800">{item.value ?? "-"}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
