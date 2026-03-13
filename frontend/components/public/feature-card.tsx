import { Card, CardContent } from "@/components/ui/card";

export function FeatureCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="h-full border-slate-200 bg-white/90">
      <CardContent className="space-y-2 p-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{detail}</p>
      </CardContent>
    </Card>
  );
}
