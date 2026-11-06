import { useEffect } from "react";
import type { Finding, LineItem } from "@claimsathi/contracts";
import { formatRupees } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { RegulationEvidence } from "./RegulationEvidence";
import { VerdictBadge } from "./FindingsTable";

interface EvidenceModalProps {
  finding: Finding | null;
  lineItems: LineItem[];
  language: Language;
  isSample?: boolean;
  onClose: () => void;
}

export function EvidenceModal({
  finding,
  lineItems,
  language,
  isSample = false,
  onClose,
}: EvidenceModalProps) {
  const t = translations[language];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    if (finding) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [finding, onClose]);

  if (!finding) return null;

  const { evidence } = finding;
  const explanation =
    language === "hi" ? finding.explanationHi : finding.explanationEn;

  const itemsMap = new Map(lineItems.map((item) => [item.id, item]));
  const associatedItems = finding.lineItemIds
    .map((id) => itemsMap.get(id))
    .filter((item): item is LineItem => Boolean(item));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-dialog-title"
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#FAF9F5] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl border border-[#DDD9C9] shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - easy to close on phone */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-[#E3E0CE]">
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={finding.verdict} language={language} />
            <span className="text-xs font-mono font-medium text-[#7A867E]">
              {finding.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeEvidence}
            data-testid="close-evidence-modal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F0EFE7] hover:bg-[#E5E3D5] text-[#113A2B] transition-colors border border-[#DDD9C8] focus:outline-hidden focus:ring-2 focus:ring-[#15803D]"
          >
            <span>{t.closeEvidence}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5">
          {/* Title & Amount */}
          <div>
            <h3
              id="evidence-dialog-title"
              className="text-lg sm:text-xl font-bold text-[#113A2B]"
            >
              {t.evidenceTitle}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F5132]">
                {formatRupees(finding.amount)}
              </span>
              <span className="text-xs text-[#68786F]">
                {t.totalDeductedTitle.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Line items involved */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E7E5D8]">
            <span className="text-xs font-semibold text-[#526059] block mb-2">
              Affected bill items:
            </span>
            <div className="flex flex-col gap-2">
              {associatedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs gap-2 py-1 border-b border-[#F4F3EA] last:border-0"
                >
                  <span className="font-medium text-[#2C3E35]">
                    {item.description || item.id}
                  </span>
                  <span className="font-bold text-[#113A2B] shrink-0">
                    {formatRupees(item.deducted ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-[#F4F2E9] p-4 rounded-xl border border-[#E3E0CF]">
            <span className="text-xs font-semibold text-[#114B36] uppercase tracking-wider block mb-1">
              Assessment Summary
            </span>
            <p className="text-sm text-[#24352D] leading-relaxed font-medium">
              {explanation}
            </p>
          </div>

          {/* Section 1: What the insurer wrote */}
          <div className="bg-white p-4 rounded-xl border border-[#E7E5D8] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7A5B0B]">
              <svg
                className="w-4 h-4 text-[#D97706]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <span>{t.insurerWordsTitle}</span>
            </div>
            {evidence.insurerText ? (
              <blockquote className="mt-1 pl-3 border-l-2 border-[#D97706] text-xs sm:text-sm text-[#3E382A] italic">
                "{evidence.insurerText}"
              </blockquote>
            ) : (
              <p className="text-xs text-[#8A8778] italic">
                No specific remark provided by insurer.
              </p>
            )}
          </div>

          {/* Section 2: Policy clause */}
          <div className="bg-white p-4 rounded-xl border border-[#E7E5D8] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#114B36]">
              <svg
                className="w-4 h-4 text-[#15803D]"
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
              <span>{t.policyClauseTitle}</span>
            </div>
            {evidence.policyClause ? (
              <div className="mt-1 p-2.5 rounded-lg bg-[#FAF9F5] border border-[#ECE9DD] text-xs sm:text-sm text-[#273B30] font-mono">
                {evidence.policyClause}
              </div>
            ) : (
              <p className="text-xs text-[#7B8B82] italic">
                No specific policy clause was cited by the insurer.
              </p>
            )}
          </div>

          {/* Section 3: Regulation & legal reference */}
          <div className="bg-white p-4 rounded-xl border border-[#E7E5D8] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#113A2B] flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-[#15803D]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
                {t.regulationTitle}
              </span>

            </div>

            <RegulationEvidence regulation={evidence.regulation} t={t} />

            {evidence.quoteVerified ? (
              <p data-testid="quote-verified" className="text-[11px] font-semibold text-[#15803D]">
                ✓ {t.quoteVerified}
              </p>
            ) : (
              <p className="text-[11px] text-[#7A8780] italic">
                * {isSample ? t.quoteSampleNotChecked : t.quoteVerificationPending}
              </p>
            )}
          </div>
        </div>

        {/* Footer for phone */}
        <div className="sm:hidden p-3 bg-white border-t border-[#E3E0CE] mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-[#114B36] text-white hover:bg-[#0D3828] transition-colors"
          >
            {t.closeEvidence}
          </button>
        </div>
      </div>
    </div>
  );
}
