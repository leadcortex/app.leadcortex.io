// frontend/lib/payment/countries.ts

const ISO_CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BM BN BO BQ BR BS " +
  "BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC " +
  "EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GG GH GI GL GM GN GQ GR GS GT GU GW GY HK HM " +
  "HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB " +
  "LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MP MR MS MT MU MV MW MX MY MZ NA " +
  "NE NF NG NI NL NO NP NR NU NZ OM PA PE PG PH PK PL PN PR PS PT PW PY QA RO RS RU RW SA SB SC " +
  "SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV " +
  "TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WS XK YE ZA ZM ZW"
).split(" ");

export const FEATURED_COUNTRIES = ["US", "FR", "CA", "GB", "BE", "CH", "DE"];

const EU = new Set(
  "AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK".split(" "),
);

const NO_POSTAL_CODE = new Set(
  (
    "AE AG AO AW BF BI BJ BO BQ BS BW BZ CD CF CG CI CK CM CW DJ DM ER FJ GA GD GH GM GQ GY HK " +
    "HM IE KI KM KN KP LY ML MO MR MW NR NU QA RW SB SC SL SR SS ST SX SY TD TG TK TL TO TT TV UG " +
    "VU YE ZW"
  ).split(" "),
);

const POSTAL: Record<string, { re: RegExp; example: string }> = {
  US: { re: /^\d{5}(?:-\d{4})?$/, example: "94103" },
  CA: {
    re: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    example: "H2X 1Y4",
  },
  GB: { re: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, example: "SW1A 1AA" },
  AU: { re: /^\d{4}$/, example: "2000" },
  NZ: { re: /^\d{4}$/, example: "1010" },
  MX: { re: /^\d{5}$/, example: "06600" },
  BR: { re: /^\d{5}-?\d{3}$/, example: "01310-100" },
  IN: { re: /^\d{6}$/, example: "110001" },
  JP: { re: /^\d{3}-?\d{4}$/, example: "100-0001" },
  CN: { re: /^\d{6}$/, example: "100000" },
  DE: { re: /^\d{5}$/, example: "10115" },
  ES: { re: /^\d{5}$/, example: "28001" },
  IT: { re: /^\d{5}$/, example: "00118" },
  NL: { re: /^\d{4} ?[A-Z]{2}$/i, example: "1012 AB" },
  BE: { re: /^[1-9]\d{3}$/, example: "1000" },
  CH: { re: /^[1-9]\d{3}$/, example: "1201" },
  LU: { re: /^(?:L-)?\d{4}$/i, example: "1111" },
  AT: { re: /^\d{4}$/, example: "1010" },
  DK: { re: /^\d{4}$/, example: "1050" },
  NO: { re: /^\d{4}$/, example: "0150" },
  SE: { re: /^\d{3} ?\d{2}$/, example: "111 22" },
  FI: { re: /^\d{5}$/, example: "00100" },
  PT: { re: /^\d{4}-\d{3}$/, example: "1000-001" },
  PL: { re: /^\d{2}-\d{3}$/, example: "00-001" },
  MC: { re: /^980\d{2}$/, example: "98000" },
};

const GENERIC_POSTAL = /^[A-Z0-9][A-Z0-9 -]{1,9}$/i;

export type Region = { code: string; label: string; postal?: RegExp; postalExample?: string };

const list = (codes: string) =>
  codes.split("|").map((pair) => {
    const [code, label] = pair.split(":");
    return { code, label };
  });

export const FR_METRO = "METRO";

