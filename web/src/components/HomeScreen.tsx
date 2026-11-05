import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCase, createSampleCase } from "../api/client";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { UploadSlot } from "./UploadSlot";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_SIZE = 14 * 1024 * 1024; // The API's limit for all three files together
const SAMPLE_DOCUMENTS = [
  { href: "/samples/sample-rejection-letter.pdf", labelKey: "uploadRejectionTitle" },
  { href: "/samples/sample-policy.pdf", labelKey: "uploadPolicyTitle" },
  { href: "/samples/sample-hospital-bill.pdf", labelKey: "uploadBillTitle" },
] as const;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

interface SlotState {
  file: File | null;
  error: string | null;
}

interface HomeScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function HomeScreen({ language, onLanguageChange }: HomeScreenProps) {
  const navigate = useNavigate();
  const t = translations[language];

  const [rejectionSlot, setRejectionSlot] = useState<SlotState>({ file: null, error: null });
  const [policySlot, setPolicySlot] = useState<SlotState>({ file: null, error: null });
  const [billSlot, setBillSlot] = useState<SlotState>({ file: null, error: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.includes(extension);
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || file.type === "";

    if (!hasValidExt && !hasValidMime) {
      return t.fileTypeError;
    }
    if (file.size > MAX_FILE_SIZE) {
      return t.fileSizeError;
    }
    return null;
  };

  const chooseFile = (file: File, setSlot: React.Dispatch<React.SetStateAction<SlotState>>) => {
    const error = validateFile(file);
    setSlot(error ? { file: null, error } : { file, error: null });
  };

  const filesChosen = [rejectionSlot, policySlot, billSlot].filter((slot) => slot.file).length;

  const isAnalyseEnabled =
    rejectionSlot.file !== null &&
    policySlot.file !== null &&
    billSlot.file !== null &&
    !isSubmitting;

  const handleAnalyse = async () => {
    if (!isAnalyseEnabled || !rejectionSlot.file || !policySlot.file || !billSlot.file) return;

    if (rejectionSlot.file.size + policySlot.file.size + billSlot.file.size > MAX_TOTAL_SIZE) {
      setGeneralError(t.totalSizeError);
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    try {
      const response = await createCase({
        rejectionLetter: rejectionSlot.file,
        policyDocument: policySlot.file,
        hospitalBill: billSlot.file,
      });
      navigate(`/case/${response.caseToken}`);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t.errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleTrySample = async () => {
    setIsSubmitting(true);
    setGeneralError(null);
    try {
      const response = await createSampleCase();
      navigate(`/case/${response.caseToken}`);
    } catch {
      // If the API can't be reached, navigate to /case/sample which falls back to offline copy
      navigate(`/case/sample`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#132A1E] flex flex-col font-sans">
      <Header language={language} onLanguageChange={onLanguageChange} />

      {/* Hero headline and explanation */}
      <section className="bg-[#114B36] text-[#FAF9F5]">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16 flex flex-col gap-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F2C879]">{t.homeTagline}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl">
            {t.homeHeadline}
          </h1>
          <p className="text-sm sm:text-lg text-[#D6E5DC] leading-relaxed max-w-2xl">
            {t.homeSubtitle}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
        {/* Notice banner */}
        <div
          role="note"
          aria-label="Demo notice"
          className="p-3.5 sm:p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm flex items-start gap-3 shadow-xs"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-[#B45309]"
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
          <p className="font-medium leading-relaxed">{t.demoNotice}</p>
        </div>

        {/* How it works */}
        <section aria-label={t.howItWorksTitle} data-testid="how-it-works" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            [t.howStepReadTitle, t.howStepReadDesc],
            [t.howStepJudgeTitle, t.howStepJudgeDesc],
            [t.howStepActTitle, t.howStepActDesc],
          ].map(([title, description], index) => (
            <div key={title} className="p-4 rounded-2xl bg-white border border-[#E3E0CE] shadow-xs">
              <span className="w-8 h-8 rounded-full bg-[#114B36] text-white text-sm font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <h2 className="mt-3 text-sm sm:text-base font-bold text-[#113A2B]">{title}</h2>
              <p className="mt-1 text-xs sm:text-sm text-[#526059] leading-relaxed">{description}</p>
            </div>
          ))}
        </section>

        {/* Prominent Sample Case Section */}
        <section className="p-5 sm:p-6 rounded-2xl bg-[#FDF6E3] border-2 border-[#F2C879] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#114B36] text-white mb-1.5">
              {t.instantPreview}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#113A2B]">
              {t.trySampleTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#526059] mt-0.5">
              {t.trySampleDesc}
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
            <button
              type="button"
              data-testid="try-sample-btn"
              onClick={handleTrySample}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#114B36] hover:bg-[#0E3A2A] text-white text-sm font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-[#114B36] focus:outline-hidden disabled:opacity-60 cursor-pointer text-center"
            >
              {isSubmitting ? t.loadingMessage : `${t.trySampleButton} →`}
            </button>
            {isSubmitting && (
              <p
                data-testid="waking-message-sample"
                className="text-xs text-[#8C887B] mt-1.5 text-center sm:text-right"
              >
                {t.serverWakingMessage}
              </p>
            )}
          </div>
        </section>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E3E1D5]"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-[#8C887B] uppercase tracking-wider">
            {t.orUploadYourOwn}
          </span>
          <div className="flex-grow border-t border-[#E3E1D5]"></div>
        </div>

        {/* Document Upload Slots */}
        <section className="bg-white rounded-2xl border border-[#E7E5D8] p-4 sm:p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-[#113A2B]">{t.uploadDocumentsTitle}</h2>
            <p className="text-xs sm:text-sm text-[#526059]">
              {t.fileFormatsHint}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UploadSlot
              inputId="upload-rejection-letter"
              name="rejection"
              title={t.uploadRejectionTitle}
              description={t.uploadRejectionDesc}
              removeLabel="Remove rejection letter"
              file={rejectionSlot.file}
              error={rejectionSlot.error}
              onFile={(file) => chooseFile(file, setRejectionSlot)}
              onRemove={() => setRejectionSlot({ file: null, error: null })}
              t={t}
            />
            <UploadSlot
              inputId="upload-policy-doc"
              name="policy"
              title={t.uploadPolicyTitle}
              description={t.uploadPolicyDesc}
              removeLabel="Remove policy document"
              file={policySlot.file}
              error={policySlot.error}
              onFile={(file) => chooseFile(file, setPolicySlot)}
              onRemove={() => setPolicySlot({ file: null, error: null })}
              t={t}
            />
            <UploadSlot
              inputId="upload-hospital-bill"
              name="bill"
              title={t.uploadBillTitle}
              description={t.uploadBillDesc}
              removeLabel="Remove hospital bill"
              file={billSlot.file}
              error={billSlot.error}
              onFile={(file) => chooseFile(file, setBillSlot)}
              onRemove={() => setBillSlot({ file: null, error: null })}
              t={t}
            />
          </div>

          <p data-testid="files-chosen" aria-live="polite" className="text-xs sm:text-sm font-semibold text-center text-[#526059]">
            {t.filesChosen(filesChosen)}
          </p>

          {generalError && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {generalError}
            </div>
          )}

          {/* Analyse Button */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              data-testid="analyse-btn"
              disabled={!isAnalyseEnabled}
              onClick={handleAnalyse}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                isAnalyseEnabled
                  ? "bg-[#114B36] hover:bg-[#0E3A2A] text-white cursor-pointer"
                  : "bg-[#E7E5D8] text-[#8C887B] cursor-not-allowed opacity-80"
              }`}
            >
              {t.analyseButton}
            </button>

            <p
              data-testid="analyse-hint"
              className="text-xs text-center text-[#8C887B]"
            >
              {t.liveReadingNotice}
            </p>

            <p data-testid="sample-documents" className="text-xs text-center text-[#526059]">
              {t.sampleDocumentsIntro}{" "}
              {SAMPLE_DOCUMENTS.map(({ href, labelKey }, index) => (
                <span key={href}>
                  {index > 0 && " · "}
                  <a href={href} download className="underline font-medium text-[#114B36]">
                    {t[labelKey].replace(/^\d+\.\s*/, "")}
                  </a>
                </span>
              ))}
            </p>
          </div>
        </section>
      </main>

      <Footer language={language} />
    </div>
  );
}
