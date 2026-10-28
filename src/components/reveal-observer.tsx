"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Drives every [data-reveal] element on the page, so pages stay server components.
// Content is visible until this runs; it is skipped entirely for reduced motion.
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));

    // Anything already on screen stays visible, so nothing flashes when hiding kicks in.
    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
    }
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    targets.filter((el) => !el.classList.contains("is-visible")).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
