"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DataTableWrapper } from "@/components/tables/data-table-wrapper";
import { SimpleDataTable } from "@/components/tables/simple-data-table";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { PageHeader } from "@/components/ui-extensions/page-header";
import type { ColumnDef } from "@/types/table";

interface ListPageShellProps<T> {
  title: string;
  description: string;
  createLabel: string;
  filters: ReactNode;
  columns: ColumnDef<T>[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onClearFilters: () => void;
}

export function ListPageShell<T>({
  title,
  description,
  createLabel,
  filters,
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onClearFilters,
}: ListPageShellProps<T>) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Button variant="default">{createLabel}</Button>}
      />

      <FilterBar onReset={onClearFilters}>{filters}</FilterBar>

      <DataTableWrapper
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        isEmpty={!data.length}
        emptyTitle={`No ${title.toLowerCase()} found`}
        emptyDescription="Try changing filters or create a new entry to get started."
        onRetry={onRetry}
      >
        <SimpleDataTable columns={columns} data={data} />
      </DataTableWrapper>
    </div>
  );
}
