import { useRef, useState } from "react";
import type { Translations } from "../lib/i18n";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadSlotProps {
  inputId: string;
  name: "rejection" | "policy" | "bill";
  title: string;
  description: string;
  removeLabel: string;
  file: File | null;
  error: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  t: Translations;
}

export function UploadSlot({
  inputId,
  name,
  title,
  description,
  removeLabel,
  file,
  error,
  onFile,
  onRemove,
  t,
}: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleRemove = () => {
    onRemove();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const state = error
    ? "border-red-300 bg-red-50"
    : file
      ? "border-[#15803D] bg-[#E5F3EC]"
      : isDragging
        ? "border-[#114B36] bg-[#E5F3EC]"
        : "border-dashed border-[#C9C5B2] bg-[#FAF9F5] hover:border-[#114B36]";

  return (
    <div
      data-testid={`slot-${name}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFile(dropped);
      }}
      className={`p-4 rounded-2xl border-2 transition-colors flex flex-col gap-3 min-w-0 ${state}`}
    >
      <div className="flex items-start justify-between gap-2">
        <label htmlFor={inputId} className="font-bold text-sm sm:text-base text-[#113A2B] cursor-pointer">
          {title}
        </label>
        {file && (
          <span
            data-testid={`done-${name}`}
            aria-label={t.fileChosenLabel}
            className="w-6 h-6 shrink-0 rounded-full bg-[#15803D] text-white flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
      <p className="text-xs text-[#526059] leading-relaxed flex-1">{description}</p>

      <input
        ref={inputRef}
        id={inputId}
        data-testid={`file-${name}`}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          if (chosen) onFile(chosen);
        }}
        className="sr-only"
      />

      {file ? (
        <div className="text-xs text-[#113A2B] font-medium min-w-0">
          <p className="truncate">{file.name}</p>
          <p className="mt-0.5 text-[#526059]">
            {formatFileSize(file.size)} ·{" "}
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-700 hover:text-red-900 font-semibold cursor-pointer underline"
              aria-label={removeLabel}
            >
              {t.removeFile}
            </button>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-[#F0EDE1] text-[#113A2B] border border-[#114B36] focus:ring-2 focus:ring-[#114B36] focus:outline-hidden cursor-pointer"
          >
            {t.chooseFile}
          </button>
          <p className="hidden sm:block text-[11px] text-center text-[#6B7871]">{t.dropFileHere}</p>
        </div>
      )}

      {error && (
        <p role="alert" data-testid={`error-${name}`} className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
