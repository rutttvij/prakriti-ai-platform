import type { ReactNode } from "react";
import type { Metadata } from "next";

import { PublicShell } from "@/components/public/public-shell";

export const metadata: Metadata = {
  title: "Prakriti.AI",
  description: "Municipal waste operations and carbon intelligence platform",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
