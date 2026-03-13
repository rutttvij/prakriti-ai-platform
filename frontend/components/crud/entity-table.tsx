import type { ReactNode } from "react";

import { DataTableWrapper } from "@/components/tables/data-table-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ColumnDef } from "@/types/table";

interface EntityTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  rowActions?: (row: T) => ReactNode;
}

export function EntityTable<T>({
  columns,
  rows,
  isLoading,
  isError,
  errorMessage,
  emptyTitle,
  emptyDescription,
  onRetry,
  rowActions,
}: EntityTableProps<T>) {
  return (
    <DataTableWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      isEmpty={!rows.length}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      onRetry={onRetry}
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
                {rowActions ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.render(row)}</TableCell>
                  ))}
                  {rowActions ? <TableCell className="text-right">{rowActions(row)}</TableCell> : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DataTableWrapper>
  );
}
