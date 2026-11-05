import type { Totals } from "@claimsathi/contracts";
import { formatRupees } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface RecoverableMeterProps {
  totals: Totals;
  language: Language;
}

export function RecoverableMeter({ totals, language }: RecoverableMeterProps) {
  const t = translations[language];

  const total = totals.totalDeducted || 1;
  const recoverablePct = Math.round((totals.recoverableStrong / total) * 100);
  const questionablePct = Math.round((totals.questionable / total) * 100);
  const validPct = 100 - recoverablePct - questionablePct;

  return (
    <section
      aria-label="Recoverable amount summary"
      className="bg-white rounded-2xl p-5 sm:p-7 border border-[#E3E0D2] shadow-xs"
    >
      <div className="flex flex-col gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#E5F3EC] text-[#115E41] border border-[#C6E6D7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
            {t.recoverableTitle}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="recoverable-amount"
              className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F422F]"
            >
              {formatRupees(totals.recoverableStrong)}
            </span>
            <span className="text-sm font-medium text-[#526059]">
              / {formatRupees(totals.totalDeducted)} {t.totalDeductedTitle.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F0EFE7]">
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#ECE9DC]">
            <div className="text-xs font-medium text-[#7A5B0B] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
              {t.questionableTitle}
            </div>
            <div
              data-testid="questionable-amount"
              className="mt-1 text-lg sm:text-xl font-bold text-[#8C5806]"
            >
              {formatRupees(totals.questionable)}
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#ECE9DC]">
            <div className="text-xs font-medium text-[#526059] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
              {t.validTitle}
            </div>
            <div
              data-testid="valid-amount"
              className="mt-1 text-lg sm:text-xl font-bold text-[#334155]"
            >
              {formatRupees(totals.validDeductions)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#FAF9F5] p-3 rounded-xl border border-[#ECE9DC]">
            <div className="text-xs font-medium text-[#526059]">
              {t.totalDeductedTitle}
            </div>
            <div
              data-testid="total-deducted-amount"
              className="mt-1 text-lg sm:text-xl font-bold text-[#1F2937]"
            >
              {formatRupees(totals.totalDeducted)}
            </div>
          </div>
        </div>

        {/* Labelled Split Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#526059] mb-1.5">
            <span>
              {t.splitBarTitle.replace("{total}", totals.totalDeducted.toLocaleString("en-IN"))}
            </span>
            <span className="font-semibold text-[#113A2B]">
              {recoverablePct}% {t.recoverableTitle.toLowerCase()}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={recoverablePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Deduction split breakdown"
            className="w-full h-3.5 rounded-full overflow-hidden flex bg-[#E7E5D8] p-0.5 gap-0.5"
          >
            <div
              style={{ width: `${recoverablePct}%` }}
              className="h-full bg-[#15803D] rounded-l-full transition-all duration-500"
              title={`${t.verdictLabels.wrong}: ${formatRupees(totals.recoverableStrong)} (${recoverablePct}%)`}
            />
            <div
              style={{ width: `${questionablePct}%` }}
              className="h-full bg-[#D97706] transition-all duration-500"
              title={`${t.verdictLabels.questionable}: ${formatRupees(totals.questionable)} (${questionablePct}%)`}
            />
            <div
              style={{ width: `${validPct}%` }}
              className="h-full bg-[#94A3B8] rounded-r-full transition-all duration-500"
              title={`${t.verdictLabels.valid}: ${formatRupees(totals.validDeductions)} (${validPct}%)`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-[#526059]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#15803D]"></span>
              <span>
                {t.verdictLabels.wrong}:{" "}
                <strong className="text-[#132A1E]">{formatRupees(totals.recoverableStrong)}</strong> ({recoverablePct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]"></span>
              <span>
                {t.verdictLabels.questionable}:{" "}
                <strong className="text-[#132A1E]">{formatRupees(totals.questionable)}</strong> ({questionablePct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#94A3B8]"></span>
              <span>
                {t.verdictLabels.valid}:{" "}
                <strong className="text-[#132A1E]">{formatRupees(totals.validDeductions)}</strong> ({validPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
