import { useState } from "react";
import type { LetterLanguage, LetterType } from "@claimsathi/contracts";
import { createLetter } from "../api/client";
import { OmbudsmanFinder } from "./OmbudsmanFinder";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface LettersSectionProps {
  caseToken: string;
  language: Language;
  isOffline: boolean;
  grievanceReference: string;
}

function printLetter(text: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const paragraph = printWindow.document.createElement("pre");
  paragraph.style.cssText = "white-space:pre-wrap;font:12pt/1.5 Georgia,serif;margin:0";
  paragraph.textContent = text;
  printWindow.document.title = "ClaimSathi letter";
  printWindow.document.body.appendChild(paragraph);
  printWindow.print();
}

export function LettersSection({ caseToken, language, isOffline, grievanceReference }: LettersSectionProps) {
  const t = translations[language];
  const [letterType, setLetterType] = useState<LetterType | null>(null);
  // Follows the page's language until the person picks another one for the letter.
  const [chosenLanguage, setChosenLanguage] = useState<LetterLanguage | null>(null);
  const letterLanguage = chosenLanguage ?? language;
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError(t.letterCopyError);
    }
  };

  const openLetter = async (type: LetterType, lang: LetterLanguage = letterLanguage) => {
    setIsLoading(true);
    setError(null);
    try {
      const letter = await createLetter(caseToken, type, lang, type === "ombudsman" ? grievanceReference : undefined);
      setLetterType(type);
      setText(letter.text);
      setCopied(false);
    } catch {
      setError(t.letterError);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClass =
    "px-4 py-2 rounded-xl bg-[#114B36] hover:bg-[#0E3A2A] text-white text-xs sm:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <section id="letters" aria-label={t.lettersTitle} className="scroll-mt-24 print:hidden bg-white rounded-2xl p-5 sm:p-6 border border-[#E7E5D8] flex flex-col gap-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">{t.lettersTitle}</h2>
        <p className="mt-1 text-xs sm:text-sm text-[#526059]">{t.lettersDesc}</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="letter-language" className="text-xs font-semibold text-[#113A2B]">
          {t.letterLanguageLabel}
        </label>
        <select
          id="letter-language"
          data-testid="letter-language"
          value={letterLanguage}
          onChange={(e) => {
            const next = e.target.value as LetterLanguage;
            setChosenLanguage(next);
            if (letterType) void openLetter(letterType, next);
          }}
          className="w-full sm:w-56 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-white text-sm"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select>
        <p className="text-[11px] sm:text-xs text-[#526059]">{t.letterLanguageNote}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          data-testid="letter-grievance-btn"
          disabled={isLoading || isOffline}
          onClick={() => openLetter("grievance")}
          className={buttonClass}
        >
          {t.letterGrievanceButton}
        </button>
        <button
          type="button"
          data-testid="letter-ombudsman-btn"
          disabled={isLoading || isOffline}
          onClick={() => openLetter("ombudsman")}
          className={buttonClass}
        >
          {t.letterOmbudsmanButton}
        </button>
      </div>

      <OmbudsmanFinder language={language} />

      {error && (
        <p role="alert" className="text-xs text-red-800">
          {error}
        </p>
      )}

      {letterType && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#526059]">{t.letterEditNote}</p>
          <textarea
            data-testid="letter-text"
            aria-label={t.lettersTitle}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={18}
            className="w-full p-3 rounded-lg border border-[#D5D2C2] bg-[#FAF9F5] text-xs sm:text-sm font-mono leading-relaxed"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" data-testid="letter-print-btn" onClick={() => printLetter(text)} className={buttonClass}>
              {t.letterPrintButton}
            </button>
            <button
              type="button"
              data-testid="letter-copy-btn"
              onClick={copyLetter}
              className="px-4 py-2 rounded-xl border border-[#114B36] text-[#114B36] hover:bg-[#E5F3EC] text-xs sm:text-sm font-semibold cursor-pointer"
            >
              {copied ? t.letterCopied : t.letterCopyButton}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
