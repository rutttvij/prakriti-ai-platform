import { Card, CardContent } from "@/components/ui/card";

export function FeatureCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-2 p-5">
        <h3 className="heading-font text-base font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{detail}</p>
      </CardContent>
    </Card>
  );
}
