import type { Deadline } from "@claimsathi/contracts";

const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/[;,]/g, "\\$&").replace(/\r?\n/g, "\\n");
const compactDate = (date: string) => date.replaceAll("-", "");

function nextDay(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

// A calendar file works everywhere without an account, and only dates we could work out go in it.
export function buildCalendarFile(deadlines: Deadline[], caseToken: string): string | null {
  const dated = deadlines.filter((deadline): deadline is Deadline & { date: string } => deadline.date !== null);
  if (dated.length === 0) return null;

  const events = dated.flatMap((deadline, index) => [
    "BEGIN:VEVENT",
    `UID:${caseToken}-${index}@claimsathi`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${compactDate(deadline.date)}`,
    `DTEND;VALUE=DATE:${compactDate(nextDay(deadline.date))}`,
    `SUMMARY:${escapeText(`ClaimSathi: ${deadline.label}`)}`,
    `DESCRIPTION:${escapeText(deadline.explanation)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P7D",
    `DESCRIPTION:${escapeText(deadline.label)}`,
    "END:VALARM",
    "END:VEVENT",
  ]);

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ClaimSathi//Deadlines//EN", ...events, "END:VCALENDAR"].join("\r\n");
}
