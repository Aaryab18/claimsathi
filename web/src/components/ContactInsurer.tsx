import { useState } from "react";
import { Link } from "react-router-dom";
import type { LetterLanguage } from "@claimsathi/contracts";
import { createLetter } from "../api/client";
import { formatDate } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { CONTACTS_CHECKED_ON, IRDAI_CONTACT, OMBUDSMAN_ONLINE, findInsurerContact } from "../lib/insurer-contacts";

interface ContactInsurerProps {
  caseToken: string;
  insurer: string | null;
  claimId: string | null;
  language: Language;
  isOffline: boolean;
  reference: string;
  onReferenceChange: (value: string) => void;
}

const cardClass = "bg-white rounded-2xl p-5 sm:p-6 border border-[#E7E5D8] flex flex-col gap-3";
const buttonClass =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#114B36] hover:bg-[#0E3A2A] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed";
const linkClass = "text-xs sm:text-sm font-semibold text-[#0F5132] underline break-words";

// ClaimSathi never calls anyone. It gives the person the number, what to say and where to write, and they act.
export function ContactInsurer({
  caseToken,
  insurer,
  claimId,
  language,
  isOffline,
  reference,
  onReferenceChange,
}: ContactInsurerProps) {
  const t = translations[language];
  const contact = findInsurerContact(insurer);
  const [chosenLanguage, setChosenLanguage] = useState<LetterLanguage | null>(null);
  const scriptLanguage = chosenLanguage ?? language;
  const [script, setScript] = useState("");
  const [busy, setBusy] = useState<"script" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailNote, setEmailNote] = useState(false);

  const loadScript = async (lang: LetterLanguage = scriptLanguage) => {
    setBusy("script");
    setError(null);
    try {
      setScript((await createLetter(caseToken, "call_script", lang)).text);
    } catch {
      setError(t.letterError);
    } finally {
      setBusy(null);
    }
  };

  const emailLetter = async (email: string) => {
    setBusy("email");
    setError(null);
    try {
      const { text } = await createLetter(caseToken, "grievance", scriptLanguage);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // The letter is in the email body too, so a failed copy only loses the backup.
      }
      setEmailNote(true);
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(t.contactEmailSubject(claimId))}&body=${encodeURIComponent(text)}`;
    } catch {
      setError(t.letterError);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section data-testid="contact-insurer" aria-label={t.contactTitle} className="print:hidden flex flex-col gap-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#113A2B]">{t.contactTitle}</h2>
        <p className="text-xs sm:text-sm text-[#526059] leading-relaxed">{t.contactSubtitle}</p>
      </div>

      {/* 1. Who to call */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-[#113A2B]">{t.contactStepCall}</h3>
        {contact ? (
          <div data-testid="insurer-contact" className="flex flex-col gap-2">
            <p className="text-sm text-[#2C3E35]">{t.contactMatched(contact.name)}</p>
            <a href={`tel:${contact.phone.dial}`} data-testid="call-insurer" className={`${buttonClass} w-full sm:w-auto self-start`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3l2 5-2.5 1.5a11 11 0 005 5L14 12l5 2v3a2 2 0 01-2 2A16 16 0 013 5z" />
              </svg>
              {t.contactCallNow} {contact.phone.display}
            </a>
            <p className="text-xs text-[#526059]">{contact.phone.tollFree ? t.contactTollFree : t.contactCallCharges}</p>
            <p className="text-xs text-[#526059]">
              <a href={contact.page} target="_blank" rel="noreferrer" className={linkClass}>
                {t.contactOfficialPage}
              </a>
              {contact.form && (
                <>
                  {" · "}
                  <a href={contact.form} target="_blank" rel="noreferrer" data-testid="insurer-form" className={linkClass}>
                    {t.contactOnlineForm}
                  </a>
                </>
              )}
            </p>
            <p className="text-[11px] text-[#6B7971]">{t.contactCheckedOn(formatDate(CONTACTS_CHECKED_ON, ""))}</p>
          </div>
        ) : (
          <p data-testid="insurer-not-listed" className="text-sm text-[#3E4F46] leading-relaxed">
            {t.contactNotListed(insurer)}
          </p>
        )}
        <p className="text-xs text-[#526059]">{t.contactNoAiNote}</p>
      </div>

      {/* 2. What to say */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-[#113A2B]">{t.contactStepScript}</h3>
        <p className="text-xs sm:text-sm text-[#526059]">{t.contactScriptDesc}</p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="script-language" className="text-xs font-semibold text-[#113A2B]">
              {t.letterLanguageLabel}
            </label>
            <select
              id="script-language"
              data-testid="script-language"
              value={scriptLanguage}
              onChange={(e) => {
                const next = e.target.value as LetterLanguage;
                setChosenLanguage(next);
                if (script) void loadScript(next);
              }}
              className="w-full sm:w-48 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-white text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </div>
          <button
            type="button"
            data-testid="show-call-script"
            onClick={() => void loadScript()}
            disabled={isOffline || busy !== null}
            className={buttonClass}
          >
            {busy === "script" ? t.contactLoading : t.contactShowScript}
          </button>
        </div>
        {script && (
          <pre
            data-testid="call-script"
            className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[#273B30] bg-[#F6F8F4] border border-[#DCE8E1] rounded-xl p-4"
          >
            {script}
          </pre>
        )}
      </div>

      {/* 3. After the call */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-[#113A2B]">{t.contactStepAfter}</h3>
        <label htmlFor="grievance-reference" className="text-xs font-semibold text-[#113A2B]">
          {t.contactReferenceLabel}
        </label>
        <input
          id="grievance-reference"
          data-testid="grievance-reference"
          value={reference}
          maxLength={60}
          onChange={(e) => onReferenceChange(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-white text-sm"
        />
        <p className="text-xs text-[#526059]">{t.contactReferenceHelp}</p>
        <p className="text-xs text-[#526059]">
          {t.contactSentDateHint}{" "}
          <Link to={`/case/${caseToken}/facts`} className={linkClass}>
            {t.navFacts}
          </Link>
        </p>
      </div>

      {/* 4. In writing */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-[#113A2B]">{t.contactStepWriting}</h3>
        <p className="text-xs sm:text-sm text-[#526059]">{t.contactWritingDesc}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {contact?.email && (
            <button
              type="button"
              data-testid="email-insurer"
              onClick={() => void emailLetter(contact.email!)}
              disabled={isOffline || busy !== null}
              className={buttonClass}
            >
              {busy === "email" ? t.contactLoading : t.contactEmailLetter(contact.email)}
            </button>
          )}
          <Link to={`/case/${caseToken}/letters`} className={`${linkClass} self-center`}>
            {t.contactOpenLetters}
          </Link>
        </div>
        {emailNote && (
          <p role="status" className="text-xs font-semibold text-[#0F5132]">
            {t.contactEmailCopied}
          </p>
        )}
      </div>

      {/* 5. If the insurer doesn't fix it */}
      <div className={`${cardClass} bg-[#FFFDF8]`}>
        <h3 className="text-base font-bold text-[#113A2B]">{t.contactStepEscalate}</h3>
        <p className="text-xs sm:text-sm text-[#526059] leading-relaxed">{t.contactEscalateDesc}</p>
        <a href={IRDAI_CONTACT.register} target="_blank" rel="noreferrer" data-testid="bima-bharosa" className={linkClass}>
          {t.contactBimaBharosa}
        </a>
        <p className="text-xs sm:text-sm text-[#3E4F46]">
          {t.contactIrdaiCall}{" "}
          {IRDAI_CONTACT.phones.map((phone, index) => (
            <span key={phone.dial}>
              {index > 0 && ` ${t.orWord} `}
              <a href={`tel:${phone.dial}`} className={linkClass}>
                {phone.display}
              </a>
            </span>
          ))}
          {" · "}
          <a href={`mailto:${IRDAI_CONTACT.email}`} className={linkClass}>
            {IRDAI_CONTACT.email}
          </a>
        </p>
        <a href={OMBUDSMAN_ONLINE} target="_blank" rel="noreferrer" data-testid="ombudsman-online" className={linkClass}>
          {t.contactOmbudsmanOnline}
        </a>
        <p className="text-xs text-[#526059]">{t.contactOmbudsmanWhen}</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#9B2C2C]">
          {error}
        </p>
      )}
    </section>
  );
}
