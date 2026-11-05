import type { Deadline } from "@claimsathi/contracts";
import { formatDate } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { buildCalendarFile } from "../lib/calendar";

interface DeadlinesSectionProps {
  deadlines: Deadline[];
  caseToken?: string;
  language: Language;
}

function getDeadlineLabel(label: string, language: Language, grievanceLabel: string, ombudsmanLabel: string): string {
  if (language !== "en") {
    if (label === "Grievance to the insurer") {
      return grievanceLabel;
    }
    if (label === "Complaint to the ombudsman") {
      return ombudsmanLabel;
    }
  }
  return label;
}

export function DeadlinesSection({ deadlines, language, caseToken }: DeadlinesSectionProps) {
  const t = translations[language];
  const calendarFile = caseToken ? buildCalendarFile(deadlines, caseToken) : null;

  return (
    <section id="deadlines" aria-label={t.deadlinesTitle} className="scroll-mt-24 flex flex-col gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#113A2B] flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#15803D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {t.deadlinesTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#526059]">
          {t.deadlinesSubtitle}
        </p>
        {calendarFile && (
          <a
            data-testid="calendar-download"
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendarFile)}`}
            download="claimsathi-deadlines.ics"
            className="inline-block mt-2 text-xs font-semibold underline text-[#114B36]"
          >
            {t.addToCalendar}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {deadlines.map((deadline, index) => {
          const isDateNull = deadline.date === null;
          const displayDate = isDateNull
            ? t.datePending
            : formatDate(deadline.date, t.datePending);

          return (
            <div
              key={index}
              data-testid={`deadline-card-${index}`}
              className="bg-white rounded-xl p-4 border border-[#E3E0CE] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-[#113A2B]">
                    {getDeadlineLabel(deadline.label, language, t.deadlineGrievanceLabel, t.deadlineOmbudsmanLabel)}
                  </h3>
                  {isDateNull ? (
                    <span
                      data-testid="deadline-date-pending"
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shrink-0"
                    >
                      {t.datePending}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#E5F3EC] text-[#0F5132] border border-[#BDE3D0] shrink-0">
                      {displayDate}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-[#526059] leading-relaxed">
                  {language === "hi" && deadline.explanationHi
                    ? deadline.explanationHi
                    : deadline.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F2EFE5] flex items-center justify-between text-[11px] text-[#78887F]">
                <span>{t.statusLabel}</span>
                <span className="font-medium">
                  {deadline.verified ? t.verifiedLabel : t.sourceCheckPending}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
