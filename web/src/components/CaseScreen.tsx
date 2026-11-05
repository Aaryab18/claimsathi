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
import { CoverTimeline, DeductionsChart, MoneyFlowChart } from "./CaseCharts";
import { LettersSection } from "./LettersSection";
import { NextSteps } from "./NextSteps";
import { formatRupees } from "../lib/format";
import { ConfirmFactsPanel } from "./ConfirmFactsPanel";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

const POLL_INTERVAL_MS = 2000;
const MAX_FAILED_POLLS = 5;

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

  const [pollAttempt, setPollAttempt] = useState(0);
  const [lastChange, setLastChange] = useState<{ from: number; to: number } | null>(null);

  // A correction is made far down the page, so bring the person back up to see the number move.
  const applyCorrection = (updated: CaseResult) => {
    if (caseResult) {
      setLastChange({ from: caseResult.totals.recoverableStrong, to: updated.totals.recoverableStrong });
    }
    setCaseResult(updated);
    document.getElementById("result")?.scrollIntoView?.({ behavior: "smooth" });
  };

  const pollTimerRef = useRef<number | null>(null);
  const failedPollsRef = useRef(0);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await getCase(token);
      setStatus(response.status);
      setIsOffline(false);
      failedPollsRef.current = 0;
      if (response.status.stage === "done") {
        setCaseResult(response.result || sampleCaseResult);
      }
      setLoading(false);
      return response.status.stage;
    } catch {
      if (token === "sample") {
        // If the API can't be reached, show the saved sample labelled "Offline copy: corrections are unavailable"
        setStatus({ stage: "done", progressMessage: "Offline copy" });
        setCaseResult(sampleCaseResult);
        setIsOffline(true);
        setLoading(false);
        return "done";
      }
      // Someone's own case must never be swapped for the sample, so keep trying and then say it failed.
      failedPollsRef.current += 1;
      if (failedPollsRef.current >= MAX_FAILED_POLLS) {
        setError(t.errorMessage);
        setLoading(false);
        return "failed";
      }
      return "reading";
    }
  }, [token, t.errorMessage]);

  const handleRetry = useCallback(() => {
    resetCaseProgress(token);
    setLoading(true);
    setError(null);
    setStatus(null);
    setIsOffline(false);
    failedPollsRef.current = 0;
    setPollAttempt((attempt) => attempt + 1);
  }, [token]);

  useEffect(() => {
    let active = true;

    const runPoll = async () => {
      const stage = await fetchStatus();
      if (!active) return;

      if (stage !== "done" && stage !== "failed") {
        pollTimerRef.current = window.setTimeout(runPoll, POLL_INTERVAL_MS);
      }
    };

    runPoll();

    return () => {
      active = false;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [fetchStatus, pollAttempt]);

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

        {caseResult && caseResult.warnings.length > 0 && (
          <div
            role="note"
            data-testid="assessment-warnings"
            className="p-3.5 sm:p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm"
          >
            <p className="font-semibold">{t.warningsTitle}</p>
            <ul className="mt-1 list-disc pl-4">
              {caseResult.warnings.map((warning) => (
                <li key={warning.code}>{language === "hi" ? warning.messageHi : warning.messageEn}</li>
              ))}
            </ul>
          </div>
        )}

        {caseResult && (
          <>
            {/* 1. Recoverable amount meter */}
            {lastChange && (
              <div
                role="status"
                data-testid="correction-change"
                className="p-3.5 sm:p-4 rounded-xl bg-[#E5F3EC] border border-[#BDE3D0] text-[#0F5132] text-sm font-semibold"
              >
                {lastChange.from === lastChange.to
                  ? t.correctionNoChange(formatRupees(lastChange.to))
                  : t.correctionChanged(formatRupees(lastChange.from), formatRupees(lastChange.to))}
              </div>
            )}

            <RecoverableMeter totals={caseResult.totals} language={language} claim={caseResult.extracted.claim} />

            <nav aria-label={t.sectionNavLabel} className="flex flex-wrap gap-2 print:hidden">
              {[
                ["#breakdown", t.navBreakdown],
                ["#next-steps", t.navNextSteps],
                ["#facts", t.navFacts],
                ["#deadlines", t.navDeadlines],
                ["#letters", t.navLetters],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#D5D2C2] text-xs sm:text-sm font-semibold text-[#114B36] hover:border-[#114B36]"
                >
                  {label}
                </a>
              ))}
              <button
                type="button"
                data-testid="print-report-btn"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-full bg-[#114B36] text-xs sm:text-sm font-semibold text-white hover:bg-[#0E3A2A] cursor-pointer"
              >
                {t.printReport}
              </button>
            </nav>

            {/* 2. Plain-language summary */}
            <PlainSummary caseResult={caseResult} language={language} />

            <NextSteps deadlines={caseResult.deadlines} language={language} />

            <MoneyFlowChart caseResult={caseResult} language={language} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
              <DeductionsChart caseResult={caseResult} language={language} />
              <CoverTimeline caseResult={caseResult} language={language} />
            </div>

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
              onApplyResult={applyCorrection}
            />

            {/* 6. Deadlines section */}
            <DeadlinesSection
              deadlines={caseResult.deadlines}
              language={language}
              caseToken={caseResult.caseToken}
            />

            {/* 7. Letters */}
            <LettersSection caseToken={caseResult.caseToken} language={language} isOffline={isOffline} />
          </>
        )}
      </main>

      <Footer language={language} />
    </div>
  );
}
