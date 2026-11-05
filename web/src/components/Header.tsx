import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  resultSource?: "live" | "saved_sample";
  isOffline?: boolean;
}

export function Header({ language, onLanguageChange, resultSource, isOffline }: HeaderProps) {
  const t = translations[language];

  return (
    <header className="border-b border-[#E3E1D5] bg-[#F4F2EB]/80 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#114B36] flex items-center justify-center text-white font-bold text-lg shadow-xs">
            CS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#113A2B]">
                {t.appName}
              </h1>
              {isOffline ? (
                <span
                  data-testid="offline-copy-badge"
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                >
                  {t.offlineCopyNotice}
                </span>
              ) : resultSource === "saved_sample" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#E7E5D8] text-[#555243] border border-[#D5D2C2]">
                  {t.sampleCase}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[#526059] hidden sm:block">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAE8DD] text-[#3D4D44] border border-[#DDD9C9]">
            <svg
              className="w-3.5 h-3.5 text-[#55695E]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{t.legalDisclaimer}</span>
          </div>

          <div
            role="group"
            aria-label="Language selection"
            className="inline-flex p-0.5 rounded-lg bg-[#E7E5D8] border border-[#D9D6C5]"
          >
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              aria-pressed={language === "en"}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                language === "en"
                  ? "bg-white text-[#114B36] shadow-xs font-semibold"
                  : "text-[#555243] hover:text-[#113A2B]"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("hi")}
              aria-pressed={language === "hi"}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                language === "hi"
                  ? "bg-white text-[#114B36] shadow-xs font-semibold"
                  : "text-[#555243] hover:text-[#113A2B]"
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
