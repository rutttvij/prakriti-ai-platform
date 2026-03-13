"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScannerErrorCode = "PERMISSION_DENIED" | "NOT_FOUND" | "CAMERA_ERROR";

interface QRCameraScannerProps {
  className?: string;
  timeoutMs?: number;
  onDetected: (value: string) => void;
  onCancel: () => void;
  onError: (payload: { code: ScannerErrorCode; message: string }) => void;
}

export function QRCameraScanner({
  className,
  timeoutMs = 15000,
  onDetected,
  onCancel,
  onError,
}: QRCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<{ stop: () => void | Promise<void>; destroy: () => void } | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function startScanner() {
      try {
        const QrScannerModule = await import("qr-scanner");
        const QrScanner = QrScannerModule.default;

        if (!videoRef.current) return;

        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            const value = typeof result === "string" ? result : result?.data;
            if (!value || cancelled) return;
            cancelled = true;
            void scanner.stop();
            scanner.destroy();
            onDetected(value);
          },
          {
            preferredCamera: "environment",
            maxScansPerSecond: 6,
            returnDetailedScanResult: true,
            highlightCodeOutline: true,
            highlightScanRegion: true,
          },
        );

        scannerRef.current = scanner;
        await scanner.start();

        if (cancelled) {
          await scanner.stop();
          scanner.destroy();
          return;
        }

        setIsStarting(false);

        timeoutId = setTimeout(() => {
          if (cancelled) return;
          onError({
            code: "NOT_FOUND",
            message: "No QR code detected. Try moving closer and increasing light.",
          });
        }, timeoutMs);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to access camera";
        const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          onError({ code: "PERMISSION_DENIED", message: "Camera permission denied. Please allow camera access and retry." });
          return;
        }

        onError({ code: "CAMERA_ERROR", message });
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (!scannerRef.current) return;
      void scannerRef.current.stop();
      scannerRef.current.destroy();
    };
  }, [onDetected, onError, timeoutMs]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-black">
        <video ref={videoRef} className="h-[320px] w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-x-4 top-6 h-48 rounded-xl border-2 border-emerald-400/70" />
        <div className="pointer-events-none absolute inset-x-8 top-2 flex items-center justify-center gap-2 rounded-md bg-black/60 px-3 py-1 text-xs text-white">
          <ScanLine className="h-4 w-4" />
          Align QR in the frame
        </div>
      </div>

      {isStarting ? (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Starting camera...
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <Camera className="h-4 w-4" /> Rear camera active
        </div>
      )}

      <Button type="button" variant="outline" className="h-11 w-full" onClick={onCancel}>
        Cancel scan
      </Button>
    </div>
  );
}
