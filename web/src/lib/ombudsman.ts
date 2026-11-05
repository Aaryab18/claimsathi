export const OMBUDSMAN_LOOKUP_URL = "https://www.cioins.co.in/Ombudsman";
export const OTHER_DISTRICT = "other";

export interface OmbudsmanMatch {
  office: string;
  // Only where a state is split between offices.
  covers?: string;
}

// From the Council for Insurance Ombudsmen's list of centres, read on 5 November 2026. Contact details
// aren't copied here, as they can change, so people get them from the official page.
// A state split by named districts, so the person can get one answer.
export const OMBUDSMAN_DISTRICTS: Record<string, { district: string; office: string }[]> = {
  Haryana: [
    { district: "Gurugram", office: "Delhi" },
    { district: "Faridabad", office: "Delhi" },
    { district: "Sonepat", office: "Delhi" },
    { district: "Bahadurgarh", office: "Delhi" },
    { district: OTHER_DISTRICT, office: "Chandigarh" },
  ],
};

export const OMBUDSMAN_BY_STATE: Record<string, OmbudsmanMatch[]> = {
  "Andaman & Nicobar Islands": [{ office: "Kolkata" }],
  "Andhra Pradesh": [{ office: "Hyderabad" }],
  "Arunachal Pradesh": [{ office: "Guwahati" }],
  Assam: [{ office: "Guwahati" }],
  Bihar: [{ office: "Patna" }],
  Chandigarh: [{ office: "Chandigarh" }],
  Chhattisgarh: [{ office: "Bhopal" }],
  "Dadra & Nagar Haveli, Daman and Diu": [{ office: "Ahmedabad" }],
  Delhi: [{ office: "Delhi" }],
  Goa: [{ office: "Pune" }],
  Gujarat: [{ office: "Ahmedabad" }],
  Haryana: [
    { office: "Delhi", covers: "Gurugram, Faridabad, Sonepat and Bahadurgarh" },
    { office: "Chandigarh", covers: "the rest of Haryana" },
  ],
  "Himachal Pradesh": [{ office: "Chandigarh" }],
  "Jammu & Kashmir": [{ office: "Chandigarh" }],
  Jharkhand: [{ office: "Patna" }],
  Karnataka: [{ office: "Bengaluru" }],
  Kerala: [{ office: "Kochi" }],
  Ladakh: [{ office: "Chandigarh" }],
  Lakshadweep: [{ office: "Kochi" }],
  "Madhya Pradesh": [{ office: "Bhopal" }],
  Maharashtra: [
    { office: "Thane", covers: "Navi Mumbai, Thane, Raigad, Palghar, and Mumbai wards M/East, M/West, N, S and T" },
    { office: "Mumbai", covers: "the other wards of the Mumbai Metropolitan Region" },
    { office: "Pune", covers: "the rest of Maharashtra" },
  ],
  Manipur: [{ office: "Guwahati" }],
  Meghalaya: [{ office: "Guwahati" }],
  Mizoram: [{ office: "Guwahati" }],
  Nagaland: [{ office: "Guwahati" }],
  Odisha: [{ office: "Bhubaneswar" }],
  Puducherry: [
    { office: "Chennai", covers: "Puducherry town and Karaikal" },
    { office: "Hyderabad", covers: "Yanam" },
    { office: "Kochi", covers: "Mahe" },
  ],
  Punjab: [{ office: "Chandigarh" }],
  Rajasthan: [{ office: "Jaipur" }],
  Sikkim: [{ office: "Kolkata" }],
  "Tamil Nadu": [{ office: "Chennai" }],
  Telangana: [{ office: "Hyderabad" }],
  Tripura: [{ office: "Guwahati" }],
  "Uttar Pradesh": [
    {
      office: "Noida",
      covers:
        "Agra, Aligarh, Amroha, Bagpat, Bareilly, Bijnor, Budaun, Bulandshahr, Etah, Etawah, Farrukhabad, Firozabad, Gautam Buddh Nagar, Ghaziabad, Hapur, Hardoi, Hathras, Kannauj, Kasganj, Mainpuri, Mathura, Meerut, Moradabad, Muzaffarnagar, Auraiya, Pilibhit, Rampur, Saharanpur, Sambhal, Shahjahanpur and Shamli",
    },
    { office: "Lucknow", covers: "the other districts of Uttar Pradesh" },
  ],
  Uttarakhand: [{ office: "Noida" }],
  "West Bengal": [{ office: "Kolkata" }],
};
