/** Gauge mark: a half-dial with the needle well into the "good" range. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M8 21a8 8 0 0 1 16 0" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 21a8 8 0 0 1 13.66-5.66" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 21l4.5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="21" r="1.8" fill="white" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-ink-primary">EthiScore</span>
    </span>
  );
}
