import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ComparisonRow {
  id: string;
  name: string;
  metrics: Array<{ label: string; value: string }>;
}

export function ComparisonTableSection({ title, metricHeaders, rows }: { title: string; metricHeaders: string[]; rows: ComparisonRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              {metricHeaders.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                {row.metrics.map((metric) => (
                  <TableCell key={`${row.id}-${metric.label}`}>{metric.value}</TableCell>
                ))}
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={metricHeaders.length + 1} className="py-6 text-center text-sm text-slate-500">
                  No comparison data available for current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
