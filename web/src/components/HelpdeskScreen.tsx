import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDate, formatRupees } from "../lib/format";
import {
  canOpenCase,
  DEMO_CASES,
  loadCases,
  saveCases,
  type HelpdeskCase,
  type HelpdeskStatus,
} from "../lib/helpdesk";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { EmptyCasesIllustration } from "./Illustrations";

const STATUSES: HelpdeskStatus[] = ["new", "complained", "ombudsman", "resolved"];
// Checked with the dataviz palette validator. Each mark also has a written label and count.
const STATUS_COLORS: Record<HelpdeskStatus, string> = {
  new: "#D97706",
  complained: "#2563AE",
  ombudsman: "#7C6BB0",
  resolved: "#15803D",
};

const cardClass = "bg-white rounded-2xl p-5 sm:p-6 border border-[#E3E0CE] shadow-xs min-w-0";
const buttonClass =
  "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[#114B36] text-[#114B36] hover:bg-[#E5F3EC] cursor-pointer";

interface HelpdeskScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function HelpdeskScreen({ language, onLanguageChange }: HelpdeskScreenProps) {
  const t = translations[language];
  const [cases, setCases] = useState<HelpdeskCase[]>(loadCases);

  const update = (next: HelpdeskCase[]) => {
    setCases(next);
    saveCases(next);
  };

  const totalDeducted = cases.reduce((sum, { deducted }) => sum + deducted, 0);
  const totalRecoverable = cases.reduce((sum, { recoverable }) => sum + recoverable, 0);
  const openCases = cases.filter(({ status }) => status !== "resolved").length;
  const hasDemo = cases.some(({ isDemo }) => isDemo);

  const byInsurer = [...new Set(cases.map(({ insurer }) => insurer ?? t.helpdeskUnknownInsurer))]
    .map((insurer) => ({
      insurer,
      amount: cases
        .filter((item) => (item.insurer ?? t.helpdeskUnknownInsurer) === insurer)
        .reduce((sum, { recoverable }) => sum + recoverable, 0),
    }))
    .toSorted((a, b) => b.amount - a.amount);
  const largest = byInsurer[0]?.amount || 1;

  const sorted = cases.toSorted((a, b) => {
    const resolved = Number(a.status === "resolved") - Number(b.status === "resolved");
    return resolved || (a.lastDate ?? "9999").localeCompare(b.lastDate ?? "9999");
  });

