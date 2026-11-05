import type { ClaimDetails, Totals } from "@claimsathi/contracts";
import { formatRupees } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { AnimatedRupees } from "./AnimatedRupees";

interface RecoverableMeterProps {
  totals: Totals;
  language: Language;
  claim?: ClaimDetails;
}

export function RecoverableMeter({ totals, language, claim }: RecoverableMeterProps) {
  const t = translations[language];

  const total = totals.totalDeducted || 1;
  const recoverablePct = Math.round((totals.recoverableStrong / total) * 100);
  const questionablePct = Math.round((totals.questionable / total) * 100);
  const validPct = 100 - recoverablePct - questionablePct;
  const claimed = claim?.amountClaimed ?? null;
  const approved = claim?.amountApproved ?? null;

  return (
    <section
      id="result"
      aria-label="Recoverable amount summary"
      className="scroll-mt-24 rounded-3xl overflow-hidden shadow-md border border-[#0E3A2A]"
    >
      {/* The one number the family came for */}
      <div className="bg-[#114B36] text-[#FAF9F5] p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F2C879]">
          <span className="w-2 h-2 rounded-full bg-[#F2C879]"></span>
          {t.recoverableTitle}
        </span>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            data-testid="recoverable-amount"
            className="text-5xl sm:text-7xl font-extrabold tracking-tight"
          >
            <AnimatedRupees amount={totals.recoverableStrong} />
          </span>
          <span className="text-sm sm:text-base font-medium text-[#D6E5DC]">
            / {formatRupees(totals.totalDeducted)} {t.totalDeductedTitle.toLowerCase()}
          </span>
        </div>

        {claimed !== null && approved !== null && (
          <p data-testid="claim-flow" className="mt-3 text-sm text-[#D6E5DC]">
            {t.claimFlow(formatRupees(claimed), formatRupees(approved))}
          </p>
        )}
      </div>

      <div className="bg-white p-5 sm:p-7 flex flex-col gap-5">
        {/* Labelled Split Bar */}
        <div>
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-medium text-[#526059] mb-2">
            <span>
              {t.splitBarTitle.replace("{total}", totals.totalDeducted.toLocaleString("en-IN"))}
            </span>
            <span className="font-semibold text-[#113A2B] text-right">
              {recoverablePct}% {t.recoverableTitle.toLowerCase()}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={recoverablePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Deduction split breakdown"
            className="w-full h-5 rounded-full overflow-hidden flex bg-[#E7E5D8] gap-0.5"
          >
            <div
              style={{ width: `${recoverablePct}%` }}
              className="h-full bg-[#15803D] transition-all duration-700"
              title={`${t.verdictLabels.wrong}: ${formatRupees(totals.recoverableStrong)} (${recoverablePct}%)`}
            />
            <div
              style={{ width: `${questionablePct}%` }}
              className="h-full bg-[#D97706] transition-all duration-700"
              title={`${t.verdictLabels.questionable}: ${formatRupees(totals.questionable)} (${questionablePct}%)`}
            />
            <div
              style={{ width: `${validPct}%` }}
              className="h-full bg-[#94A3B8] transition-all duration-700"
              title={`${t.verdictLabels.valid}: ${formatRupees(totals.validDeductions)} (${validPct}%)`}
            />
          </div>
        </div>

        {/* What each part of the bar means */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#E5F3EC] border border-[#BDE3D0]">
            <div className="text-xs font-semibold text-[#0F5132]">
              {t.verdictLabels.wrong} ({recoverablePct}%)
            </div>
            <div className="mt-1 text-xl font-bold text-[#0F5132]">{formatRupees(totals.recoverableStrong)}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A]">
            <div className="text-xs font-semibold text-[#92400E]">
              {t.questionableTitle} ({questionablePct}%)
            </div>
            <div data-testid="questionable-amount" className="mt-1 text-xl font-bold text-[#8C5806]">
              <AnimatedRupees amount={totals.questionable} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1]">
            <div className="text-xs font-semibold text-[#475569]">
              {t.validTitle} ({validPct}%)
            </div>
            <div data-testid="valid-amount" className="mt-1 text-xl font-bold text-[#334155]">
              <AnimatedRupees amount={totals.validDeductions} />
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#526059]">
          {t.totalDeductedTitle}:{" "}
          <strong data-testid="total-deducted-amount" className="text-[#1F2937]">
            {formatRupees(totals.totalDeducted)}
          </strong>
        </p>
      </div>
    </section>
  );
}
