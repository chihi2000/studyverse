// Larger line icons for the homepage pillars, drawn in the same stroke style as icons.tsx.
// Every stroke has pathLength=1 so CSS can trace it in (see .draw-icon in globals.css).
type Props = { className?: string };

function DrawIcon({ className = "", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={`draw-icon ${className}`}
    >
      {children}
    </svg>
  );
}

/** A stack of course sheets with a highlighted line and a highlighter. */
export function CoursesIcon(props: Props) {
  return (
    <DrawIcon {...props}>
      <path pathLength={1} d="M16 12h22l8 8v30a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z" />
      <path pathLength={1} d="M38 12v8h8" />
      <path pathLength={1} d="M10 18v34a4 4 0 0 0 4 4h28" />
      <path pathLength={1} d="M20 26h18M20 32h20M20 38h12" />
      <path pathLength={1} className="text-accent" stroke="currentColor" strokeWidth={4} strokeOpacity={0.45} d="M20 32h20" />
      <path pathLength={1} d="m44 46 10-10 4 4-10 10-5 1z" />
      <path pathLength={1} d="m51 39 4 4" />
    </DrawIcon>
  );
}

/** Three club members around a small pennant. */
export function ClubsIcon(props: Props) {
  return (
    <DrawIcon {...props}>
      <circle pathLength={1} cx="20" cy="26" r="5" />
      <circle pathLength={1} cx="44" cy="26" r="5" />
      <circle pathLength={1} cx="32" cy="22" r="6" />
      <path pathLength={1} d="M10 46c0-6 4.5-10 10-10 2.6 0 5 1 6.8 2.6" />
      <path pathLength={1} d="M54 46c0-6-4.5-10-10-10-2.6 0-5 1-6.8 2.6" />
      <path pathLength={1} d="M20 52c0-8 5.4-13 12-13s12 5 12 13" />
      <path pathLength={1} d="M32 4v12" />
      <path pathLength={1} className="text-accent" stroke="currentColor" d="M32 5h10l-3 3.5 3 3.5H32" />
    </DrawIcon>
  );
}

/** A pinned official notice with a stamp, and a notification bell. */
export function AnnouncementsIcon(props: Props) {
  return (
    <DrawIcon {...props}>
      <path pathLength={1} d="M12 14h28a2 2 0 0 1 2 2v34a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" />
      <circle pathLength={1} className="text-accent" stroke="currentColor" cx="26" cy="12" r="3" />
      <path pathLength={1} d="M16 24h16M16 30h20M16 36h12" />
      <circle pathLength={1} cx="33" cy="44" r="4" />
      <path pathLength={1} d="M44 40v-5a8 8 0 1 1 16 0v5l2 3H42z" />
      <path pathLength={1} d="M49.5 47a2.6 2.6 0 0 0 5 0" />
    </DrawIcon>
  );
}

/** A set square, a ruler and a pencil: the kit students buy before the year starts. */
export function EquipmentIcon(props: Props) {
  return (
    <DrawIcon {...props}>
      <path pathLength={1} d="M10 52V14l38 38z" />
      <path pathLength={1} d="M18 44V33l11 11z" />
      <path pathLength={1} d="M10 22h4M10 30h4M10 38h4M18 52v-4M26 52v-4M34 52v-4" />
      <path pathLength={1} d="m40 10 14 14-18 18-14-14z" />
      <path pathLength={1} className="text-accent" stroke="currentColor" d="M50 14 54 10" />
      <path pathLength={1} d="m26 32 3-3M31 37l3-3" />
    </DrawIcon>
  );
}
