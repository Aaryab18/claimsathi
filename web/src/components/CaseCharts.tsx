import type { CaseResult, Finding, LineItem, Verdict } from "@claimsathi/contracts";
import { formatDate, formatRupees } from "../lib/format";
import type { Language, Translations } from "../lib/i18n";
import { translations } from "../lib/i18n";

// Checked with the dataviz palette validator against white. Green and amber sit close together for
// colour-blind readers, so every mark also has a written label beside it.
export const CHART_COLORS = {
  approved: "#2563AE",
  wrong: "#15803D",
  questionable: "#D97706",
  valid: "#7C6BB0",
} as const;

const cardClass = "break-inside-avoid bg-white rounded-2xl p-5 sm:p-6 border border-[#E3E0CE] shadow-xs min-w-0";
const titleClass = "text-base sm:text-lg font-bold tracking-tight text-[#113A2B]";
const noteClass = "mt-0.5 text-xs sm:text-sm text-[#526059]";

function percent(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export function MoneyFlowChart({ caseResult, language }: { caseResult: CaseResult; language: Language }) {
  const t = translations[language];
  const { totals, extracted } = caseResult;
  const approved = extracted.claim.amountApproved;
  if (approved === null) return null;

  const segments = [
    { key: "approved", label: t.chartApproved, amount: approved },
    { key: "wrong", label: t.verdictLabels.wrong, amount: totals.recoverableStrong },
    { key: "questionable", label: t.verdictLabels.questionable, amount: totals.questionable },
    { key: "valid", label: t.verdictLabels.valid, amount: totals.validDeductions },
  ] as const;
  const whole = segments.reduce((sum, { amount }) => sum + amount, 0);
  if (whole === 0) return null;

  return (
    <section data-testid="money-flow-chart" aria-label={t.chartMoneyTitle} className={cardClass}>
      <h2 className={titleClass}>{t.chartMoneyTitle}</h2>
      <p className={noteClass}>{t.chartMoneyNote(formatRupees(whole))}</p>

      <div aria-hidden="true" className="mt-4 flex h-9 gap-0.5">
        {segments
          .filter(({ amount }) => amount > 0)
          .map(({ key, label, amount }) => (
            <div
              key={key}
              title={`${label}: ${formatRupees(amount)} (${Math.round(percent(amount, whole))}%)`}
              style={{ width: `${percent(amount, whole)}%`, background: CHART_COLORS[key] }}
              className="h-full first:rounded-l last:rounded-r transition-all duration-700"
            />
          ))}
      </div>

      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm">
        {segments.map(({ key, label, amount }) => (
          <li key={key} className="flex items-center gap-2 min-w-0">
            <span aria-hidden="true" style={{ background: CHART_COLORS[key] }} className="w-3 h-3 shrink-0 rounded-sm" />
            <span className="text-[#526059] truncate">{label}</span>
            <strong className="ml-auto text-[#132A1E] whitespace-nowrap">
              {formatRupees(amount)} <span className="font-normal text-[#526059]">({Math.round(percent(amount, whole))}%)</span>
            </strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function findingName(finding: Finding, lineItems: LineItem[]): string {
  const names = finding.lineItemIds.flatMap((id) => lineItems.find((item) => item.id === id)?.description ?? []);
  return names.join(", ") || finding.id;
}

function verdictLabel(verdict: Verdict, t: Translations): string {
  return t.verdictLabels[verdict];
}

export function DeductionsChart({ caseResult, language }: { caseResult: CaseResult; language: Language }) {
  const t = translations[language];
  const rows = caseResult.findings.filter(({ amount }) => amount > 0).toSorted((a, b) => b.amount - a.amount);
  if (rows.length === 0) return null;
  const largest = rows[0]!.amount;

  return (
    <section data-testid="deductions-chart" aria-label={t.chartDeductionsTitle} className={cardClass}>
      <h2 className={titleClass}>{t.chartDeductionsTitle}</h2>
      <p className={noteClass}>{t.chartDeductionsNote}</p>

      <ul className="mt-4 flex flex-col gap-3.5">
        {rows.map((finding) => (
          <li key={finding.id} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm">
              <span className="font-medium text-[#132A1E] min-w-0 truncate" title={findingName(finding, caseResult.extracted.lineItems)}>
                {findingName(finding, caseResult.extracted.lineItems)}
              </span>
              <strong className="text-[#132A1E] whitespace-nowrap">{formatRupees(finding.amount)}</strong>
            </div>
            <div aria-hidden="true" className="mt-1 h-3 bg-[#F0EFE7] rounded">
              <div
                title={`${verdictLabel(finding.verdict, t)}: ${formatRupees(finding.amount)}`}
                style={{ width: `${percent(finding.amount, largest)}%`, background: CHART_COLORS[finding.verdict] }}
                className="h-full rounded transition-all duration-700"
              />
            </div>
            <p className="mt-0.5 text-[11px] sm:text-xs text-[#526059]">{verdictLabel(finding.verdict, t)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

const MORATORIUM_MONTHS = 60;
const toTime = (date: string) => new Date(`${date}T00:00:00Z`).getTime();

// Shows why the cover date matters: where the hospital stay falls against the waiting period and moratorium.
export function CoverTimeline({ caseResult, language }: { caseResult: CaseResult; language: Language }) {
  const t = translations[language];
  const { policy, claim } = caseResult.extracted;
  const coverStart = policy.continuousCoverSince ?? policy.startDate;
  const admission = claim.admissionDate;
  if (!coverStart || !admission || toTime(admission) <= toTime(coverStart)) return null;

  const events = [
    { key: "start", date: coverStart, label: t.timelineCoverStart, color: "#526059" },
    ...(policy.pedWaitingMonths
      ? [
          {
            key: "wait",
            date: addMonths(coverStart, policy.pedWaitingMonths),
            label: t.timelineWaitingEnds(policy.pedWaitingMonths),
            color: CHART_COLORS.questionable,
          },
        ]
      : []),
    {
      key: "moratorium",
      date: addMonths(coverStart, MORATORIUM_MONTHS),
      label: t.timelineMoratorium,
      color: CHART_COLORS.valid,
    },
    { key: "admission", date: admission, label: t.timelineAdmission, color: "#114B36" },
  ].toSorted((a, b) => toTime(a.date) - toTime(b.date));

  const from = toTime(coverStart);
  const to = Math.max(...events.map(({ date }) => toTime(date)));
  const position = (date: string) => percent(toTime(date) - from, to - from);

  return (
    <section data-testid="cover-timeline" aria-label={t.timelineTitle} className={cardClass}>
      <h2 className={titleClass}>{t.timelineTitle}</h2>
      <p className={noteClass}>{t.timelineNote}</p>

      <div aria-hidden="true" className="mt-6 mx-2 relative h-5">
        <div className="absolute inset-x-0 top-2 h-1 rounded bg-[#DCE8E1]" />
        <div
          style={{ width: `${position(admission)}%` }}
          className="absolute left-0 top-2 h-1 rounded bg-[#114B36] transition-all duration-700"
        />
        {events.map(({ key, date, label, color }, index) => (
          <span
            key={key}
            title={`${label}: ${formatDate(date, "")}`}
            style={{ left: `${position(date)}%`, background: color }}
            className="absolute top-0 -translate-x-1/2 w-5 h-5 rounded-full ring-2 ring-white text-white text-[10px] font-bold flex items-center justify-center transition-all duration-700"
          >
            {index + 1}
          </span>
        ))}
      </div>

      <ol className="mt-4 flex flex-col gap-1.5 text-xs sm:text-sm">
        {events.map(({ key, date, label, color }, index) => (
          <li key={key} data-testid={`timeline-${key}`} className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden="true"
              style={{ background: color }}
              className="w-5 h-5 shrink-0 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            >
              {index + 1}
            </span>
            <span className={key === "admission" ? "font-semibold text-[#132A1E]" : "text-[#526059]"}>{label}</span>
            <strong className="ml-auto text-[#132A1E] whitespace-nowrap">{formatDate(date, "")}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