const FR_REGIONS: Region[] = [
  {
    code: FR_METRO,
    label: "France métropolitaine",
    postal: /^(?:0[1-9]|[1-8]\d|9[0-5])\d{3}$/,
    postalExample: "75011",
  },
  { code: "GP", label: "Guadeloupe", postal: /^971\d{2}$/, postalExample: "97110" },
  { code: "MQ", label: "Martinique", postal: /^972\d{2}$/, postalExample: "97200" },
  { code: "GF", label: "Guyane", postal: /^973\d{2}$/, postalExample: "97300" },
  { code: "RE", label: "La Réunion", postal: /^974\d{2}$/, postalExample: "97400" },
  { code: "YT", label: "Mayotte", postal: /^976\d{2}$/, postalExample: "97600" },
  { code: "PM", label: "Saint-Pierre-et-Miquelon", postal: /^97500$/, postalExample: "97500" },
  { code: "BL", label: "Saint-Barthélemy", postal: /^97133$/, postalExample: "97133" },
  { code: "MF", label: "Saint-Martin", postal: /^97150$/, postalExample: "97150" },
  { code: "WF", label: "Wallis-et-Futuna", postal: /^986\d{2}$/, postalExample: "98600" },
  { code: "PF", label: "Polynésie française", postal: /^987\d{2}$/, postalExample: "98714" },
  { code: "NC", label: "Nouvelle-Calédonie", postal: /^988\d{2}$/, postalExample: "98800" },
  {
    code: "TF",
    label: "Terres australes et antarctiques",
    postal: /^984\d{2}$/,
    postalExample: "98404",
  },
];

const US_STATES = list(
  "AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|" +
    "DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|" +
    "KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|" +
    "MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|" +
    "NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|" +
    "PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|" +
    "VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|" +
    "PR:Puerto Rico|GU:Guam|VI:U.S. Virgin Islands|AS:American Samoa|MP:Northern Mariana Islands|" +
    "AA:Armed Forces Americas|AE:Armed Forces Europe|AP:Armed Forces Pacific",
);

const CA_PROVINCES = list(
  "AB:Alberta|BC:Colombie-Britannique|MB:Manitoba|NB:Nouveau-Brunswick|NL:Terre-Neuve-et-Labrador|" +
    "NS:Nouvelle-Écosse|NT:Territoires du Nord-Ouest|NU:Nunavut|ON:Ontario|PE:Île-du-Prince-Édouard|" +
    "QC:Québec|SK:Saskatchewan|YT:Yukon",
);

const AU_STATES = list(
  "ACT:Territoire de la capitale australienne|NSW:Nouvelle-Galles du Sud|NT:Territoire du Nord|" +
    "QLD:Queensland|SA:Australie-Méridionale|TAS:Tasmanie|VIC:Victoria|WA:Australie-Occidentale",
);

const MX_STATES = list(
  "AGU:Aguascalientes|BCN:Baja California|BCS:Baja California Sur|CAM:Campeche|CHP:Chiapas|" +
    "CHH:Chihuahua|CMX:Ciudad de México|COA:Coahuila|COL:Colima|DUR:Durango|GUA:Guanajuato|" +
    "GRO:Guerrero|HID:Hidalgo|JAL:Jalisco|MEX:Estado de México|MIC:Michoacán|MOR:Morelos|NAY:Nayarit|" +
    "NLE:Nuevo León|OAX:Oaxaca|PUE:Puebla|QUE:Querétaro|ROO:Quintana Roo|SLP:San Luis Potosí|" +
    "SIN:Sinaloa|SON:Sonora|TAB:Tabasco|TAM:Tamaulipas|TLA:Tlaxcala|VER:Veracruz|YUC:Yucatán|ZAC:Zacatecas",
);

const BR_STATES = list(
  "AC:Acre|AL:Alagoas|AP:Amapá|AM:Amazonas|BA:Bahia|CE:Ceará|DF:Distrito Federal|ES:Espírito Santo|" +
    "GO:Goiás|MA:Maranhão|MT:Mato Grosso|MS:Mato Grosso do Sul|MG:Minas Gerais|PA:Pará|PB:Paraíba|" +
    "PR:Paraná|PE:Pernambuco|PI:Piauí|RJ:Rio de Janeiro|RN:Rio Grande do Norte|RS:Rio Grande do Sul|" +
    "RO:Rondônia|RR:Roraima|SC:Santa Catarina|SP:São Paulo|SE:Sergipe|TO:Tocantins",
);

