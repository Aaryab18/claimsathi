import type { Finding, LineItem } from "@claimsathi/contracts";
import { formatRupees } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { VerdictBadge } from "./FindingsTable";
import { RegulationEvidence } from "./RegulationEvidence";

interface EvidenceListProps {
  findings: Finding[];
  lineItems: LineItem[];
  language: Language;
}

export function EvidenceList({ findings, lineItems, language }: EvidenceListProps) {
  const t = translations[language];

  return (
    <section data-testid="evidence-list" aria-label={t.navEvidence} className="flex flex-col gap-3 print:hidden">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#113A2B]">{t.evidenceTitle}</h2>
        <p className="text-xs sm:text-sm text-[#526059]">{t.evidencePageSubtitle}</p>
      </div>

      {findings.map((finding) => {
        const names = finding.lineItemIds.flatMap((id) => lineItems.find((item) => item.id === id)?.description ?? []);
        const { insurerText, policyClause, regulation, quoteVerified } = finding.evidence;
        return (
          <article
            key={finding.id}
            data-testid={`evidence-${finding.id}`}
            className="bg-white rounded-xl p-4 sm:p-5 border border-[#E3E0CE] flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VerdictBadge verdict={finding.verdict} language={language} />
              <strong className="text-lg text-[#113A2B]">{formatRupees(finding.amount)}</strong>
            </div>
            <p className="text-sm font-semibold text-[#2C3E35]">{names.join(", ")}</p>

            <div>
              <h3 className="text-xs font-semibold text-[#114B36]">{t.insurerWordsTitle}</h3>
              <p className="mt-0.5 text-xs sm:text-sm text-[#3E4F46]">{insurerText ? `"${insurerText}"` : t.noInsurerWords}</p>
              {insurerText && (
                <p className={`mt-0.5 text-[11px] ${quoteVerified ? "font-semibold text-[#15803D]" : "text-[#6B7971]"}`}>
                  {quoteVerified ? `✓ ${t.quoteVerified}` : t.quoteVerificationPending}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#114B36]">{t.policyClauseTitle}</h3>
              <p className="mt-0.5 text-xs sm:text-sm text-[#3E4F46]">{policyClause ?? t.noPolicyClause}</p>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-[#114B36]">{t.regulationTitle}</h3>
              <RegulationEvidence regulation={regulation} t={t} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
