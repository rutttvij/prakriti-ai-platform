import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type ScanUiState = "IDLE" | "SUCCESS" | "MISMATCH" | "NOT_FOUND" | "CAMERA_DENIED" | "CAMERA_ERROR" | "CANCELLED";

interface ScanResultAlertProps {
  className?: string;
  state: ScanUiState;
  message?: string;
  detail?: string;
}

export function ScanResultAlert({ className, state, message, detail }: ScanResultAlertProps) {
  if (state === "IDLE") return null;

  if (state === "SUCCESS") {
    return (
      <Alert className={cn("border-emerald-200 bg-emerald-50 text-emerald-700", className)}>
        <AlertTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Source verified</AlertTitle>
        <AlertDescription>{message ?? "QR code matches the assigned task source."}</AlertDescription>
      </Alert>
    );
  }

  if (state === "MISMATCH") {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTitle className="flex items-center gap-2"><TriangleAlert className="h-4 w-4" /> Wrong source scanned</AlertTitle>
        <AlertDescription>{message ?? "This QR does not match the assigned source for this task."}</AlertDescription>
      </Alert>
    );
  }

  if (state === "NOT_FOUND") {
    return (
      <Alert className={cn("border-amber-200 bg-amber-50 text-amber-800", className)}>
        <AlertTitle className="flex items-center gap-2"><Info className="h-4 w-4" /> QR not found</AlertTitle>
        <AlertDescription>{message ?? "No QR was detected. Try again with better lighting and a steady camera."}</AlertDescription>
      </Alert>
    );
  }

  if (state === "CANCELLED") {
    return (
      <Alert className={cn("border-slate-200 bg-slate-50 text-slate-700", className)}>
        <AlertTitle className="flex items-center gap-2"><Info className="h-4 w-4" /> Scan cancelled</AlertTitle>
        <AlertDescription>{message ?? "Scanning was cancelled. Retry when ready."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {state === "CAMERA_DENIED" ? "Camera permission denied" : "Camera error"}</AlertTitle>
      <AlertDescription>{message ?? detail ?? "Unable to start camera scanner."}</AlertDescription>
    </Alert>
  );
}
