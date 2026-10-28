"use client";

import { useEffect, useState } from "react";

type Line = { text: string; className?: string };

const CHAR_MS = 55;
const LINE_PAUSE_MS = 420;
const START_DELAY_MS = 250;

// Types the headline out character by character, with a caret.
// Screen readers get the full text at once; without JS or with reduced motion, it's simply shown.
export function TypedHeadline({ lines, className = "" }: { lines: Line[]; className?: string }) {
  const [typed, setTyped] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // With reduced motion, CSS keeps every letter visible; nothing to animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [window.setTimeout(() => setRunning(true), 0)];
    let at = START_DELAY_MS;
    let count = 0;
    for (const line of lines) {
      for (let i = 0; i < line.text.length; i++) {
        count++;
        const n = count;
        // A little irregularity so it reads like real typing, faster on spaces.
        at += line.text[i] === " " ? CHAR_MS * 0.6 : CHAR_MS + ((n * 37) % 23) - 11;
        timers.push(window.setTimeout(() => setTyped(n), at));
      }
      at += LINE_PAUSE_MS;
    }
    timers.push(window.setTimeout(() => setRunning(false), at + 1800));
    return () => timers.forEach(window.clearTimeout);
  }, [lines]);

  // Where each line starts in the overall character count.
  const starts = lines.map((_, i) => lines.slice(0, i).reduce((n, l) => n + l.text.length, 0));
  return (
    <h1 className={className}>
      <span className="sr-only">{lines.map((l) => l.text).join(" ")}</span>
      <span aria-hidden className="typed-headline">
        {lines.map((line, li) => {
          const start = starts[li];
          const end = start + line.text.length;
          const caretHere = running && typed >= start && typed <= end && (typed < end || li === lines.length - 1);
          return (
            <span key={li} className={`block ${line.className ?? ""}`}>
              {line.text.split(/(\s+)/).map((word, wi, words) => {
                const wordStart = start + words.slice(0, wi).join("").length;
                // Spaces stay plain text so the line can wrap between words, never inside one.
                if (/^\s+$/.test(word)) return word;
                return (
                  <span key={wi} className="whitespace-nowrap">
                    {[...word].map((ch, ci) => {
                      const index = wordStart + ci;
                      return (
                        <span key={ci} className={`type-char ${index < typed ? "typed" : ""}`}>
                          {ch}
                          {caretHere && index === typed - 1 && <span className="type-caret" />}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
              {caretHere && typed === start && <span className="type-caret" />}
            </span>
          );
        })}
      </span>
    </h1>
  );
}
