// Splits a heading into words that reveal one after another as the heading scrolls into view
// (see .scroll-words in globals.css). Without scroll timelines the words are simply shown.
export function ScrollWords({ text, start = 0 }: { text: string; start?: number }) {
  return text.split(" ").map((word, i) => (
    <span key={i}>
      {i > 0 && " "}
      <span className="sw-word" style={{ "--w": start + i } as React.CSSProperties}>
        {word}
      </span>
    </span>
  ));
}
