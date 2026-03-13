import { Card, CardContent } from "@/components/ui/card";

interface QuotePlaceholderProps {
  quote: string;
  author: string;
  title: string;
}

export function QuotePlaceholder({ quote, author, title }: QuotePlaceholderProps) {
  return (
    <Card className="border-slate-200 bg-white/95">
      <CardContent className="space-y-4 p-6">
        <p className="text-base leading-relaxed text-slate-700">&ldquo;{quote}&rdquo;</p>
        <div>
          <p className="text-sm font-semibold text-slate-900">{author}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
