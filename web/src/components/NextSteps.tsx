import type { Deadline } from "@claimsathi/contracts";
import { formatDate } from "../lib/format";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

interface NextStepsProps {
  deadlines: Deadline[];
  language: Language;
}

export function NextSteps({ deadlines, language }: NextStepsProps) {
  const t = translations[language];
  const reply = deadlines.find(({ label }) => label === "Grievance to the insurer")?.date ?? null;
  const lastDate = deadlines.find(({ label }) => label === "Complaint to the ombudsman")?.date ?? null;

  const steps = [
    { title: t.stepCheckTitle, detail: t.stepCheckDetail, href: "#facts", link: t.stepCheckLink },
    { title: t.stepSendTitle, detail: t.stepSendDetail, href: "#letters", link: t.stepSendLink },
    {
      title: t.stepWaitTitle,
      detail: reply ? t.stepWaitDetailDated(formatDate(reply, "")) : t.stepWaitDetail,
      href: null,
      link: null,
    },
    {
      title: t.stepEscalateTitle,
      detail: lastDate ? t.stepEscalateDetailDated(formatDate(lastDate, "")) : t.stepEscalateDetail,
      href: "#letters",
      link: t.stepEscalateLink,
    },
  ];

  return (
    <section
      id="next-steps"
      data-testid="next-steps"
      aria-label={t.nextStepsTitle}
      className="scroll-mt-24 bg-white rounded-2xl p-5 sm:p-7 border border-[#E3E0CE] shadow-xs"
    >
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#113A2B]">{t.nextStepsTitle}</h2>
      <ol className="mt-4 flex flex-col">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span className="w-8 h-8 shrink-0 rounded-full bg-[#114B36] text-white text-sm font-bold flex items-center justify-center">
                {index + 1}
              </span>
              {index < steps.length - 1 && <span className="w-0.5 flex-1 bg-[#DCE8E1]"></span>}
            </div>
            <div className="pb-5 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#113A2B]">{step.title}</h3>
              <p className="mt-0.5 text-xs sm:text-sm text-[#526059] leading-relaxed">{step.detail}</p>
              {step.href && (
                <a href={step.href} className="mt-1 inline-block text-xs sm:text-sm font-semibold text-[#0F5132] underline">
                  {step.link}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
