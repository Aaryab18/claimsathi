import type { Regulation } from "@claimsathi/contracts";
import type { Translations } from "../lib/i18n";

const isPlaceholder = (regulation: Regulation) => /pending verification/i.test(regulation.sourceName);

// Says plainly what we know about a source: read and confirmed, read but possibly replaced, or not needed.
export function RegulationEvidence({ regulation, t }: { regulation: Regulation | null; t: Translations }) {
  if (!regulation) {
    return (
      <p data-testid="regulation-policy-only" className="text-xs text-[#526059] leading-relaxed">
        {t.noRegulationCited}
      </p>
    );
  }

  // Only the bundled offline sample still has no source to show.
  if (isPlaceholder(regulation)) {
    return (
      <div data-testid="unverified-regulation-notice" className="p-3 rounded-lg bg-[#FFFDF5] border border-[#F3E7C4] text-xs text-[#6D5310] leading-relaxed">
        <p className="font-semibold">{t.sourceCheckPending}</p>
        <p>{t.sourceCheckPendingNotice}</p>
      </div>
    );
  }

  return (
    <div
      data-testid={regulation.verified ? "regulation-verified" : "regulation-confirming"}
      className={`p-3 rounded-lg border text-xs sm:text-sm leading-relaxed ${
        regulation.verified ? "bg-[#F1F9F4] border-[#BDE3D0]" : "bg-[#FFFDF5] border-[#F3E7C4]"
      }`}
    >
      <p className={`text-xs font-semibold ${regulation.verified ? "text-[#0F5132]" : "text-[#92400E]"}`}>
        {regulation.verified ? `✓ ${t.sourceStatus.verified}` : t.sourceStatus.confirming}
      </p>
      <p className="mt-1 text-[#273B30]">{regulation.text}</p>
      <p className="mt-1 text-[11px] text-[#526059]">
        {t.sourceLabel}: {regulation.sourceName}
        {regulation.sourceUrl && (
          <>
            {" "}
            <a href={regulation.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#0F5132] underline">
              {t.readOfficialSource}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
