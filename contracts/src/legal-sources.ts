import type { Regulation } from "./finding.js";

// Official documents the rules rely on, each read on 5-6 November 2026. Kept in one place so the rules,
// letters and rules page can't disagree about a link.
export const LEGAL_SOURCES = {
  masterCircular2024: {
    name: "IRDAI Master Circular on Health Insurance Business, 29.05.2024 (IRDAI/HLT/CIR/PRO/84/5/2024)",
    url: "https://irdai.gov.in/documents/37343/365525/%e0%a4%b8%e0%a5%8d%e0%a4%b5%e0%a4%be%e0%a4%b8%e0%a5%8d%e0%a4%a5%e0%a5%8d%e0%a4%af+%e0%a4%ac%e0%a5%80%e0%a4%ae%e0%a4%be+%e0%a4%b5%e0%a5%8d%e0%a4%af%e0%a4%b5%e0%a4%b8%e0%a4%be%e0%a4%af+%e0%a4%aa%e0%a4%b0+%e0%a4%ae%e0%a4%be%e0%a4%b8%e0%a5%8d%e0%a4%9f%e0%a4%b0+%e0%a4%aa%e0%a4%b0%e0%a4%bf%e0%a4%aa%e0%a4%a4%e0%a5%8d%e0%a4%b0+_+Master+Circular++on+Health++Insurance+Business++29052024.pdf/5e707a91-b5de-1ec1-cf18-b66273a6839d?t=1716962621002&version=1.0",
  },
  proportionateCircular2020: {
    name: "IRDAI circular IRDAI/HLT/REG/CIR/151/06/2020, 11.06.2020",
    url: "https://irdai.gov.in/documents/37343/365525/Modified+Guidelines+on+Product+filing+in+Health+Insurance+Business-Norms+on.pdf/7b50effc-e553-f0a6-389d-3ca90ab11af5?version=1.0&t=1631531502137&download=true",
  },
  standardizationCircular2020: {
    name: "IRDAI Master Circular on Standardization of Health Insurance Products, IRDAI/HLT/REG/CIR/193/07/2020, Annexure I",
    url: "https://irdai.gov.in/documents/37343/366029/Master+Circular+on+Standardization+of+Health+Insurance+Products.pdf/40548736-71a8-1b76-e28d-0df899407e1e?version=1.2&t=1665033878433&download=true",
  },
  ombudsmanRules: {
    name: "Insurance Ombudsman Rules 2017, updated 9.11.2023",
    url: "https://cioins.co.in:8082/notification/Insurance%20Ombudsman%20Rules,%202017(%20as%20amended%20till%2009.11.2023).pdf",
  },
} as const;

// The 2024 Master Circular replaced the circulars in its Annexure-6, and that list isn't in the published PDF
// we read, so these two 2020 sources stay unverified until someone can confirm they still apply.
export const STILL_APPLIES_NOTE = "We are confirming whether this still applies after IRDAI's May 2024 Master Circular.";

const { masterCircular2024, proportionateCircular2020, standardizationCircular2020 } = LEGAL_SOURCES;

// What each rule relies on, read on IRDAI's own site. The 2020 sources stay unverified, as the 2024 Master Circular
// may have replaced them. R2, R6 and a valid deduction use only the policy's own wording, so they cite no regulation.
export const REGULATIONS: Partial<Record<string, Regulation>> = {
  R1: {
    text: "No policy and claim shall be contestable on grounds of non-disclosure or misrepresentation, except for established fraud, after the Moratorium Period, 60 months of continuous coverage.",
    sourceName: `${masterCircular2024.name}, clause 13`,
    sourceUrl: masterCircular2024.url,
    verified: true,
  },
  R3: {
    text: `Pharmacy and consumables, implants and medical devices, and diagnostics are not allowed in 'associate medical expenses', and insurers can't recover proportionate deductions on anything else. ${STILL_APPLIES_NOTE}`,
    sourceName: `${proportionateCircular2020.name}, paragraphs 4 and 5`,
    sourceUrl: proportionateCircular2020.url,
    verified: false,
  },
  "R3-ICU": {
    text: `Insurers are not permitted to apply proportionate deduction for ICU charges, as different categories of ICU are not there. ${STILL_APPLIES_NOTE}`,
    sourceName: `${proportionateCircular2020.name}, paragraph 7`,
    sourceUrl: proportionateCircular2020.url,
    verified: false,
  },
  R4: {
    text: `IRDAI lists items to be subsumed into room, procedure and treatment charges, and says insurers must ensure hospitals don't bill them to policyholders. For reimbursement from a non-network hospital, claims follow the policy's terms. ${STILL_APPLIES_NOTE}`,
    sourceName: `${standardizationCircular2020.name}, Lists II to IV`,
    sourceUrl: standardizationCircular2020.url,
    verified: false,
  },
  R5: {
    text: "After a claim is intimated, insurers and TPAs shall collect the required documents from the hospitals, and the policyholder shall not be required to submit them.",
    sourceName: `${masterCircular2024.name}, clause 17(c)`,
    sourceUrl: masterCircular2024.url,
    verified: true,
  },
  R7: {
    text: "If a claim is repudiated or disallowed partially, details shall be conveyed with full details giving reference to the specific terms and conditions of the policy.",
    sourceName: `${masterCircular2024.name}, clause 17(b)`,
    sourceUrl: masterCircular2024.url,
    verified: true,
  },
};
