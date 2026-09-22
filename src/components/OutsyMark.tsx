// The Outsy brand mark: a navy tile holding a white ring, a three-color
// petal burst (coral/gold/teal), and a small sparkle. Colors are sampled
// directly from the approved brand sheet (see second-brain/projects/Outsy.md).
export function OutsyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect width="120" height="120" rx="28" fill="#0B1B34" />
      <rect x="56" y="24" width="8" height="20" rx="4" fill="#FFB703" transform="rotate(-34 60 44)" />
      <rect x="56" y="16" width="8" height="28" rx="4" fill="#FD5157" />
      <rect x="56" y="24" width="8" height="20" rx="4" fill="#04A7A5" transform="rotate(34 60 44)" />
      <circle cx="60" cy="68" r="18" fill="none" stroke="#FFFFFF" strokeWidth="12" />
      <path fill="#FFB703" d="M94,67 Q97,71 101,74 Q97,77 94,81 Q91,77 87,74 Q91,71 94,67 Z" />
    </svg>
  );
}
