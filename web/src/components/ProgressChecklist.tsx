import type { Deadline } from "@claimsathi/contracts";
import { Link } from "react-router-dom";
import type { CaseProgressFlags } from "../lib/case-progress";
import { formatDate } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface ProgressChecklistProps {
  caseToken: string;
  deadlines: Deadline[];
  flags: CaseProgressFlags;
  grievanceReference: string;
  language: Language;
}

// Every tick comes from something the person entered, never from a guess about what they did.
export function ProgressChecklist({ caseToken, deadlines, flags, grievanceReference, language }: ProgressChecklistProps) {
  const t = translations[language];
  // The reply date only exists once the person has entered the date they sent their complaint.
  const complaintSent = deadlines.some(({ label, date }) => label === "Grievance to the insurer" && date !== null);
  const ombudsmanDate = deadlines.find(({ label }) => label === "Complaint to the ombudsman")?.date ?? null;

  const steps = [
    { id: "result", label: t.progressResult, done: true, page: null },
    { id: "facts", label: t.progressFacts, done: flags.facts, page: "facts" },
    { id: "letter", label: t.progressLetter, done: flags.letter, page: "letters" },
    { id: "call", label: t.progressCall, done: grievanceReference.trim() !== "", page: "contact" },
    { id: "sent", label: t.progressSent, done: complaintSent, page: "facts" },
  ];
  const doneCount = steps.filter(({ done }) => done).length;

  return (
    <section
      data-testid="progress-checklist"
      aria-label={t.journeyTitle}
      className="print:hidden bg-white rounded-2xl p-5 sm:p-6 border border-[#E3E0CE] shadow-xs flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#113A2B]">{t.journeyTitle}</h2>
        <span className="text-xs sm:text-sm font-semibold text-[#526059]">{t.progressCount(doneCount, steps.length)}</span>
      </div>
      <div className="h-2 rounded-full bg-[#EDEBDF] overflow-hidden" aria-hidden="true">
        <div className="h-full bg-[#114B36] rounded-full" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ul className="flex flex-col gap-2">
        {steps.map(({ id, label, done, page }) => (
          <li key={id} data-testid={`progress-${id}`} data-done={done} className="flex items-center gap-3 min-w-0">
            <span
              className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? "bg-[#114B36] text-white" : "border-2 border-[#C9D6CE] text-transparent"
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <span className={`text-sm flex-1 min-w-0 ${done ? "text-[#526059]" : "font-semibold text-[#113A2B]"}`}>
              {label}
              <span className="sr-only">{done ? ` (${t.progressDone})` : ` (${t.progressToDo})`}</span>
            </span>
            {!done && page && (
              <Link to={`/case/${caseToken}/${page}`} className="shrink-0 text-xs sm:text-sm font-semibold text-[#0F5132] underline">
                {t.progressGo}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[#526059]">
        {ombudsmanDate ? t.progressEscalateDated(formatDate(ombudsmanDate, "")) : t.progressEscalate}
      </p>
    </section>
  );
}
