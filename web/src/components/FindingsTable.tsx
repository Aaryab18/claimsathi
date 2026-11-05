import type { Finding, LineItem } from "@claimsathi/contracts";
import { formatRupees } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface FindingsTableProps {
  findings: Finding[];
  lineItems: LineItem[];
  language: Language;
  onSelectFinding: (finding: Finding) => void;
}

const VERDICT_EDGE = {
  wrong: "border-l-[#15803D]",
  questionable: "border-l-[#D97706]",
  valid: "border-l-[#7C6BB0]",
} as const;

export function FindingsTable({
  findings,
  lineItems,
  language,
  onSelectFinding,
}: FindingsTableProps) {
  const t = translations[language];
  const itemsMap = new Map(lineItems.map((item) => [item.id, item]));

  return (
    <section id="breakdown" aria-label={t.findingsTitle} className="scroll-mt-24 flex flex-col gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#113A2B]">
          {t.findingsTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#526059]">
          {t.findingsSubtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3" role="table" aria-label="Findings table">
        {findings.map((finding) => {
          const explanation =
            language === "hi" ? finding.explanationHi : finding.explanationEn;

          const associatedItems = finding.lineItemIds
            .map((id) => itemsMap.get(id))
            .filter((item): item is LineItem => Boolean(item));

          return (
            <div
              key={finding.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectFinding(finding)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectFinding(finding);
                }
              }}
              data-testid={`finding-row-${finding.id}`}
              className={`bg-white rounded-xl p-4 sm:p-5 border border-[#E3E0CE] border-l-[6px] ${VERDICT_EDGE[finding.verdict]} hover:shadow-md transition-all cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-[#15803D] focus:ring-offset-2`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F2EFE6]">
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={finding.verdict} language={language} />
                  {finding.verdict !== "valid" && (
                    <span
                      data-testid={`confidence-${finding.id}`}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F6F5ED] text-[#2C3E35] border border-[#E5E2D2]"
                    >
                      {t.confidenceLabels[finding.confidence]}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 sm:text-right">
                  <span className="text-xs text-[#68786F] sm:hidden">{t.deductedLabel}:</span>
                  <span className="text-xl font-bold text-[#113A2B]">
                    {formatRupees(finding.amount)}
                  </span>
                </div>
              </div>

              {/* Line item names */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {associatedItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#F6F5ED] text-[#2C3E35] border border-[#E5E2D2]"
                  >
                    <span>{item.description || item.id}</span>
                    <span className="text-[#6D7D74]">({formatRupees(item.deducted ?? 0)})</span>
                  </span>
                ))}
              </div>

              {/* Explanation preview */}
              <p className="mt-2 text-sm text-[#3E4F46] leading-relaxed">
                {explanation}
              </p>

              {/* Call to action */}
              <div className="mt-3 flex items-center justify-between text-xs font-medium text-[#115E41]">
                <span className="flex items-center gap-1 text-[#0F5132] font-semibold">
                  <svg
                    className="w-3.5 h-3.5"
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
                  {t.viewEvidenceBtn}
                </span>
                <span className="text-[#68786F] hidden sm:inline">
                  {t.clickToViewEvidence}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function VerdictBadge({
  verdict,
  language,
}: {
  verdict: "wrong" | "questionable" | "valid";
  language: Language;
}) {
  const t = translations[language];

  if (verdict === "wrong") {
    return (
      <span
        data-testid="verdict-wrong"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E5F3EC] text-[#0F5132] border border-[#BDE3D0]"
      >
        <svg
          className="w-3.5 h-3.5 text-[#15803D] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{t.verdictLabels.wrong}</span>
      </span>
    );
  }

  if (verdict === "questionable") {
    return (
      <span
        data-testid="verdict-questionable"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
      >
        <svg
          className="w-3.5 h-3.5 text-[#D97706] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{t.verdictLabels.questionable}</span>
      </span>
    );
  }

  return (
    <span
      data-testid="verdict-valid"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1EEF8] text-[#4C3F7A] border border-[#D6CEEA]"
    >
      <svg
        className="w-3.5 h-3.5 text-[#7C6BB0] shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>{t.verdictLabels.valid}</span>
    </span>
  );
}
