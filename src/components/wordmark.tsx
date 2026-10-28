export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display text-[1.45rem] leading-none ${className}`}>
      Studyverse<span className="text-accent">.</span>
    </span>
  );
}
