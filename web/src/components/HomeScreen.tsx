import { useState, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createCase, createSampleCase } from "../api/client";
import { Header } from "./Header";
import { Footer } from "./Footer";
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

  const rejectionInputRef = useRef<HTMLInputElement>(null);
  const policyInputRef = useRef<HTMLInputElement>(null);
  const billInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setSlot: React.Dispatch<React.SetStateAction<SlotState>>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setSlot({ file: null, error });
    } else {
      setSlot({ file, error: null });
    }
  };

  const handleRemove = (
    setSlot: React.Dispatch<React.SetStateAction<SlotState>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    setSlot({ file: null, error: null });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

          <div className="grid grid-cols-1 gap-4">
            {/* Slot 1: Rejection Letter */}
            <div className="p-4 rounded-xl border border-[#E7E5D8] bg-[#FAF9F5] flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <label
                  htmlFor="upload-rejection-letter"
                  className="font-bold text-sm text-[#113A2B] cursor-pointer"
                >
                  {t.uploadRejectionTitle}
                </label>
                <span className="text-xs text-[#6B7871]">{t.uploadRejectionDesc}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={rejectionInputRef}
                  id="upload-rejection-letter"
                  data-testid="file-rejection"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e, setRejectionSlot)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => rejectionInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E7E5D8] hover:bg-[#DAD6C5] text-[#113A2B] border border-[#D5D2C2] focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
                >
                  {t.chooseFile}
                </button>

                {rejectionSlot.file ? (
                  <div className="flex items-center gap-2 text-xs text-[#113A2B] font-medium bg-white px-2.5 py-1 rounded-md border border-[#D5D2C2]">
                    <span className="truncate max-w-[180px] sm:max-w-xs">{rejectionSlot.file.name}</span>
                    <span className="text-[#6B7871]">({formatFileSize(rejectionSlot.file.size)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(setRejectionSlot, rejectionInputRef)}
                      className="text-red-700 hover:text-red-900 font-semibold ml-1 cursor-pointer"
                      aria-label="Remove rejection letter"
                    >
                      {t.removeFile}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#8C887B] italic">{t.noFileChosen}</span>
                )}
              </div>

              {rejectionSlot.error && (
                <p
                  role="alert"
                  data-testid="error-rejection"
                  className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {rejectionSlot.error}
                </p>
              )}
            </div>

            {/* Slot 2: Policy Document */}
            <div className="p-4 rounded-xl border border-[#E7E5D8] bg-[#FAF9F5] flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <label
                  htmlFor="upload-policy-doc"
                  className="font-bold text-sm text-[#113A2B] cursor-pointer"
                >
                  {t.uploadPolicyTitle}
                </label>
                <span className="text-xs text-[#6B7871]">{t.uploadPolicyDesc}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={policyInputRef}
                  id="upload-policy-doc"
                  data-testid="file-policy"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e, setPolicySlot)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => policyInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E7E5D8] hover:bg-[#DAD6C5] text-[#113A2B] border border-[#D5D2C2] focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
                >
                  {t.chooseFile}
                </button>

                {policySlot.file ? (
                  <div className="flex items-center gap-2 text-xs text-[#113A2B] font-medium bg-white px-2.5 py-1 rounded-md border border-[#D5D2C2]">
                    <span className="truncate max-w-[180px] sm:max-w-xs">{policySlot.file.name}</span>
                    <span className="text-[#6B7871]">({formatFileSize(policySlot.file.size)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(setPolicySlot, policyInputRef)}
                      className="text-red-700 hover:text-red-900 font-semibold ml-1 cursor-pointer"
                      aria-label="Remove policy document"
                    >
                      {t.removeFile}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#8C887B] italic">{t.noFileChosen}</span>
                )}
              </div>

              {policySlot.error && (
                <p
                  role="alert"
                  data-testid="error-policy"
                  className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {policySlot.error}
                </p>
              )}
            </div>

            {/* Slot 3: Hospital Bill */}
            <div className="p-4 rounded-xl border border-[#E7E5D8] bg-[#FAF9F5] flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <label
                  htmlFor="upload-hospital-bill"
                  className="font-bold text-sm text-[#113A2B] cursor-pointer"
                >
                  {t.uploadBillTitle}
                </label>
                <span className="text-xs text-[#6B7871]">{t.uploadBillDesc}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={billInputRef}
                  id="upload-hospital-bill"
                  data-testid="file-bill"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e, setBillSlot)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => billInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E7E5D8] hover:bg-[#DAD6C5] text-[#113A2B] border border-[#D5D2C2] focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
                >
                  {t.chooseFile}
                </button>

                {billSlot.file ? (
                  <div className="flex items-center gap-2 text-xs text-[#113A2B] font-medium bg-white px-2.5 py-1 rounded-md border border-[#D5D2C2]">
                    <span className="truncate max-w-[180px] sm:max-w-xs">{billSlot.file.name}</span>
                    <span className="text-[#6B7871]">({formatFileSize(billSlot.file.size)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(setBillSlot, billInputRef)}
                      className="text-red-700 hover:text-red-900 font-semibold ml-1 cursor-pointer"
                      aria-label="Remove hospital bill"
                    >
                      {t.removeFile}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#8C887B] italic">{t.noFileChosen}</span>
                )}
              </div>

              {billSlot.error && (
                <p
                  role="alert"
                  data-testid="error-bill"
                  className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {billSlot.error}
                </p>
              )}
            </div>
          </div>

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
