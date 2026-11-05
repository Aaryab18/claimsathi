import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";
import { SystemStatus } from "../SystemStatus";

interface FooterProps {
  language: Language;
}

export function Footer({ language }: FooterProps) {
  const t = translations[language];

  return (
    <footer className="mt-12 pt-8 pb-12 border-t border-[#E3E0CE] text-center text-xs text-[#6B7971] flex flex-col items-center gap-3">
      <div className="max-w-xl mx-auto px-4">
        <p className="font-medium text-[#46544D]">
          {t.legalDisclaimerFooter}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center print:hidden">
        <SystemStatus />
      </div>
    </footer>
  );
}
