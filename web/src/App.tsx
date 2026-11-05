import { useEffect, useState } from "react";
import type { CaseResult, Finding } from "@claimsathi/contracts";
import { getCaseResult } from "./api/client";
import { DeadlinesSection } from "./components/DeadlinesSection";
import { EvidenceModal } from "./components/EvidenceModal";
import { FindingsTable } from "./components/FindingsTable";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { PlainSummary } from "./components/PlainSummary";
import { RecoverableMeter } from "./components/RecoverableMeter";
import type { Language } from "./lib/i18n";
import { translations } from "./lib/i18n";

export function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const t = translations[language];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getCaseResult()
      .then((result) => {
        if (active) {
          setCaseResult(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load case result",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        resultSource={caseResult?.resultSource}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {loading && (
          <div
            data-testid="loading-state"
            aria-live="polite"
            className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E7E5D8]"
          >
            <div className="w-8 h-8 border-3 border-[#114B36] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm font-medium text-[#526059]">
              {t.loadingMessage}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center flex flex-col items-center gap-3"
          >
            <p className="text-sm font-medium text-red-800">{t.errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                getCaseResult()
                  .then((res) => {
                    setCaseResult(res);
                    setLoading(false);
                  })
                  .catch(() => {
                    setError("Failed to load");
                    setLoading(false);
                  });
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#114B36] text-white hover:bg-[#0E3A2A]"
            >
              {t.retryButton}
            </button>
          </div>
        )}

        {caseResult && !loading && (
          <>
            {/* 1. Recoverable amount meter */}
            <RecoverableMeter totals={caseResult.totals} language={language} />

            {/* 2. Plain-language summary */}
            <PlainSummary caseResult={caseResult} language={language} />

            {/* 3. Bill items table */}
            <FindingsTable
              findings={caseResult.findings}
              lineItems={caseResult.extracted.lineItems}
              language={language}
              onSelectFinding={setSelectedFinding}
            />

            {/* 4. Evidence view modal / drawer */}
            <EvidenceModal
              finding={selectedFinding}
              lineItems={caseResult.extracted.lineItems}
              language={language}
              onClose={() => setSelectedFinding(null)}
            />

            {/* 5. Deadlines section */}
            <DeadlinesSection
              deadlines={caseResult.deadlines}
              language={language}
            />
          </>
        )}
      </main>

      <Footer language={language} />
    </div>
  );
}
