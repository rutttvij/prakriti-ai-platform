import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui-extensions/empty-state";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";

interface DataTableWrapperProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry?: () => void;
  children: ReactNode;
}

export function DataTableWrapper({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: DataTableWrapperProps) {
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState description={errorMessage ?? "An unexpected error occurred."} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
}