  const kpis = [
    [t.helpdeskKpiCases, String(cases.length)],
    [t.helpdeskKpiDeducted, formatRupees(totalDeducted)],
    [t.helpdeskKpiRecoverable, formatRupees(totalRecoverable)],
    [t.helpdeskKpiOpen, String(openCases)],
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
      <Header language={language} onLanguageChange={onLanguageChange} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#113A2B]">{t.helpdeskTitle}</h1>
          <p className="text-sm sm:text-base text-[#526059] leading-relaxed">{t.helpdeskSubtitle}</p>
          <p className="text-xs sm:text-sm text-[#526059]">{t.helpdeskPrivacy}</p>
        </div>

        {hasDemo && (
          <p role="note" data-testid="helpdesk-demo-banner" className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm font-semibold">
            {t.helpdeskDemoBanner}
          </p>
        )}

        {cases.length === 0 ? (
          <section data-testid="helpdesk-empty" className={`${cardClass} flex flex-col items-center text-center gap-3 py-10`}>
            <EmptyCasesIllustration />
            <h2 className="text-lg font-bold text-[#113A2B]">{t.helpdeskEmptyTitle}</h2>
            <p className="text-sm text-[#526059] max-w-md">{t.helpdeskEmptyDesc}</p>
            <button type="button" data-testid="helpdesk-load-demo" onClick={() => update(DEMO_CASES)} className={buttonClass}>
              {t.helpdeskLoadDemo}
            </button>
          </section>
        ) : (
          <>
            <section aria-label={t.helpdeskTitle} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kpis.map(([label, value]) => (
                <div key={label} className="p-4 rounded-2xl bg-white border border-[#E3E0CE] shadow-xs min-w-0">
                  <p className="text-xs text-[#526059]">{label}</p>
                  <p data-testid={`kpi-${label}`} className="mt-1 text-xl sm:text-2xl font-extrabold text-[#113A2B] truncate">
                    {value}
                  </p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <section data-testid="helpdesk-by-insurer" aria-label={t.helpdeskByInsurerTitle} className={cardClass}>
                <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">{t.helpdeskByInsurerTitle}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {byInsurer.map(({ insurer, amount }) => (
                    <li key={insurer}>
                      <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm">
                        <span className="font-medium truncate">{insurer}</span>
                        <strong className="whitespace-nowrap">{formatRupees(amount)}</strong>
                      </div>
                      <div aria-hidden="true" className="mt-1 h-3 rounded bg-[#F0EFE7]">
                        <div
                          title={`${insurer}: ${formatRupees(amount)}`}
                          style={{ width: `${(amount / largest) * 100}%` }}
                          className="h-full rounded bg-[#15803D]"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section data-testid="helpdesk-by-status" aria-label={t.helpdeskByStatusTitle} className={cardClass}>
                <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">{t.helpdeskByStatusTitle}</h2>
                <div aria-hidden="true" className="mt-4 flex h-6 gap-0.5">
                  {STATUSES.map((status) => {
                    const count = cases.filter((item) => item.status === status).length;
                    return count > 0 ? (
                      <div
                        key={status}
                        title={`${t.helpdeskStatuses[status]}: ${count}`}
                        style={{ flexGrow: count, background: STATUS_COLORS[status] }}
                        className="h-full first:rounded-l last:rounded-r"
                      />
                    ) : null;
                  })}
                </div>
                <ul className="mt-3 flex flex-col gap-1.5 text-xs sm:text-sm">
                  {STATUSES.map((status) => (
                    <li key={status} className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ background: STATUS_COLORS[status] }} className="w-3 h-3 rounded-sm" />
                      <span className="text-[#526059]">{t.helpdeskStatuses[status]}</span>
                      <strong className="ml-auto">{cases.filter((item) => item.status === status).length}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section aria-label={t.helpdeskTableTitle} className={cardClass}>
              <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">{t.helpdeskTableTitle}</h2>
              <ul data-testid="helpdesk-cases" className="mt-3 flex flex-col divide-y divide-[#F0EFE7]">
                {sorted.map((item) => (
                  <li key={item.id} className="py-3 grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-2 sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#113A2B] truncate">
                        {item.reference} · {item.insurer ?? t.helpdeskUnknownInsurer}
                      </p>
                      <p className="text-xs text-[#526059]">
                        {t.verdictLabels.wrong}: {formatRupees(item.recoverable)} / {formatRupees(item.deducted)}
                      </p>
                      {canOpenCase(item) && (
                        <Link to={`/case/${item.id}`} className="text-xs font-semibold text-[#0F5132] underline">
                          {t.helpdeskOpen}
                        </Link>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm">
                      <span className="text-[#526059]">{t.helpdeskColLastDate}: </span>
                      <strong>{formatDate(item.lastDate, t.datePending)}</strong>
                    </p>
                    <label className="text-xs text-[#526059]">
                      <span className="sr-only">{t.helpdeskColStatus}</span>
                      <select
                        data-testid={`status-${item.id}`}
                        value={item.status}
                        onChange={(e) =>
                          update(
                            cases.map((other) =>
                              other.id === item.id ? { ...other, status: e.target.value as HelpdeskStatus } : other,
                            ),
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5D2C2] bg-white text-xs sm:text-sm text-[#132A1E]"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t.helpdeskStatuses[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <div>
              <button type="button" data-testid="helpdesk-clear" onClick={() => update([])} className={buttonClass}>
                {t.helpdeskClear}
              </button>
            </div>
          </>
        )}
      </main>

      <Footer language={language} />
    </div>
  );
}
