/** Logo inline (no depende de archivos externos, así funciona también en el build de un solo HTML). */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect width="100" height="100" rx="22" fill="rgb(15,23,42)" />
      <g stroke="rgb(148,163,184)" strokeWidth="4" strokeLinecap="round">
        <line x1="50" y1="26" x2="26" y2="66" />
        <line x1="50" y1="26" x2="74" y2="66" />
        <line x1="26" y1="66" x2="74" y2="66" />
        <line x1="26" y1="66" x2="50" y2="80" />
        <line x1="74" y1="66" x2="50" y2="80" />
      </g>
      <circle cx="50" cy="26" r="10" fill="rgb(139,92,246)" />
      <circle cx="26" cy="66" r="9" fill="rgb(16,185,129)" />
      <circle cx="74" cy="66" r="9" fill="rgb(6,182,212)" />
      <circle cx="50" cy="80" r="6" fill="rgb(245,158,11)" />
    </svg>
  );
}
