"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 280;

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        "fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(111,201,171,0.55)] bg-[linear-gradient(145deg,rgba(5,30,50,0.92),rgba(7,47,68,0.9))] text-[var(--text-on-dark)] shadow-[0_12px_24px_rgba(2,9,19,0.46),inset_0_1px_0_rgba(192,238,221,0.2)] backdrop-blur-md transition-all md:right-6 md:bottom-6",
        visible
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-95 opacity-0",
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
