import { useState, type FormEvent } from "react";
import type { CaseResult, FactOverrides, LineItemCategory } from "@claimsathi/contracts";
import { applyFacts } from "../api/client";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { formatRupees } from "../lib/format";

interface ConfirmFactsPanelProps {
  caseResult: CaseResult;
  language: Language;
  isOffline?: boolean;
  onApplyResult?: (updatedResult: CaseResult) => void;
}

const CATEGORIES: LineItemCategory[] = [
  "room",
  "pharmacy",
  "consumable",
  "implant",
  "diagnostic",
  "procedure",
  "admin",
  "other",
];

export function ConfirmFactsPanel({
  caseResult,
  language,
  isOffline,
  onApplyResult,
}: ConfirmFactsPanelProps) {
  const t = translations[language];
  const { extracted, caseToken } = caseResult;

  const [policyStartDate, setPolicyStartDate] = useState(
    extracted.policy.startDate ?? "",
  );
  const [continuousCoverSince, setContinuousCoverSince] = useState(
    extracted.policy.continuousCoverSince ?? "",
  );
  const [admissionDate, setAdmissionDate] = useState(
    extracted.claim.admissionDate ?? "",
  );

  // Map each line item id to its selected category
  const [categories, setCategories] = useState<Record<string, LineItemCategory>>(
    () => {
      const initial: Record<string, LineItemCategory> = {};
      for (const item of extracted.lineItems) {
        if (item.category) {
          initial[item.id] = item.category;
        }
      }
      return initial;
    },
  );

  const [isApplying, setIsApplying] = useState(false);
  const [hasAppliedCorrections, setHasAppliedCorrections] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [grievanceSentDate, setGrievanceSentDate] = useState("");
  const [askedForDocument, setAskedForDocument] = useState<"" | "yes" | "no">("");
  const hasDocumentDeduction = caseResult.extracted.lineItems.some(
    (item) => item.deductionType === "documentation" && (item.deducted ?? 0) > 0,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    setIsApplying(true);
    setErrorMessage(null);

    const overrides: FactOverrides = {
      policyStartDate: policyStartDate || undefined,
      continuousCoverSince: continuousCoverSince || undefined,
      admissionDate: admissionDate || undefined,
      grievanceSentDate: grievanceSentDate || undefined,
      insurerAskedForMissingDocument: askedForDocument ? askedForDocument === "yes" : undefined,
      lineItemCategories: Object.entries(categories).map(([lineItemId, category]) => ({
        lineItemId,
        category,
      })),
    };

    try {
      const updated = await applyFacts(caseToken, overrides);
      setHasAppliedCorrections(true);
      if (onApplyResult) {
        onApplyResult(updated);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section
      id="facts"
      data-testid="confirm-facts-panel"
      className="scroll-mt-24 bg-white rounded-2xl border border-[#E7E5D8] shadow-xs overflow-hidden print:hidden"
    >
      {/* Header / Accordion toggle */}
      <div className="p-4 sm:p-5 border-b border-[#E7E5D8] flex items-center justify-between gap-3 bg-[#FDFCF7]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EAE8DD] text-[#114B36] flex items-center justify-center">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">
              {t.confirmFactsTitle}
            </h2>
            <p className="text-xs text-[#526059]">{t.confirmFactsSubtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="confirm-facts-content"
          className="text-xs font-semibold text-[#114B36] hover:underline px-2.5 py-1 rounded bg-[#E7E5D8] cursor-pointer"
        >
          {isOpen ? (language === "hi" ? "छिपाएं" : "Collapse") : (language === "hi" ? "देखें" : "Expand")}
        </button>
      </div>

      {isOpen && (
        <form
          id="confirm-facts-content"
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 flex flex-col gap-6"
        >
          {/* Offline notice */}
          {isOffline && (
            <div
              role="note"
              data-testid="offline-copy-note"
              className="p-3 sm:p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs flex items-center gap-2.5"
            >
              <svg
                className="w-4 h-4 shrink-0 text-[#B45309]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold">{t.offlineCopyNotice}</span>
            </div>
          )}

          {/* Key Dates Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fact-policy-start-date"
                className="text-xs font-bold text-[#113A2B]"
              >
                {t.policyStartDateLabel}
              </label>
              <input
                id="fact-policy-start-date"
                data-testid="fact-policy-start-date"
                type="date"
                value={policyStartDate}
                onChange={(e) => setPolicyStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5D2C2] bg-[#FAF9F5] text-xs font-medium text-[#132A1E] focus:bg-white focus:ring-2 focus:ring-[#114B36] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fact-continuous-cover"
                className="text-xs font-bold text-[#113A2B]"
              >
                {t.continuousCoverDateLabel}
              </label>
              <input
                id="fact-continuous-cover"
                data-testid="fact-continuous-cover"
                type="date"
                value={continuousCoverSince}
                onChange={(e) => setContinuousCoverSince(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5D2C2] bg-[#FAF9F5] text-xs font-medium text-[#132A1E] focus:bg-white focus:ring-2 focus:ring-[#114B36] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fact-admission-date"
                className="text-xs font-bold text-[#113A2B]"
              >
                {t.admissionDateLabel}
              </label>
              <input
                id="fact-admission-date"
                data-testid="fact-admission-date"
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5D2C2] bg-[#FAF9F5] text-xs font-medium text-[#132A1E] focus:bg-white focus:ring-2 focus:ring-[#114B36] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="fact-grievance-sent" className="text-xs font-semibold text-[#113A2B]">
                {t.grievanceSentLabel}
              </label>
              <input
                type="date"
                id="fact-grievance-sent"
                data-testid="fact-grievance-sent"
                value={grievanceSentDate}
                onChange={(e) => setGrievanceSentDate(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-[#FAF9F5] text-xs"
              />
            </div>

            {hasDocumentDeduction && (
              <div className="flex flex-col gap-1">
                <label htmlFor="fact-asked-for-document" className="text-xs font-semibold text-[#113A2B]">
                  {t.askedForDocumentLabel}
                </label>
                <select
                  id="fact-asked-for-document"
                  data-testid="fact-asked-for-document"
                  value={askedForDocument}
                  onChange={(e) => setAskedForDocument(e.target.value as "" | "yes" | "no")}
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-[#FAF9F5] text-xs"
                >
                  <option value="">{t.askedNotSure}</option>
                  <option value="yes">{t.askedYes}</option>
                  <option value="no">{t.askedNo}</option>
                </select>
              </div>
            )}
          </div>

          {/* Bill Items Category Review: kept out of the way, as most people only need the dates */}
          <details className="flex flex-col gap-3 group">
            <summary className="cursor-pointer list-none flex flex-col pb-2">
              <h3 className="text-sm font-bold text-[#113A2B]">
                <span className="inline-block mr-1.5 transition-transform group-open:rotate-90">›</span>
                {t.billItemCategoriesTitle}
              </h3>
              <p className="text-xs text-[#526059]">
                {t.billItemCategoriesDesc}
              </p>
            </summary>

            <div className="divide-y divide-[#E7E5D8] border border-[#E7E5D8] rounded-xl overflow-hidden">
              {extracted.lineItems.map((item) => {
                const currentCategory = categories[item.id] || item.category || "other";
                return (
                  <div
                    key={item.id}
                    data-testid={`fact-item-row-${item.id}`}
                    className="p-3 bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#6B7871] font-semibold">
                          {item.id}
                        </span>
                        <span className="text-xs font-bold text-[#113A2B] truncate">
                          {item.description || "Unspecified charge"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#526059] mt-0.5">
                        <span>{t.billedLabel}: {formatRupees(item.billed ?? 0)}</span>
                        {item.deducted ? (
                          <span className="ml-2 font-semibold text-amber-800">
                            {t.deductedLabel}: {formatRupees(item.deducted)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor={`fact-category-${item.id}`}
                        className="text-xs text-[#526059] font-medium sr-only sm:not-sr-only"
                      >
                        Category:
                      </label>
                      <select
                        id={`fact-category-${item.id}`}
                        data-testid={`fact-category-select-${item.id}`}
                        value={currentCategory}
                        onChange={(e) => {
                          const val = e.target.value as LineItemCategory;
                          setCategories((prev) => ({ ...prev, [item.id]: val }));
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-[#D5D2C2] bg-white text-xs font-semibold text-[#113A2B] focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {t.categoryLabels[cat] || cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              data-testid="apply-facts-error"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submission Feedback */}
          {hasAppliedCorrections && (
            <div
              role="status"
              data-testid="corrections-applied-status"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t.correctionsAppliedMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {isOffline && (
              <span className="text-[11px] text-[#8C887B] italic">
                {t.offlineCopyNotice}
              </span>
            )}
            <button
              type="submit"
              data-testid="apply-corrections-btn"
              disabled={isApplying || isOffline}
              className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold shadow-xs focus:ring-2 focus:ring-[#114B36] focus:outline-hidden ${
                isOffline
                  ? "bg-[#E7E5D8] text-[#8C887B] cursor-not-allowed opacity-80"
                  : "bg-[#114B36] hover:bg-[#0E3A2A] text-white cursor-pointer disabled:opacity-50"
              }`}
            >
              {isApplying ? t.applyingCorrections : t.applyCorrectionsBtn}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
