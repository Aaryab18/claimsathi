export type TranslatedLanguage = "hi" | "kn";

interface ClaimLine {
  name: string;
  amount: string;
}

export interface LetterText {
  locale: string;
  date: string;
  grievanceTo: string;
  insurerNamePlaceholder: string;
  insurerAddressPlaceholder: string;
  claimNumberPlaceholder: string;
  policyNumberPlaceholder: string;
  patientPlaceholder: string;
  yourNamePlaceholder: string;
  datePlaceholder: string;
  amountPlaceholder: string;
  subject: (claim: string, policy: string) => string;
  greeting: string;
  about: (patient: string, admitted: string, discharged: string, diagnosis: string | null) => string;
  amounts: (claimed: string, approved: string, letterDate: string) => string;
  continuousCover: (date: string) => string;
  disputeIntro: string;
  item: (line: ClaimLine, wrong: boolean) => string;
  yourLetterSays: string;
  policyWording: string;
  reference: string;
  checkReference: string;
  reasons: Record<string, string>;
  askIntro: string;
  askPay: (amount: string) => string;
  askExplain: (amount: string) => string;
  askReply: string;
  escalate: string;
  attached: string;
  closing: string;
  addressPlaceholder: string;
  phonePlaceholder: string;
  ombudsmanTitle: string;
  ombudsmanUnder: string;
  ombudsmanTo: string;
  complainant: (name: string) => string;
  insurerLine: (name: string) => string;
  policyNumber: (value: string) => string;
  claimNumber: (value: string) => string;
  patientAndTreatment: (patient: string, admitted: string, discharged: string, diagnosis: string | null) => string;
  decisionDate: (date: string) => string;
  complaintDate: string;
  referenceNumber: (value: string) => string;
  insurerReply: string;
  natureHeading: string;
  natureIntro: (approved: string, claimed: string) => string;
  relief: (amount: string, explain: string | null) => string;
  declaration: string;
  annexuresHeading: string;
  annexures: string[];
  signature: string;
}

