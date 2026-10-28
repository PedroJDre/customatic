/** Customatic mark: a speech bubble whose tail is a loop arrow — feedback that comes back around. */
export function Logo({ className = "", withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-[-0.02em] text-ink ${className}`}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="3" width="28" height="21" rx="7" fill="#2433F5" />
        <path d="M9 24v5.2a.6.6 0 0 0 1 .4L16 24" fill="#2433F5" />
        <path d="M10 13.5h8.5M10 13.5l3-3M10 13.5l3 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="22.5" cy="13.5" r="2.2" fill="#FFC43D" />
      </svg>
      {withText && <span className="text-[17px]">Customatic</span>}
    </span>
  );
}
