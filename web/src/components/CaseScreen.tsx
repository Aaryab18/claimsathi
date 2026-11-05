import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { sampleCaseResult, type CaseResult, type CaseStatus, type Finding } from "@claimsathi/contracts";
import { getCase, resetCaseProgress } from "../api/client";
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
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const pollTimerRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await getCase(token);
      setStatus(response.status);
      setIsOffline(false);
      if (response.status.stage === "done") {
        setCaseResult(response.result || sampleCaseResult);
      }
      setLoading(false);
      return response.status.stage;
    } catch {
      // If the API can't be reached, show the saved sample labelled "Offline copy: corrections are unavailable"
      setStatus({ stage: "done", progressMessage: "Offline copy" });
      setCaseResult(sampleCaseResult);
      setIsOffline(true);
      setLoading(false);
      return "done";
    }
  }, [token]);

  const handleRetry = useCallback(() => {
    resetCaseProgress(token);
    setLoading(true);
    setError(null);
    setStatus(null);
    setIsOffline(false);
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
            <p
              data-testid="waking-message"
              className="mt-1.5 text-xs text-[#8C887B]"
            >
              {t.serverWakingMessage}
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
        resultSource={isOffline ? undefined : caseResult?.resultSource}
        isOffline={isOffline}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {isOffline && (
          <div
            role="note"
            data-testid="offline-copy-banner"
            className="p-3.5 sm:p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm flex items-center gap-3 shadow-xs"
          >
            <svg
              className="w-5 h-5 shrink-0 text-[#B45309]"
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
            <p className="font-semibold leading-relaxed">
              {t.offlineCopyNotice}
            </p>
          </div>
        )}

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
              isOffline={isOffline}
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
