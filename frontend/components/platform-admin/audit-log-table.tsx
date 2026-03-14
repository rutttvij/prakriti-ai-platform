import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlatformAuditLogRecord } from "@/types/platform-admin";
import { formatDateTime } from "@/lib/utils";

interface AuditLogTableProps {
  rows: PlatformAuditLogRecord[];
  onSelect?: (row: PlatformAuditLogRecord) => void;
}

export function AuditLogTable({ rows, onSelect }: AuditLogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Tenant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={onSelect ? "cursor-pointer" : ""} onClick={onSelect ? () => onSelect(row) : undefined}>
                <TableCell>{formatDateTime(row.occurred_at)}</TableCell>
                <TableCell><Badge variant="outline">{row.action}</Badge></TableCell>
                <TableCell>
                  <p className="text-sm font-medium text-slate-900">{row.entity_type}</p>
                  <p className="text-xs text-slate-500">{row.entity_label}</p>
                </TableCell>
                <TableCell>{row.actor_name ?? row.actor_user_id ?? "System"}</TableCell>
                <TableCell className="text-xs text-slate-600">{row.tenant_id ?? "-"}</TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500">No audit records found for selected filters.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
