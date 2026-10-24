/**
 * States and union territories of India.
 *
 * Duplicated from aktgifting/src/constants/india.js on purpose: the admin
 * validates what it stores rather than trusting the storefront's dropdown,
 * and static reference data is a fair thing to copy. Keep the two in sync.
 *
 * Original note, alphabetical within each group.
 *
 * Kept as plain strings because that is what the Order schema stores — a
 * shipping label needs the name, not a code. Grouped so the dropdown puts
 * the 28 states ahead of the 8 union territories.
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const INDIAN_UNION_TERRITORIES = [
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

/** Flat list for validating whatever the form submits. */
export const ALL_INDIAN_STATES = [
  ...INDIAN_STATES,
  ...INDIAN_UNION_TERRITORIES,
];

/**
 * ISO 3166-2:IN subdivision codes → the names above. Vercel's geo headers
 * send these, and the orders list shows them ("KOTA, RJ, IN") the way
 * Shopify does. Where a state has had two codes (OD/OR, TG/TS, UK/UT, CG/CT)
 * both are listed, the current one first.
 */
export const STATE_BY_CODE = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CG: "Chhattisgarh",
  CT: "Chhattisgarh",
  DH: "Dadra and Nagar Haveli and Daman and Diu",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu and Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MH: "Maharashtra",
  ML: "Meghalaya",
  MN: "Manipur",
  MP: "Madhya Pradesh",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  OR: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TG: "Telangana",
  TS: "Telangana",
  TN: "Tamil Nadu",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  UT: "Uttarakhand",
  WB: "West Bengal",
};

/** Name → current code, for display. Codes listed later never overwrite. */
export const CODE_BY_STATE = Object.entries(STATE_BY_CODE).reduce(
  (codes, [code, name]) => (codes[name] ? codes : { ...codes, [name]: code }),
  {}
);