export const LETTER_TEXT: Record<TranslatedLanguage, LetterText> = {
  hi: {
    locale: "hi-IN",
    date: "दिनांक",
    grievanceTo: "सेवा में: शिकायत निवारण अधिकारी",
    insurerNamePlaceholder: "[बीमा कंपनी का नाम]",
    insurerAddressPlaceholder: "[बीमा कंपनी का पता या शिकायत ईमेल]",
    claimNumberPlaceholder: "[क्लेम संख्या]",
    policyNumberPlaceholder: "[पॉलिसी संख्या]",
    patientPlaceholder: "[मरीज़ का नाम]",
    yourNamePlaceholder: "[आपका नाम]",
    datePlaceholder: "[तारीख]",
    amountPlaceholder: "[राशि]",
    subject: (claim, policy) => `विषय: क्लेम ${claim}, पॉलिसी ${policy} पर लिए गए निर्णय के विरुद्ध शिकायत`,
    greeting: "महोदय/महोदया,",
    about: (patient, admitted, discharged, diagnosis) =>
      `मैं ${patient} के क्लेम के संबंध में लिख रहा/रही हूं, जो ${admitted} को भर्ती हुए और ${discharged} को छुट्टी मिली${diagnosis ? `। निदान: ${diagnosis}` : ""}।`,
    amounts: (claimed, approved, letterDate) =>
      `दावा राशि: ${claimed}। स्वीकृत राशि: ${approved}। आपका पत्र ${letterDate} का है।`,
    continuousCover: (date) => `मेरा बीमा ${date} से लगातार चल रहा है।`,
    disputeIntro: "मैं निम्नलिखित कटौतियों पर आपत्ति करता/करती हूं:",
    item: ({ name, amount }, wrong) =>
      `${name}: ${amount} (${wrong ? "मेरा मानना है कि यह कटौती गलत है" : "कृपया इसका स्पष्ट कारण बताएं"})`,
    yourLetterSays: "आपका पत्र कहता है",
    policyWording: "पॉलिसी की शर्त",
    reference: "संदर्भ",
    checkReference: "[भेजने से पहले यह संदर्भ जांच लें]",
    reasons: {
      R1: "मेरा बीमा 60 महीने से अधिक समय से लगातार चल रहा है, इसलिए पहले की जानकारी न देने के आधार पर क्लेम पर सवाल नहीं उठाया जाना चाहिए।",
      R2: "इस बीमारी की प्रतीक्षा अवधि भर्ती से पहले ही पूरी हो चुकी थी।",
      R3: "कमरे की श्रेणी के कारण दवाइयों, कंज्यूमेबल्स, इम्प्लांट और जांच के खर्च में अनुपात से कटौती नहीं होनी चाहिए।",
      "R3-ICU": "ICU की अलग-अलग श्रेणियां नहीं होतीं, इसलिए ICU शुल्क में अनुपात से कटौती नहीं होनी चाहिए।",
      R4: "यह मद अनुमोदित पैकेज या प्रक्रिया का हिस्सा है, इसलिए इसे अलग से नहीं काटा जाना चाहिए।",
      "R3?": "कृपया बताएं कि क्या यह कटौती कमरे की श्रेणी के कारण की गई है, और किस पॉलिसी धारा के तहत।",
      "R4?": "कृपया बताएं कि क्या यह मद पैकेज या प्रक्रिया का हिस्सा है। यदि है, तो इसे अलग से नहीं काटा जाना चाहिए।",
      R5: "इस कटौती का आधार केवल दस्तावेज़ों की कमी है। कृपया बताएं कि आपने वह दस्तावेज़ कब मांगा था।",
      R6: "कृपया इस कटौती की गणना दिखाएं।",
      R7: "आपने जिस धारा का हवाला दिया है, वह मुझे अपनी पॉलिसी में नहीं मिली। कृपया बताएं कि वह कहां लिखी है।",
      UNDECIDED: "कृपया इस कटौती का कारण उस पॉलिसी धारा के साथ बताएं जिस पर आप निर्भर हैं।",
    },
    askIntro: "मेरा अनुरोध है कि आप:",
    askPay: (amount) => `- अपने निर्णय की समीक्षा करें और ${amount} का भुगतान करें, जो मेरे अनुसार गलत तरीके से काटे गए।`,
    askExplain: (amount) => `- ऊपर बताई गई ${amount} की राशि को मदवार और पॉलिसी धारा के साथ स्पष्ट करें।`,
    askReply: "- मुझे लिखित उत्तर भेजें।",
    escalate: "यदि इसका समाधान नहीं होता, तो मैं बीमा लोकपाल नियम, 2017 के नियम 14 के तहत बीमा लोकपाल के पास जाने का इरादा रखता/रखती हूं।",
    attached: "संलग्न: आपका क्लेम निर्णय पत्र, मेरी पॉलिसी, अस्पताल का बिल और डिस्चार्ज सारांश।",
    closing: "भवदीय,",
    addressPlaceholder: "[आपका पता]",
    phonePlaceholder: "[आपका फ़ोन और ईमेल]",
    ombudsmanTitle: "बीमा लोकपाल को शिकायत",
    ombudsmanUnder: "(बीमा लोकपाल नियम, 2017 के नियम 14 के तहत)",
    ombudsmanTo: "सेवा में: बीमा लोकपाल, [आपके क्षेत्र का कार्यालय। www.cioins.co.in पर देखें]",
    complainant: (name) => `1. शिकायतकर्ता: ${name}, [पता, फ़ोन, ईमेल]`,
    insurerLine: (name) => `2. बीमा कंपनी: ${name}, [शाखा या कार्यालय]`,
    policyNumber: (value) => `3. पॉलिसी संख्या: ${value}`,
    claimNumber: (value) => `4. क्लेम संख्या: ${value}`,
    patientAndTreatment: (patient, admitted, discharged, diagnosis) =>
      `5. मरीज़ और उपचार: ${patient}, भर्ती ${admitted}, छुट्टी ${discharged}${diagnosis ? `, ${diagnosis}` : ""}`,
    decisionDate: (date) => `6. बीमा कंपनी के निर्णय की तारीख: ${date}`,
    complaintDate: "7. बीमा कंपनी को लिखित शिकायत भेजने की तारीख: [तारीख]",
    referenceNumber: (value) => `   बीमा कंपनी की शिकायत संदर्भ संख्या: ${value}`,
    insurerReply: "8. बीमा कंपनी का उत्तर: [(तारीख) को अस्वीकार / (तारीख) का उत्तर स्वीकार्य नहीं / एक महीने बाद भी कोई उत्तर नहीं]",
    natureHeading: "9. शिकायत का विवरण:",
    natureIntro: (approved, claimed) => `बीमा कंपनी ने ${claimed} के दावे में से ${approved} स्वीकृत किए। मैं इन कटौतियों पर आपत्ति करता/करती हूं:`,
    relief: (amount, explain) => `10. मांगी गई राहत: ${amount} का भुगतान${explain ? `, और ${explain} की राशि का स्पष्ट विवरण` : ""}।`,
    declaration: "11. मैं घोषणा करता/करती हूं कि यह मामला किसी अदालत, उपभोक्ता मंच या मध्यस्थ के समक्ष नहीं है, और ऊपर दिए तथ्य मेरी जानकारी के अनुसार सही हैं। [यदि यह सही नहीं है, तो इसे हटाएं या सुधारें]",
    annexuresHeading: "संलग्न किए जाने वाले दस्तावेज़:",
    annexures: ["[ ] पॉलिसी की प्रति", "[ ] बीमा कंपनी का क्लेम निर्णय पत्र", "[ ] बीमा कंपनी को भेजी गई मेरी लिखित शिकायत और भेजने का प्रमाण", "[ ] बीमा कंपनी का उत्तर, यदि कोई हो", "[ ] अस्पताल का बिल और डिस्चार्ज सारांश", "[ ] क्लेम से जुड़े अन्य चिकित्सा दस्तावेज़"],
    signature: "हस्ताक्षर: ____________________",
  },
  kn: {
    locale: "kn-IN",
    date: "ದಿನಾಂಕ",
    grievanceTo: "ಇವರಿಗೆ: ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಅಧಿಕಾರಿ",
    insurerNamePlaceholder: "[ವಿಮಾ ಕಂಪನಿಯ ಹೆಸರು]",
    insurerAddressPlaceholder: "[ವಿಮಾ ಕಂಪನಿಯ ವಿಳಾಸ ಅಥವಾ ದೂರು ಇಮೇಲ್]",
    claimNumberPlaceholder: "[ಕ್ಲೈಮ್ ಸಂಖ್ಯೆ]",
    policyNumberPlaceholder: "[ಪಾಲಿಸಿ ಸಂಖ್ಯೆ]",
    patientPlaceholder: "[ರೋಗಿಯ ಹೆಸರು]",
    yourNamePlaceholder: "[ನಿಮ್ಮ ಹೆಸರು]",
    datePlaceholder: "[ದಿನಾಂಕ]",
    amountPlaceholder: "[ಮೊತ್ತ]",
    subject: (claim, policy) => `ವಿಷಯ: ಕ್ಲೈಮ್ ${claim}, ಪಾಲಿಸಿ ${policy} ಕುರಿತ ನಿರ್ಧಾರದ ವಿರುದ್ಧ ದೂರು`,
    greeting: "ಮಾನ್ಯರೇ,",
    about: (patient, admitted, discharged, diagnosis) =>
      `${patient} ಅವರ ಕ್ಲೈಮ್ ಕುರಿತು ಬರೆಯುತ್ತಿದ್ದೇನೆ. ಅವರು ${admitted} ರಂದು ದಾಖಲಾಗಿ ${discharged} ರಂದು ಬಿಡುಗಡೆಯಾದರು${diagnosis ? `. ರೋಗನಿರ್ಣಯ: ${diagnosis}` : ""}.`,
    amounts: (claimed, approved, letterDate) =>
      `ಕ್ಲೈಮ್ ಮೊತ್ತ: ${claimed}. ಅನುಮೋದಿತ ಮೊತ್ತ: ${approved}. ನಿಮ್ಮ ಪತ್ರದ ದಿನಾಂಕ ${letterDate}.`,
    continuousCover: (date) => `${date} ರಿಂದ ನನ್ನ ವಿಮೆ ನಿರಂತರವಾಗಿದೆ.`,
    disputeIntro: "ಈ ಕೆಳಗಿನ ಕಡಿತಗಳನ್ನು ನಾನು ಆಕ್ಷೇಪಿಸುತ್ತೇನೆ:",
    item: ({ name, amount }, wrong) =>
      `${name}: ${amount} (${wrong ? "ಈ ಕಡಿತ ತಪ್ಪು ಎಂದು ನಾನು ನಂಬುತ್ತೇನೆ" : "ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟ ಕಾರಣ ತಿಳಿಸಿ"})`,
    yourLetterSays: "ನಿಮ್ಮ ಪತ್ರ ಹೇಳುವುದು",
    policyWording: "ಪಾಲಿಸಿ ಷರತ್ತು",
    reference: "ಉಲ್ಲೇಖ",
    checkReference: "[ಕಳುಹಿಸುವ ಮೊದಲು ಈ ಉಲ್ಲೇಖವನ್ನು ಪರಿಶೀಲಿಸಿ]",
    reasons: {
      R1: "ನನ್ನ ವಿಮೆ 60 ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು ಕಾಲ ನಿರಂತರವಾಗಿದೆ, ಆದ್ದರಿಂದ ಹಿಂದಿನ ಮಾಹಿತಿ ನೀಡಿಲ್ಲ ಎಂಬ ಕಾರಣಕ್ಕೆ ಕ್ಲೈಮ್ ಪ್ರಶ್ನಿಸಬಾರದು.",
      R2: "ಈ ಕಾಯಿಲೆಯ ಕಾಯುವ ಅವಧಿ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗುವ ಮೊದಲೇ ಮುಗಿದಿತ್ತು.",
      R3: "ಕೊಠಡಿ ವರ್ಗದ ಕಾರಣಕ್ಕೆ ಔಷಧಿ, ಕನ್ಸ್ಯೂಮಬಲ್, ಇಂಪ್ಲಾಂಟ್ ಮತ್ತು ಪರೀಕ್ಷೆಗಳ ವೆಚ್ಚದಲ್ಲಿ ಅನುಪಾತದ ಕಡಿತ ಮಾಡಬಾರದು.",
      "R3-ICU": "ICU ಗೆ ಬೇರೆ ಬೇರೆ ವರ್ಗಗಳಿಲ್ಲ, ಆದ್ದರಿಂದ ICU ಶುಲ್ಕದಲ್ಲಿ ಅನುಪಾತದ ಕಡಿತ ಮಾಡಬಾರದು.",
      R4: "ಈ ಐಟಂ ಅನುಮೋದಿತ ಪ್ಯಾಕೇಜ್ ಅಥವಾ ಪ್ರಕ್ರಿಯೆಯ ಭಾಗವಾಗಿದೆ, ಆದ್ದರಿಂದ ಇದನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಕಡಿತ ಮಾಡಬಾರದು.",
      "R3?": "ಈ ಕಡಿತವನ್ನು ಕೊಠಡಿ ವರ್ಗದ ಕಾರಣಕ್ಕೆ ಮಾಡಲಾಗಿದೆಯೇ, ಮತ್ತು ಯಾವ ಪಾಲಿಸಿ ಷರತ್ತಿನ ಅಡಿಯಲ್ಲಿ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.",
      "R4?": "ಈ ಐಟಂ ಪ್ಯಾಕೇಜ್ ಅಥವಾ ಪ್ರಕ್ರಿಯೆಯ ಭಾಗವೇ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ. ಹಾಗಿದ್ದರೆ, ಇದನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಕಡಿತ ಮಾಡಬಾರದು.",
      R5: "ಈ ಕಡಿತಕ್ಕೆ ದಾಖಲೆಗಳ ಕೊರತೆ ಮಾತ್ರ ಕಾರಣ. ಆ ದಾಖಲೆಯನ್ನು ನೀವು ಯಾವಾಗ ಕೇಳಿದ್ದೀರಿ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.",
      R6: "ದಯವಿಟ್ಟು ಈ ಕಡಿತದ ಲೆಕ್ಕಾಚಾರವನ್ನು ತೋರಿಸಿ.",
      R7: "ನೀವು ಉಲ್ಲೇಖಿಸಿದ ಷರತ್ತು ನನ್ನ ಪಾಲಿಸಿಯಲ್ಲಿ ಸಿಗಲಿಲ್ಲ. ಅದು ಎಲ್ಲಿದೆ ಎಂದು ದಯವಿಟ್ಟು ತೋರಿಸಿ.",
      UNDECIDED: "ದಯವಿಟ್ಟು ಈ ಕಡಿತದ ಕಾರಣವನ್ನು ನೀವು ಅವಲಂಬಿಸಿರುವ ಪಾಲಿಸಿ ಷರತ್ತಿನೊಂದಿಗೆ ತಿಳಿಸಿ.",
    },
    askIntro: "ನಿಮ್ಮಲ್ಲಿ ನನ್ನ ವಿನಂತಿ:",
    askPay: (amount) => `- ನಿಮ್ಮ ನಿರ್ಧಾರವನ್ನು ಪರಿಶೀಲಿಸಿ, ತಪ್ಪಾಗಿ ಕಡಿತವಾಗಿದೆ ಎಂದು ನಾನು ನಂಬುವ ${amount} ಪಾವತಿಸಿ.`,
    askExplain: (amount) => `- ಮೇಲೆ ಗುರುತಿಸಿದ ${amount} ಅನ್ನು ಐಟಂವಾರು ಮತ್ತು ಪಾಲಿಸಿ ಷರತ್ತಿನೊಂದಿಗೆ ವಿವರಿಸಿ.`,
    askReply: "- ನನಗೆ ಲಿಖಿತ ಉತ್ತರ ಕಳುಹಿಸಿ.",
    escalate: "ಇದು ಪರಿಹಾರವಾಗದಿದ್ದರೆ, ವಿಮಾ ಒಂಬುಡ್ಸ್‌ಮನ್ ನಿಯಮಗಳು, 2017 ರ ನಿಯಮ 14 ರ ಅಡಿಯಲ್ಲಿ ವಿಮಾ ಒಂಬುಡ್ಸ್‌ಮನ್ ಬಳಿ ಹೋಗಲು ಉದ್ದೇಶಿಸಿದ್ದೇನೆ.",
    attached: "ಲಗತ್ತುಗಳು: ನಿಮ್ಮ ಕ್ಲೈಮ್ ನಿರ್ಧಾರ ಪತ್ರ, ನನ್ನ ಪಾಲಿಸಿ, ಆಸ್ಪತ್ರೆ ಬಿಲ್ ಮತ್ತು ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶ.",
    closing: "ವಂದನೆಗಳೊಂದಿಗೆ,",
    addressPlaceholder: "[ನಿಮ್ಮ ವಿಳಾಸ]",
    phonePlaceholder: "[ನಿಮ್ಮ ಫೋನ್ ಮತ್ತು ಇಮೇಲ್]",
    ombudsmanTitle: "ವಿಮಾ ಒಂಬುಡ್ಸ್‌ಮನ್‌ಗೆ ದೂರು",
    ombudsmanUnder: "(ವಿಮಾ ಒಂಬುಡ್ಸ್‌ಮನ್ ನಿಯಮಗಳು, 2017 ರ ನಿಯಮ 14 ರ ಅಡಿಯಲ್ಲಿ)",
    ombudsmanTo: "ಇವರಿಗೆ: ವಿಮಾ ಒಂಬುಡ್ಸ್‌ಮನ್, [ನಿಮ್ಮ ಪ್ರದೇಶದ ಕಚೇರಿ. www.cioins.co.in ನಲ್ಲಿ ನೋಡಿ]",
    complainant: (name) => `1. ದೂರುದಾರರು: ${name}, [ವಿಳಾಸ, ಫೋನ್, ಇಮೇಲ್]`,
    insurerLine: (name) => `2. ವಿಮಾ ಕಂಪನಿ: ${name}, [ಶಾಖೆ ಅಥವಾ ಕಚೇರಿ]`,
    policyNumber: (value) => `3. ಪಾಲಿಸಿ ಸಂಖ್ಯೆ: ${value}`,
    claimNumber: (value) => `4. ಕ್ಲೈಮ್ ಸಂಖ್ಯೆ: ${value}`,
    patientAndTreatment: (patient, admitted, discharged, diagnosis) =>
      `5. ರೋಗಿ ಮತ್ತು ಚಿಕಿತ್ಸೆ: ${patient}, ದಾಖಲಾತಿ ${admitted}, ಬಿಡುಗಡೆ ${discharged}${diagnosis ? `, ${diagnosis}` : ""}`,
    decisionDate: (date) => `6. ವಿಮಾ ಕಂಪನಿಯ ನಿರ್ಧಾರದ ದಿನಾಂಕ: ${date}`,
    complaintDate: "7. ವಿಮಾ ಕಂಪನಿಗೆ ಲಿಖಿತ ದೂರು ಕಳುಹಿಸಿದ ದಿನಾಂಕ: [ದಿನಾಂಕ]",
    referenceNumber: (value) => `   ವಿಮಾ ಕಂಪನಿಯ ದೂರಿನ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ: ${value}`,
    insurerReply: "8. ವಿಮಾ ಕಂಪನಿಯ ಉತ್ತರ: [(ದಿನಾಂಕ) ರಂದು ತಿರಸ್ಕೃತ / (ದಿನಾಂಕ) ರ ಉತ್ತರ ಒಪ್ಪಿಗೆಯಾಗಿಲ್ಲ / ಒಂದು ತಿಂಗಳ ನಂತರವೂ ಉತ್ತರವಿಲ್ಲ]",
    natureHeading: "9. ದೂರಿನ ವಿವರ:",
    natureIntro: (approved, claimed) => `ವಿಮಾ ಕಂಪನಿ ${claimed} ಕ್ಲೈಮ್‌ನಲ್ಲಿ ${approved} ಅನುಮೋದಿಸಿದೆ. ಈ ಕಡಿತಗಳನ್ನು ನಾನು ಆಕ್ಷೇಪಿಸುತ್ತೇನೆ:`,
    relief: (amount, explain) => `10. ಕೋರಿದ ಪರಿಹಾರ: ${amount} ಪಾವತಿ${explain ? `, ಮತ್ತು ಮತ್ತೆ ${explain} ಕುರಿತು ಸ್ಪಷ್ಟ ವಿವರಣೆ` : ""}.`,
    declaration: "11. ಈ ವಿಷಯ ಯಾವುದೇ ನ್ಯಾಯಾಲಯ, ಗ್ರಾಹಕ ವೇದಿಕೆ ಅಥವಾ ಮಧ್ಯಸ್ಥಗಾರರ ಮುಂದೆ ಇಲ್ಲ, ಮತ್ತು ಮೇಲಿನ ಮಾಹಿತಿ ನನಗೆ ತಿಳಿದ ಮಟ್ಟಿಗೆ ಸರಿಯಾಗಿದೆ ಎಂದು ಘೋಷಿಸುತ್ತೇನೆ. [ಇದು ಸರಿಯಲ್ಲದಿದ್ದರೆ ತೆಗೆದುಹಾಕಿ ಅಥವಾ ತಿದ್ದಿ]",
    annexuresHeading: "ಲಗತ್ತಿಸಬೇಕಾದ ದಾಖಲೆಗಳು:",
    annexures: ["[ ] ಪಾಲಿಸಿಯ ಪ್ರತಿ", "[ ] ವಿಮಾ ಕಂಪನಿಯ ಕ್ಲೈಮ್ ನಿರ್ಧಾರ ಪತ್ರ", "[ ] ವಿಮಾ ಕಂಪನಿಗೆ ಕಳುಹಿಸಿದ ಲಿಖಿತ ದೂರು ಮತ್ತು ಕಳುಹಿಸಿದ ಪುರಾವೆ", "[ ] ವಿಮಾ ಕಂಪನಿಯ ಉತ್ತರ, ಇದ್ದರೆ", "[ ] ಆಸ್ಪತ್ರೆ ಬಿಲ್ ಮತ್ತು ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶ", "[ ] ಕ್ಲೈಮ್‌ಗೆ ಸಂಬಂಧಿಸಿದ ಇತರ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು"],
    signature: "ಸಹಿ: ____________________",
  },
};
