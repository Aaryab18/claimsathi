import type { Finding } from "@claimsathi/contracts";
import { caseStrength } from "../lib/case-strength";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

const BAND_COLOR = { strong: "#15803D", fair: "#D97706", limited: "#7C6BB0" } as const;
const ARC_LENGTH = Math.PI * 80;

export function CaseStrengthCard({ findings, language }: { findings: Finding[]; language: Language }) {
  const t = translations[language];
  const strength = caseStrength(findings);
  if (!strength) return null;

  return (
    <section
      data-testid="case-strength"
      aria-label={t.strengthTitle}
      className="break-inside-avoid bg-white rounded-2xl p-5 sm:p-6 border border-[#E3E0CE] shadow-xs min-w-0"
    >
      <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#113A2B]">{t.strengthTitle}</h2>

      <div className="mt-3 flex flex-col items-center">
        <svg viewBox="0 0 200 112" className="w-52 max-w-full" aria-hidden="true">
          <path d="M20 100a80 80 0 01160 0" fill="none" stroke="#F0EFE7" strokeWidth="16" strokeLinecap="round" />
          <path
            d="M20 100a80 80 0 01160 0"
            fill="none"
            stroke={BAND_COLOR[strength.band]}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(strength.score / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
            className="transition-all duration-700"
          />
          <text x="100" y="92" textAnchor="middle" fontSize="36" fontWeight="800" fill="#132A1E">
            {strength.score}
          </text>
          <text x="100" y="108" textAnchor="middle" fontSize="11" fill="#526059">
            / 100
          </text>
        </svg>
        <p data-testid="case-strength-score" className="sr-only">
          {strength.score} / 100
        </p>
        <p data-testid="case-strength-band" className="mt-1 text-base font-bold text-[#113A2B]">
          {t.strengthBands[strength.band]}
        </p>
      </div>

      <p className="mt-2 text-xs sm:text-sm text-[#526059] leading-relaxed">{t.strengthNote}</p>
      <details className="mt-2 text-xs sm:text-sm text-[#526059]">
        <summary className="cursor-pointer font-semibold text-[#0F5132]">{t.strengthHow}</summary>
        <p className="mt-1 leading-relaxed">{t.strengthHowDetail}</p>
      </details>
    </section>
  );
}
