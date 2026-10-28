/** Initials in a forest square: a club's mark until it uploads a logo. */
export function ClubMonogram({ name, logoKey, size = "sm" }: { name: string; logoKey?: string | null; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-20 text-[1.9rem]" : "size-9 text-[0.95rem]";
  if (logoKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- uploaded logos, served as-is
      <img src={`/files/${logoKey}`} alt="" className={`${box} shrink-0 border border-line bg-surface object-contain`} />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÀ-ÿ0-9]/.test(w) && w.length > 1)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <span aria-hidden className={`display grid shrink-0 place-items-center bg-forest text-on-forest ${box}`}>
      {initials}
    </span>
  );
}
