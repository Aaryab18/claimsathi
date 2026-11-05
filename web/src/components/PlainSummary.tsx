import type { CaseResult } from "@claimsathi/contracts";
import { formatRupees } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface PlainSummaryProps {
  caseResult: CaseResult;
  language: Language;
}

export function PlainSummary({ caseResult, language }: PlainSummaryProps) {
  const t = translations[language];
  const { totals, extracted } = caseResult;
  const { claim, policy } = extracted;

  const summaryParagraph = t.summaryText(
    formatRupees(totals.totalDeducted),
    formatRupees(totals.recoverableStrong),
    formatRupees(totals.questionable),
    formatRupees(totals.validDeductions),
  );

  return (
    <section
      aria-label="Claim overview"
      className="bg-[#F6F5ED] rounded-2xl p-5 sm:p-6 border border-[#E3E0CE]"
    >
      <h2 className="text-base sm:text-lg font-bold text-[#113A2B] flex items-center gap-2">
        <svg
          className="w-5 h-5 text-[#15803D]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {t.summaryTitle}
      </h2>

      <p className="mt-2 text-sm sm:text-base text-[#2C3E35] leading-relaxed">
        {summaryParagraph}
      </p>

      {/* Claim metadata pills */}
      <div className="mt-4 pt-3 border-t border-[#E5E2D1] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {claim.patient.name && (
          <div>
            <span className="text-[#68786F] block">{t.patientLabel}</span>
            <span className="font-semibold text-[#113A2B]">{claim.patient.name}</span>
          </div>
        )}
        {claim.insurer && (
          <div>
            <span className="text-[#68786F] block">{t.insurerLabel}</span>
            <span className="font-semibold text-[#113A2B]">{claim.insurer}</span>
          </div>
        )}
        {policy.planType && (
          <div>
            <span className="text-[#68786F] block">{t.policyLabel}</span>
            <span className="font-semibold text-[#113A2B]">{policy.planType}</span>
          </div>
        )}
        {claim.amountClaimed && (
          <div>
            <span className="text-[#68786F] block">Amount claimed</span>
            <span className="font-semibold text-[#113A2B]">
              {formatRupees(claim.amountClaimed)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
