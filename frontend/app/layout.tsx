import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { BackToTopButton } from "@/components/layout/back-to-top-button";
import { Providers } from "@/components/providers";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Prakriti.AI Console",
  description: "Municipal waste operations and carbon intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable} theme-root antialiased`}>
        <Providers>
          {children}
          <BackToTopButton />
        </Providers>
      </body>
    </html>
  );
}
