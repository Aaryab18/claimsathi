import type { Deadline, ExtractedClaim, FactOverrides } from "@claimsathi/contracts";

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  // The 31st of a month with no 31st moves back to that month's last day, never into the next month.
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

const DELAY_NOTE_EN = "The Ombudsman can accept a late complaint in some cases (Rule 14(4)), but don't rely on that.";
const DELAY_NOTE_HI = "कुछ मामलों में लोकपाल देरी से की गई शिकायत स्वीकार कर सकता है (नियम 14(4)), पर इस पर निर्भर न रहें।";

// R8. Source: Insurance Ombudsman Rules 2017, Rule 14(3) and 14(4), as updated on 9.11.2023.
// We found no legal deadline for sending the grievance, so that date is never made up.
export function buildDeadlines(extracted: ExtractedClaim, overrides?: FactOverrides): Deadline[] {
  const sent = overrides?.grievanceSentDate;
  const letterDate = extracted.rejection.letterDate;

  if (sent) {
    return [
      {
        label: "Grievance to the insurer",
        date: addMonths(sent, 1),
        explanation:
          "You sent your complaint to the insurer. If there is no reply about one month after they received it, you can go to the Ombudsman (Rule 14(3)(a)(ii)).",
        explanationHi:
          "आपने बीमा कंपनी को शिकायत भेज दी है। उन्हें मिलने के लगभग एक महीने बाद तक जवाब न मिले, तो आप लोकपाल के पास जा सकते हैं (नियम 14(3)(a)(ii))।",
        verified: true,
      },
      {
        label: "Complaint to the ombudsman",
        date: addMonths(sent, 13),
        explanation: `Last date if the insurer never replies: one year after that month ends (Rule 14(3)(b)(iii)). If the insurer does reply, the year runs from its reply instead. ${DELAY_NOTE_EN}`,
        explanationHi: `अगर बीमा कंपनी जवाब न दे तो अंतिम तारीख: वह महीना पूरा होने के एक साल बाद (नियम 14(3)(b)(iii))। अगर जवाब आए, तो एक साल उस जवाब से गिना जाएगा। ${DELAY_NOTE_HI}`,
        verified: true,
      },
    ];
  }

  return [
    {
      label: "Grievance to the insurer",
      date: null,
      explanation:
        "Send a written complaint to the insurer first, as the Ombudsman needs this (Rule 14(3)(a)). We found no fixed legal deadline for it, so send it soon, then enter the date you sent it.",
      explanationHi:
        "पहले बीमा कंपनी को लिखित शिकायत भेजें, क्योंकि लोकपाल के लिए यह ज़रूरी है (नियम 14(3)(a))। हमें इसकी कोई तय कानूनी समय-सीमा नहीं मिली, इसलिए इसे जल्द भेजें और फिर भेजने की तारीख दर्ज करें।",
      verified: false,
    },
    letterDate
      ? {
          label: "Complaint to the ombudsman",
          date: addMonths(letterDate, 12),
          explanation: `Safest last date: one year from the insurer's letter. The exact year runs from the insurer's reply to your complaint (Rule 14(3)(b)), so going by this date keeps you on the safe side. ${DELAY_NOTE_EN}`,
          explanationHi: `सबसे सुरक्षित अंतिम तारीख: बीमा कंपनी के पत्र से एक साल। सटीक एक साल आपकी शिकायत पर बीमा कंपनी के जवाब से गिना जाता है (नियम 14(3)(b)), इसलिए इस तारीख को मानना सुरक्षित है। ${DELAY_NOTE_HI}`,
          verified: true,
        }
      : {
          label: "Complaint to the ombudsman",
          date: null,
          explanation:
            "The insurer's letter date wasn't found, so this date can't be worked out. The Ombudsman's limit is one year (Rule 14(3)(b)).",
          explanationHi: "बीमा कंपनी के पत्र की तारीख नहीं मिली, इसलिए यह तारीख नहीं निकाली जा सकती। लोकपाल की समय-सीमा एक साल है (नियम 14(3)(b))।",
          verified: false,
        },
  ];
}
