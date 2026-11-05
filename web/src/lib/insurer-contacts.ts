// Grievance contacts read on each insurer's own grievance or contact page on 6 November 2026. An insurer is only
// listed if its page loaded and stated the details; Star Health, Care, ICICI Lombard and Aditya Birla blocked
// automated reading, so they fall back to the IRDAI route and the number on the policy document.
export interface InsurerContact {
  name: string;
  matches: RegExp;
  phone: { display: string; dial: string; tollFree: boolean };
  email: string | null;
  page: string;
  form: string | null;
}

export const CONTACTS_CHECKED_ON = "2026-11-06";

export const INSURER_CONTACTS: InsurerContact[] = [
  {
    name: "HDFC ERGO",
    matches: /hdfc\s*ergo/i,
    phone: { display: "1800 267 7444", dial: "18002677444", tollFree: false },
    email: "grievance@hdfcergo.com",
    page: "https://www.hdfcergo.com/customer-voice/grievances",
    form: "https://www.hdfcergo.com/grievance/hdfcergo-grievance-form",
  },
  {
    name: "Niva Bupa",
    matches: /niva\s*bupa|max\s*bupa/i,
    phone: { display: "1860 500 8888", dial: "18605008888", tollFree: false },
    email: null,
    page: "https://transactions.nivabupa.com/pages/grievance-redressal.aspx",
    form: "https://rules.nivabupa.com/customer-service/?page=grievance",
  },
  {
    name: "New India Assurance",
    matches: /new\s*india\s*assurance/i,
    phone: { display: "1800 209 1415", dial: "18002091415", tollFree: true },
    email: "gro@newindia.co.in",
    page: "https://www.newindia.co.in/portal/readMore/Grievances",
    form: null,
  },
  {
    name: "Bajaj General Insurance",
    matches: /bajaj/i,
    phone: { display: "1800 209 5858", dial: "18002095858", tollFree: true },
    email: "careforyou@bajajgeneral.com",
    page: "https://www.bajajgeneralinsurance.com/about-us/contact-us",
    form: null,
  },
  {
    name: "Tata AIG",
    matches: /tata\s*aig/i,
    phone: { display: "022 6489 8282", dial: "02264898282", tollFree: false },
    email: "customersupport@tataaig.com",
    page: "https://www.tataaig.com/grievance-redressal-policy",
    form: null,
  },
];

// IRDAI's own complaint route, read on bimabharosa.irdai.gov.in, and the Ombudsman's, read on cioins.co.in.
export const IRDAI_CONTACT = {
  register: "https://bimabharosa.irdai.gov.in/RegComplaint/RegisterComplaint",
  phones: [
    { display: "155255", dial: "155255" },
    { display: "1800 4254 732", dial: "18004254732" },
  ],
  email: "complaints@irdai.gov.in",
};

export const OMBUDSMAN_ONLINE = "https://cioins.co.in/Complaint/Online";

export function findInsurerContact(insurer: string | null): InsurerContact | null {
  if (!insurer) return null;
  return INSURER_CONTACTS.find(({ matches }) => matches.test(insurer)) ?? null;
}
