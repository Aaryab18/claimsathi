import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { RULES_CATALOG, type SourceStatus } from "../lib/rules-catalog";
import { Footer } from "./Footer";
import { Header } from "./Header";

const STATUS_STYLE: Record<SourceStatus, string> = {
  verified: "bg-[#E5F3EC] text-[#0F5132] border-[#BDE3D0]",
  confirming: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  policy: "bg-[#EEF2F8] text-[#27456F] border-[#CFDAEA]",
};

interface RulesScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function RulesScreen({ language, onLanguageChange }: RulesScreenProps) {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
      <Header language={language} onLanguageChange={onLanguageChange} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#113A2B]">{t.rulesTitle}</h1>
          <p className="mt-1 text-sm sm:text-base text-[#526059] leading-relaxed">{t.rulesSubtitle}</p>
        </div>

        <ul data-testid="rules-list" className="flex flex-col gap-3">
          {RULES_CATALOG.map(({ id, name, check, status, source }) => (
            <li key={id} data-testid={`rule-${id}`} className="bg-white rounded-2xl p-5 border border-[#E3E0CE] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">
                  {id}: {name[language]}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${STATUS_STYLE[status]}`}>
                  {t.sourceStatus[status]}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-[#3E4F46] leading-relaxed">{check[language]}</p>
              {source ? (
                <p className="mt-2 text-xs text-[#526059] leading-relaxed">
                  {source.name}, {source.detail}.{" "}
                  <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-[#0F5132] underline">
                    {t.readOfficialSource}
                  </a>
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#526059]">{t.noRegulationCited}</p>
              )}
            </li>
          ))}
        </ul>

        <p className="text-xs sm:text-sm text-[#526059] leading-relaxed">{t.rulesStatusNote}</p>
      </main>

      <Footer language={language} />
    </div>
  );
}
