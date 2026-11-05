// Original drawings made for ClaimSathi, so there are no image rights to clear and the page stays fast.

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 300" className={className} aria-hidden="true" fill="none">
      <circle cx="180" cy="150" r="140" fill="#0E3A2A" />
      <g transform="rotate(-6 150 150)">
        <rect x="72" y="52" width="156" height="204" rx="12" fill="#FAF9F5" />
        <rect x="92" y="76" width="74" height="10" rx="5" fill="#114B36" />
        <rect x="92" y="100" width="116" height="7" rx="3.5" fill="#DAD6C5" />
        <rect x="92" y="116" width="96" height="7" rx="3.5" fill="#DAD6C5" />
        <rect x="88" y="136" width="124" height="24" rx="6" fill="#FEF3C7" />
        <rect x="98" y="145" width="62" height="7" rx="3.5" fill="#D97706" />
        <text x="178" y="154" fontSize="14" fontWeight="700" fill="#92400E">₹</text>
        <rect x="92" y="174" width="116" height="7" rx="3.5" fill="#DAD6C5" />
        <rect x="92" y="190" width="80" height="7" rx="3.5" fill="#DAD6C5" />
        <rect x="92" y="206" width="104" height="7" rx="3.5" fill="#DAD6C5" />
      </g>
      <path
        d="M254 96l52 18v48c0 38-24 66-52 78-28-12-52-40-52-78v-48z"
        fill="#F2C879"
        stroke="#0E3A2A"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M232 166l16 17 30-34" stroke="#114B36" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#D6E5DC">
        <circle cx="64" cy="222" r="15" />
        <path d="M38 274c0-20 12-34 26-34s26 14 26 34z" />
        <circle cx="106" cy="238" r="11" fill="#F2C879" />
        <path d="M87 276c0-15 8-25 19-25s19 10 19 25z" fill="#F2C879" />
      </g>
    </svg>
  );
}

const ICON_PATHS = {
  read: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z",
  judge: "M9 12l2 2 4-4m5.6-4A12 12 0 0112 3a12 12 0 01-8.6 3 12 12 0 00.6 8c1.3 3.2 4 5.7 8 7 4-1.3 6.7-3.8 8-7a12 12 0 00.6-8z",
  act: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
} as const;

export function StepIcon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <span className="w-11 h-11 rounded-xl bg-[#E5F3EC] text-[#114B36] flex items-center justify-center">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ICON_PATHS[name]} />
      </svg>
    </span>
  );
}

export function EmptyCasesIllustration() {
  return (
    <svg viewBox="0 0 160 110" className="w-40 h-28" aria-hidden="true" fill="none">
      <rect x="20" y="22" width="120" height="76" rx="10" fill="#F0EDE1" />
      <path d="M20 42h120" stroke="#D5D2C2" strokeWidth="3" />
      <rect x="34" y="54" width="60" height="7" rx="3.5" fill="#D5D2C2" />
      <rect x="34" y="70" width="92" height="7" rx="3.5" fill="#E3E0CE" />
      <circle cx="126" cy="26" r="18" fill="#F2C879" />
      <path d="M126 18v16m-8-8h16" stroke="#114B36" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
