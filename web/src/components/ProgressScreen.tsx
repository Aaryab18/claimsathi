import { useNavigate } from "react-router-dom";
import type { CaseStage } from "@claimsathi/contracts";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface ProgressScreenProps {
  token: string;
  stage: CaseStage;
  errorMessage?: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onRetry: () => void;
}

const STAGES: Array<{ key: "queued" | "reading" | "checking" | "drafting"; titleKey: string; descKey: string }> = [
  { key: "queued", titleKey: "stageQueued", descKey: "stageQueuedDesc" },
  { key: "reading", titleKey: "stageReading", descKey: "stageReadingDesc" },
  { key: "checking", titleKey: "stageChecking", descKey: "stageCheckingDesc" },
  { key: "drafting", titleKey: "stageDrafting", descKey: "stageDraftingDesc" },
];

export function ProgressScreen({
  token,
  stage,
  errorMessage,
  language,
  onLanguageChange,
  onRetry,
}: ProgressScreenProps) {
  const navigate = useNavigate();
  const t = translations[language];

  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
      <Header language={language} onLanguageChange={onLanguageChange} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6 sm:gap-8 justify-center">
        {stage === "failed" ? (
          /* Friendly Failed Card */
          <div
            role="alert"
            data-testid="failed-stage-card"
            className="p-6 sm:p-8 bg-white rounded-2xl border border-red-200 shadow-sm flex flex-col items-center text-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-bold text-[#113A2B]">{t.failedTitle}</h2>
              <p className="text-sm text-[#526059] leading-relaxed max-w-md">
                {errorMessage || t.failedMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2">
              <button
                type="button"
                data-testid="retry-btn"
                onClick={onRetry}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#114B36] hover:bg-[#0E3A2A] text-white text-sm font-semibold shadow-xs focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
              >
                {t.failedRetry}
              </button>
              <button
                type="button"
                data-testid="back-home-btn"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E7E5D8] hover:bg-[#DAD6C5] text-[#113A2B] text-sm font-semibold border border-[#D5D2C2] focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
              >
                {t.backToHome}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Stepper Card (No fake percentages!) */
          <div
            data-testid="progress-card"
            className="p-6 sm:p-8 bg-white rounded-2xl border border-[#E7E5D8] shadow-xs flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#114B36]">
                Case: {token}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#113A2B]">
                {t.progressTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#526059]">
                {t.progressSubtitle}
              </p>
            </div>

            {/* Stage Steps List */}
            <ol
              data-testid="progress-stages-list"
              className="flex flex-col gap-4 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#E7E5D8]"
            >
              {STAGES.map((s, index) => {
                const isCompleted = currentStageIndex > index;
                const isCurrent = currentStageIndex === index;
                const isUpcoming = currentStageIndex < index;

                const stageTitle = t[s.titleKey as keyof typeof t] as string;
                const stageDesc = t[s.descKey as keyof typeof t] as string;

                return (
                  <li
                    key={s.key}
                    data-testid={`stage-${s.key}`}
                    data-status={isCompleted ? "completed" : isCurrent ? "active" : "pending"}
                    className="flex items-start gap-4 relative z-10"
                  >
                    {/* Step Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                        isCompleted
                          ? "bg-[#114B36] text-white"
                          : isCurrent
                          ? "bg-[#114B36] text-white ring-4 ring-[#114B36]/20"
                          : "bg-[#E7E5D8] text-[#8C887B]"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-[#114B36]"
                              : isCompleted
                              ? "text-[#132A1E]"
                              : "text-[#8C887B]"
                          }`}
                        >
                          {stageTitle}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-green-100 text-green-800"
                              : isCurrent
                              ? "bg-emerald-100 text-emerald-800 animate-pulse"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {isCompleted
                            ? t.statusCompleted
                            : isCurrent
                            ? t.statusActive
                            : t.statusPending}
                        </span>
                      </div>
                      <p className="text-xs text-[#526059] mt-0.5">{stageDesc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </main>

      <Footer language={language} />
    </div>
  );
}
