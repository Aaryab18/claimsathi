import { useEffect, useState } from "react";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

const SPEECH_LANGUAGE: Record<Language, string> = { en: "en-IN", hi: "hi-IN" };
const SITE_URL = "https://claimsathi-web.onrender.com";

function hasVoiceFor(language: Language): boolean {
  if (!("speechSynthesis" in window)) return false;
  const prefix = SPEECH_LANGUAGE[language].slice(0, 2);
  return window.speechSynthesis.getVoices().some((voice) => voice.lang.toLowerCase().startsWith(prefix));
}

interface SummaryActionsProps {
  summary: string;
  language: Language;
}

// Reading aloud helps someone who finds the letter hard to read, and uses only the browser, so nothing is sent anywhere.
export function SummaryActions({ summary, language }: SummaryActionsProps) {
  const t = translations[language];
  const [canSpeak, setCanSpeak] = useState(() => hasVoiceFor(language));
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setCanSpeak(hasVoiceFor(language));
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const update = () => setCanSpeak(hasVoiceFor(language));
    synth.addEventListener?.("voiceschanged", update);
    return () => {
      synth.removeEventListener?.("voiceschanged", update);
      synth.cancel();
      setIsSpeaking(false);
    };
  }, [language]);

  const toggleSpeech = () => {
    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = SPEECH_LANGUAGE[language];
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  // No names or case link: the person chooses who sees it, and a case link would open their case.
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${summary}\n\nClaimSathi: ${SITE_URL}`)}`;
  const buttonClass =
    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[#114B36] text-[#114B36] hover:bg-[#E5F3EC] transition-colors cursor-pointer";

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {canSpeak && (
        <button type="button" data-testid="listen-btn" onClick={toggleSpeech} className={buttonClass}>
          {isSpeaking ? t.stopListening : t.listenButton}
        </button>
      )}
      <a data-testid="whatsapp-share" href={whatsAppUrl} target="_blank" rel="noreferrer" className={buttonClass}>
        {t.shareWhatsApp}
      </a>
    </div>
  );
}
