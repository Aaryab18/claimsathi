import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import type { CaseResult, CaseStatus, Finding } from "@claimsathi/contracts";
import { getCase, getCaseResult, resetCaseProgress } from "../api/client";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ProgressScreen } from "./ProgressScreen";
import { RecoverableMeter } from "./RecoverableMeter";
import { PlainSummary } from "./PlainSummary";
import { FindingsTable } from "./FindingsTable";
import { EvidenceModal } from "./EvidenceModal";
import { DeadlinesSection } from "./DeadlinesSection";
import { ConfirmFactsPanel } from "./ConfirmFactsPanel";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface CaseScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function CaseScreen({ language, onLanguageChange }: CaseScreenProps) {
  const { token = "sample" } = useParams<{ token: string }>();
  const t = translations[language];

  const [status, setStatus] = useState<CaseStatus | null>(null);
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const pollTimerRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await getCase(token);
      setStatus(response.status);
      if (response.status.stage === "done" && response.result) {
        const result = await getCaseResult(token);
        setCaseResult(result);
      }
      setLoading(false);
      return response.status.stage;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorMessage);
      setLoading(false);
      return "failed";
    }
  }, [token, t.errorMessage]);

  const handleRetry = useCallback(() => {
    resetCaseProgress(token);
    setLoading(true);
    setError(null);
    setStatus(null);
    fetchStatus();
  }, [token, fetchStatus]);

  useEffect(() => {
    let active = true;

    const runPoll = async () => {
      const stage = await fetchStatus();
      if (!active) return;

      if (stage !== "done" && stage !== "failed") {
        pollTimerRef.current = window.setTimeout(runPoll, 600);
      }
    };

    runPoll();

    return () => {
      active = false;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [fetchStatus]);

  // Loading initial state
  if (loading && !status) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
        <Header language={language} onLanguageChange={onLanguageChange} />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
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
        </main>
        <Footer language={language} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
        <Header language={language} onLanguageChange={onLanguageChange} />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <div
            role="alert"
            className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center flex flex-col items-center gap-3"
          >
            <p className="text-sm font-medium text-red-800">{t.errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#114B36] text-white hover:bg-[#0E3A2A]"
            >
              {t.retryButton}
            </button>
          </div>
        </main>
        <Footer language={language} />
      </div>
    );
  }

  // Progress screen if not done yet or failed
  if (status && status.stage !== "done") {
    return (
      <ProgressScreen
        token={token}
        stage={status.stage}
        errorMessage={status.errorMessage}
        language={language}
        onLanguageChange={onLanguageChange}
        onRetry={handleRetry}
      />
    );
  }

  // Results Dashboard when stage is done
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
      <Header
        language={language}
        onLanguageChange={onLanguageChange}
        resultSource={caseResult?.resultSource}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {caseResult && (
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

            {/* 5. Confirm the facts panel */}
            <ConfirmFactsPanel
              caseResult={caseResult}
              language={language}
              onApplyResult={(updated) => setCaseResult(updated)}
            />

            {/* 6. Deadlines section */}
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
