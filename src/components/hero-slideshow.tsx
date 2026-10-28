"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

export type Slide = { image: StaticImageData; position: string };

const INTERVAL_MS = 6500;

// Background crossfade behind the hero text. The text never moves; only the photos change.
// Stays on the first photo for reduced motion, and pauses while the tab is hidden.
export function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduced, slides.length]);

  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10">
        {slides.map((slide, i) => (
          <Image
            key={slide.image.src}
            src={slide.image}
            alt=""
            fill
            priority={i === 0}
            placeholder="blur"
            sizes="100vw"
            // A 1.4s crossfade, and a slow zoom that lasts as long as the photo is shown.
            style={{
              objectPosition: slide.position,
              transitionProperty: "opacity, transform",
              transitionDuration: reduced ? "0ms" : "1400ms, 7000ms",
              transitionTimingFunction: "ease-out, linear",
            }}
            className={`object-cover ${i === index ? "scale-[1.05] opacity-100" : "scale-100 opacity-0"}`}
          />
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 end-4 z-10 flex items-center gap-3 sm:end-6">
          <div className="flex gap-1.5" role="group" aria-label="Choisir une photo">
            {slides.map((slide, i) => (
              <button
                key={slide.image.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1} sur ${slides.length}`}
                aria-current={i === index ? "true" : undefined}
                className="grid size-6 place-items-center"
              >
                <span
                  className={`block h-[3px] rounded-full bg-[#f7f5ef] transition-all duration-300 ${
                    i === index ? "w-5 opacity-100" : "w-2.5 opacity-50"
                  }`}
                />
              </button>
            ))}
          </div>
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Reprendre le diaporama" : "Mettre le diaporama en pause"}
              className="grid size-7 place-items-center rounded-full text-[#f7f5ef]/80 transition-colors hover:bg-white/10 hover:text-[#f7f5ef]"
            >
              {paused ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
                  <path d="M3 1.5v9l7.5-4.5z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
                  <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
}
