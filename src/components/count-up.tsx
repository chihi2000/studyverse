"use client";

import { useEffect, useRef, useState } from "react";

const numberFormat = new Intl.NumberFormat("fr-TN");
const DURATION_MS = 1400;

// Counts from 0 to `value` when scrolled into view. Server-rendered with the final value,
// so it's correct without JS, and it doesn't animate for reduced motion. While off screen
// it is reset to 0, so the count starts from 0 once it is well in view.
export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          observer.disconnect();
          run();
        } else if (!entry.isIntersecting) {
          setShown(0);
        }
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {numberFormat.format(shown)}
    </span>
  );
}
