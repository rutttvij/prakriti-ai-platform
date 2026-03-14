import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlatformFeatureFlagItem } from "@/types/platform-admin";

export function FeatureFlagTable({ rows }: { rows: PlatformFeatureFlagItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Flags</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tenant Visibility</TableHead>
              <TableHead>Environment Scope</TableHead>
              <TableHead>Mutability</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <p className="text-sm font-medium text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.key}</p>
                  <p className="text-xs text-slate-500">{row.description}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={row.enabled ? "default" : "secondary"}>{row.enabled ? "Enabled" : "Disabled"}</Badge>
                </TableCell>
                <TableCell>{row.tenant_visibility}</TableCell>
                <TableCell>{row.environment_scope}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.is_mutable ? "Toggle Allowed" : "View Only"}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500">No feature flags available.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
