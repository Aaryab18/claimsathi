import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { Translations } from "../lib/i18n";

export const CASE_SECTIONS = ["overview", "breakdown", "evidence", "facts", "plan", "letters"] as const;
export type CaseSection = (typeof CASE_SECTIONS)[number];

interface CaseNavProps {
  token: string;
  t: Translations;
}

const ICONS: Record<CaseSection, string> = {
  overview: "M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-3H4z",
  breakdown: "M4 6h16M4 12h16M4 18h10",
  evidence: "M9 12l2 2 4-4M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z",
  facts: "M4 20h4L19 9l-4-4L4 16z",
  plan: "M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  letters: "M4 6h16v12H4zm0 0l8 7 8-7",
};

export function CaseNav({ token, t }: CaseNavProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { pathname } = useLocation();

  // On a phone the tabs scroll sideways, so keep the open page's tab in view.
  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [pathname]);

  const labels: Record<CaseSection, string> = {
    overview: t.navOverview,
    breakdown: t.navBreakdown,
    evidence: t.navEvidence,
    facts: t.navFacts,
    plan: t.navPlan,
    letters: t.navLetters,
  };

  return (
    <nav
      aria-label={t.sectionNavLabel}
      data-testid="case-nav"
      className="print:hidden sticky top-[108px] sm:top-[76px] z-20 -mx-4 px-4 py-2 md:mx-0 md:p-0 bg-[#FAF9F5] md:bg-transparent md:top-24 md:self-start"
    >
      <ul ref={listRef} className="flex md:flex-col gap-1 overflow-x-auto">
        {CASE_SECTIONS.map((section) => (
          <li key={section} className="shrink-0">
            <NavLink
              to={section === "overview" ? `/case/${token}` : `/case/${token}/${section}`}
              end
              data-testid={`nav-${section}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "bg-[#114B36] text-white" : "text-[#3E4F46] hover:bg-[#EDEBDF]"
                }`
              }
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS[section]} />
              </svg>
              {labels[section]}
            </NavLink>
          </li>
        ))}
        <li className="shrink-0 md:mt-3 md:pt-3 md:border-t md:border-[#E3E0CE]">
          <Link
            to="/rules"
            data-testid="nav-rules"
            className="block px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#3E4F46] hover:bg-[#EDEBDF] whitespace-nowrap"
          >
            {t.navRules}
          </Link>
        </li>
        <li className="shrink-0">
          <button
            type="button"
            data-testid="print-report-btn"
            onClick={() => window.print()}
            className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#114B36] hover:bg-[#EDEBDF] whitespace-nowrap cursor-pointer"
          >
            {t.printReport}
          </button>
        </li>
      </ul>
    </nav>
  );
}