const IN_STATES = list(
  "AN:Andaman and Nicobar Islands|AP:Andhra Pradesh|AR:Arunachal Pradesh|AS:Assam|BR:Bihar|" +
    "CH:Chandigarh|CT:Chhattisgarh|DH:Dadra and Nagar Haveli and Daman and Diu|DL:Delhi|GA:Goa|" +
    "GJ:Gujarat|HR:Haryana|HP:Himachal Pradesh|JK:Jammu and Kashmir|JH:Jharkhand|KA:Karnataka|" +
    "KL:Kerala|LA:Ladakh|LD:Lakshadweep|MP:Madhya Pradesh|MH:Maharashtra|MN:Manipur|ML:Meghalaya|" +
    "MZ:Mizoram|NL:Nagaland|OR:Odisha|PY:Puducherry|PB:Punjab|RJ:Rajasthan|SK:Sikkim|TN:Tamil Nadu|" +
    "TG:Telangana|TR:Tripura|UP:Uttar Pradesh|UT:Uttarakhand|WB:West Bengal",
);

type RegionSet = { label: string; regions: Region[]; defaultCode?: string };

const REGIONS: Record<string, RegionSet> = {
  FR: { label: "Territoire", regions: FR_REGIONS, defaultCode: FR_METRO },
  US: { label: "État", regions: US_STATES },
  CA: { label: "Province ou territoire", regions: CA_PROVINCES },
  AU: { label: "État ou territoire", regions: AU_STATES },
  MX: { label: "État", regions: MX_STATES },
  BR: { label: "État", regions: BR_STATES },
  IN: { label: "État ou territoire", regions: IN_STATES },
};

export type Country = { code: string; label: string };

function displayNames(): (code: string) => string {
  try {
    const dn = new Intl.DisplayNames(["fr"], { type: "region" });
    return (code) => dn.of(code) ?? code;
  } catch {
    return (code) => code;
  }
}

const nameOf = displayNames();

const FRENCH_TERRITORIES = new Set(FR_REGIONS.map((r) => r.code));

export const COUNTRIES: Country[] = ISO_CODES.filter((c) => !FRENCH_TERRITORIES.has(c))
  .map((code) => ({ code, label: nameOf(code) }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"));

export const countryLabel = (code: string) => nameOf(code);

export const regionSet = (country: string): RegionSet | undefined => REGIONS[country];

export const defaultRegion = (country: string) => REGIONS[country]?.defaultCode ?? "";

export const regionLabel = (country: string, region: string) =>
  REGIONS[country]?.regions.find((r) => r.code === region)?.label ?? "";

export const isEu = (country: string) => EU.has(country);

export const hasPostalCode = (country: string) => !NO_POSTAL_CODE.has(country);

export function postalLabel(country: string) {
  if (country === "US") return "Code ZIP";
  if (country === "GB") return "Postcode";
  return "Code postal";
}

export function postalCodeError(value: string, country: string, region = ""): string | null {
  const v = value.trim();
  if (!hasPostalCode(country)) return null;
  if (!v) return `${postalLabel(country)} requis`;
  const wanted = region || REGIONS[country]?.defaultCode;
  const r = REGIONS[country]?.regions.find((x) => x.code === wanted);
  if (r?.postal)
    return r.postal.test(v) ? null : `Invalide pour ${r.label} (ex. ${r.postalExample})`;
  const rule = POSTAL[country];
  if (rule) return rule.re.test(v) ? null : `Format invalide (ex. ${rule.example})`;
  return GENERIC_POSTAL.test(v) ? null : "Format invalide";
}

export function regionError(country: string, region: string): string | null {
  const set = REGIONS[country];
  if (!set) return null;
  return set.regions.some((r) => r.code === region) ? null : `${set.label} requis`;
}
