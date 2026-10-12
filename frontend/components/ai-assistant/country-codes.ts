//frontend\components\ai-assistant\country-codes.ts
export type CountryRegion =
  "Europe" | "Afrique" | "Amériques" | "Amérique du Sud" | "Asie" | "Océanie";

export type CountryCode = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  region: CountryRegion;
};

export function flagFromIso(iso: string): string {
  if (!iso || iso.length !== 2) return "🏳️";
  try {
    return iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  } catch {
    return "🏳️";
  }
}

const RAW: Array<[string, string, string, CountryRegion]> = [
  ["FR", "France", "+33", "Europe"],
  ["BE", "Belgique", "+32", "Europe"],
  ["CH", "Suisse", "+41", "Europe"],
  ["LU", "Luxembourg", "+352", "Europe"],
  ["MC", "Monaco", "+377", "Europe"],
  ["DE", "Allemagne", "+49", "Europe"],
  ["AT", "Autriche", "+43", "Europe"],
  ["IT", "Italie", "+39", "Europe"],
  ["ES", "Espagne", "+34", "Europe"],
  ["PT", "Portugal", "+351", "Europe"],
  ["NL", "Pays-Bas", "+31", "Europe"],
  ["GB", "Royaume-Uni", "+44", "Europe"],
  ["IE", "Irlande", "+353", "Europe"],
  ["DK", "Danemark", "+45", "Europe"],
  ["NO", "Norvège", "+47", "Europe"],
  ["SE", "Suède", "+46", "Europe"],
  ["FI", "Finlande", "+358", "Europe"],
  ["IS", "Islande", "+354", "Europe"],
  ["PL", "Pologne", "+48", "Europe"],
  ["CZ", "Tchéquie", "+420", "Europe"],
  ["SK", "Slovaquie", "+421", "Europe"],
  ["HU", "Hongrie", "+36", "Europe"],
  ["RO", "Roumanie", "+40", "Europe"],
  ["BG", "Bulgarie", "+359", "Europe"],
  ["GR", "Grèce", "+30", "Europe"],
  ["HR", "Croatie", "+385", "Europe"],
  ["SI", "Slovénie", "+386", "Europe"],
  ["RS", "Serbie", "+381", "Europe"],
  ["BA", "Bosnie-Herzégovine", "+387", "Europe"],
  ["ME", "Monténégro", "+382", "Europe"],
  ["MK", "Macédoine du Nord", "+389", "Europe"],
  ["AL", "Albanie", "+355", "Europe"],
  ["XK", "Kosovo", "+383", "Europe"],
  ["MD", "Moldavie", "+373", "Europe"],
  ["UA", "Ukraine", "+380", "Europe"],
  ["BY", "Bélarus", "+375", "Europe"],
  ["RU", "Russie", "+7", "Europe"],
  ["EE", "Estonie", "+372", "Europe"],
  ["LV", "Lettonie", "+371", "Europe"],
  ["LT", "Lituanie", "+370", "Europe"],
  ["MT", "Malte", "+356", "Europe"],
  ["CY", "Chypre", "+357", "Europe"],
  ["AD", "Andorre", "+376", "Europe"],
  ["SM", "Saint-Marin", "+378", "Europe"],
  ["VA", "Vatican", "+39", "Europe"],
  ["LI", "Liechtenstein", "+423", "Europe"],
  ["GI", "Gibraltar", "+350", "Europe"],
  ["FO", "Îles Féroé", "+298", "Europe"],
  ["GL", "Groenland", "+299", "Europe"],

  ["DZ", "Algérie", "+213", "Afrique"],
  ["MA", "Maroc", "+212", "Afrique"],
  ["TN", "Tunisie", "+216", "Afrique"],
  ["LY", "Libye", "+218", "Afrique"],
  ["EG", "Égypte", "+20", "Afrique"],
  ["SN", "Sénégal", "+221", "Afrique"],
  ["ML", "Mali", "+223", "Afrique"],
  ["GN", "Guinée", "+224", "Afrique"],
  ["CI", "Côte d'Ivoire", "+225", "Afrique"],
  ["BF", "Burkina Faso", "+226", "Afrique"],
  ["NE", "Niger", "+227", "Afrique"],
  ["TG", "Togo", "+228", "Afrique"],
  ["BJ", "Bénin", "+229", "Afrique"],
  ["MU", "Maurice", "+230", "Afrique"],
  ["LR", "Liberia", "+231", "Afrique"],
  ["SL", "Sierra Leone", "+232", "Afrique"],
  ["GH", "Ghana", "+233", "Afrique"],
  ["NG", "Nigéria", "+234", "Afrique"],
  ["TD", "Tchad", "+235", "Afrique"],
  ["CF", "République centrafricaine", "+236", "Afrique"],
  ["CM", "Cameroun", "+237", "Afrique"],
  ["CV", "Cap-Vert", "+238", "Afrique"],
  ["ST", "Sao Tomé-et-Principe", "+239", "Afrique"],
  ["GQ", "Guinée équatoriale", "+240", "Afrique"],
  ["GA", "Gabon", "+241", "Afrique"],
  ["CG", "Congo-Brazzaville", "+242", "Afrique"],
  ["CD", "Congo (RDC)", "+243", "Afrique"],
  ["AO", "Angola", "+244", "Afrique"],
  ["GW", "Guinée-Bissau", "+245", "Afrique"],
  ["SC", "Seychelles", "+248", "Afrique"],
  ["SD", "Soudan", "+249", "Afrique"],
  ["RW", "Rwanda", "+250", "Afrique"],
  ["ET", "Éthiopie", "+251", "Afrique"],
  ["SO", "Somalie", "+252", "Afrique"],
  ["DJ", "Djibouti", "+253", "Afrique"],
  ["KE", "Kenya", "+254", "Afrique"],
  ["TZ", "Tanzanie", "+255", "Afrique"],
  ["UG", "Ouganda", "+256", "Afrique"],
  ["BI", "Burundi", "+257", "Afrique"],
  ["MZ", "Mozambique", "+258", "Afrique"],
  ["ZM", "Zambie", "+260", "Afrique"],
  ["MG", "Madagascar", "+261", "Afrique"],
  ["RE", "La Réunion", "+262", "Afrique"],
  ["YT", "Mayotte", "+262", "Afrique"],
  ["ZW", "Zimbabwe", "+263", "Afrique"],
  ["NA", "Namibie", "+264", "Afrique"],
  ["MW", "Malawi", "+265", "Afrique"],
  ["LS", "Lesotho", "+266", "Afrique"],
  ["BW", "Botswana", "+267", "Afrique"],
  ["SZ", "Eswatini", "+268", "Afrique"],
  ["KM", "Comores", "+269", "Afrique"],
  ["ZA", "Afrique du Sud", "+27", "Afrique"],
  ["SS", "Soudan du Sud", "+211", "Afrique"],
  ["ER", "Érythrée", "+291", "Afrique"],
  ["MR", "Mauritanie", "+222", "Afrique"],
  ["GM", "Gambie", "+220", "Afrique"],
  ["SH", "Sainte-Hélène", "+290", "Afrique"],

  ["US", "États-Unis", "+1", "Amériques"],
  ["CA", "Canada", "+1", "Amériques"],
  ["MX", "Mexique", "+52", "Amériques"],
  ["GT", "Guatemala", "+502", "Amériques"],
  ["BZ", "Belize", "+501", "Amériques"],
  ["SV", "Salvador", "+503", "Amériques"],
  ["HN", "Honduras", "+504", "Amériques"],
  ["NI", "Nicaragua", "+505", "Amériques"],
  ["CR", "Costa Rica", "+506", "Amériques"],
  ["PA", "Panama", "+507", "Amériques"],
  ["CU", "Cuba", "+53", "Amériques"],
  ["JM", "Jamaïque", "+1", "Amériques"],
  ["HT", "Haïti", "+509", "Amériques"],
  ["DO", "République dominicaine", "+1", "Amériques"],
  ["PR", "Porto Rico", "+1", "Amériques"],
  ["BS", "Bahamas", "+1", "Amériques"],
  ["BB", "Barbade", "+1", "Amériques"],
  ["TT", "Trinité-et-Tobago", "+1", "Amériques"],
  ["AG", "Antigua-et-Barbuda", "+1", "Amériques"],
  ["DM", "Dominique", "+1", "Amériques"],
  ["GD", "Grenade", "+1", "Amériques"],
  ["KN", "Saint-Christophe-et-Niévès", "+1", "Amériques"],
  ["LC", "Sainte-Lucie", "+1", "Amériques"],
  ["VC", "Saint-Vincent-et-les-Grenadines", "+1", "Amériques"],

  ["BR", "Brésil", "+55", "Amérique du Sud"],
  ["AR", "Argentine", "+54", "Amérique du Sud"],
  ["CL", "Chili", "+56", "Amérique du Sud"],
  ["CO", "Colombie", "+57", "Amérique du Sud"],
  ["VE", "Venezuela", "+58", "Amérique du Sud"],
  ["PE", "Pérou", "+51", "Amérique du Sud"],
  ["EC", "Équateur", "+593", "Amérique du Sud"],
  ["BO", "Bolivie", "+591", "Amérique du Sud"],
  ["PY", "Paraguay", "+595", "Amérique du Sud"],
  ["UY", "Uruguay", "+598", "Amérique du Sud"],
  ["GY", "Guyana", "+592", "Amérique du Sud"],
  ["SR", "Suriname", "+597", "Amérique du Sud"],
  ["GF", "Guyane française", "+594", "Amérique du Sud"],

  ["CN", "Chine", "+86", "Asie"],
  ["HK", "Hong Kong", "+852", "Asie"],
  ["MO", "Macao", "+853", "Asie"],
  ["TW", "Taïwan", "+886", "Asie"],
  ["JP", "Japon", "+81", "Asie"],
  ["KR", "Corée du Sud", "+82", "Asie"],
  ["KP", "Corée du Nord", "+850", "Asie"],
  ["IN", "Inde", "+91", "Asie"],
  ["PK", "Pakistan", "+92", "Asie"],
  ["BD", "Bangladesh", "+880", "Asie"],
  ["LK", "Sri Lanka", "+94", "Asie"],
  ["NP", "Népal", "+977", "Asie"],
  ["BT", "Bhoutan", "+975", "Asie"],
  ["MV", "Maldives", "+960", "Asie"],
  ["AF", "Afghanistan", "+93", "Asie"],
  ["IR", "Iran", "+98", "Asie"],
  ["IQ", "Irak", "+964", "Asie"],
  ["SA", "Arabie saoudite", "+966", "Asie"],
  ["AE", "Émirats arabes unis", "+971", "Asie"],
  ["QA", "Qatar", "+974", "Asie"],
  ["BH", "Bahreïn", "+973", "Asie"],
  ["KW", "Koweït", "+965", "Asie"],
  ["OM", "Oman", "+968", "Asie"],
  ["YE", "Yémen", "+967", "Asie"],
  ["JO", "Jordanie", "+962", "Asie"],
  ["LB", "Liban", "+961", "Asie"],
  ["SY", "Syrie", "+963", "Asie"],
  ["IL", "Israël", "+972", "Asie"],
  ["PS", "Palestine", "+970", "Asie"],
  ["TR", "Turquie", "+90", "Asie"],
  ["GE", "Géorgie", "+995", "Asie"],
  ["AM", "Arménie", "+374", "Asie"],
  ["AZ", "Azerbaïdjan", "+994", "Asie"],
  ["KZ", "Kazakhstan", "+7", "Asie"],
  ["UZ", "Ouzbékistan", "+998", "Asie"],
  ["TM", "Turkménistan", "+993", "Asie"],
  ["TJ", "Tadjikistan", "+992", "Asie"],
  ["KG", "Kirghizistan", "+996", "Asie"],
  ["MN", "Mongolie", "+976", "Asie"],
  ["TH", "Thaïlande", "+66", "Asie"],
  ["VN", "Viêt Nam", "+84", "Asie"],
  ["LA", "Laos", "+856", "Asie"],
  ["KH", "Cambodge", "+855", "Asie"],
  ["MM", "Myanmar", "+95", "Asie"],
  ["MY", "Malaisie", "+60", "Asie"],
  ["SG", "Singapour", "+65", "Asie"],
  ["ID", "Indonésie", "+62", "Asie"],
  ["PH", "Philippines", "+63", "Asie"],
  ["BN", "Brunei", "+673", "Asie"],
  ["TL", "Timor oriental", "+670", "Asie"],

  ["AU", "Australie", "+61", "Océanie"],
  ["NZ", "Nouvelle-Zélande", "+64", "Océanie"],
  ["FJ", "Fidji", "+679", "Océanie"],
  ["PG", "Papouasie-Nouvelle-Guinée", "+675", "Océanie"],
  ["NC", "Nouvelle-Calédonie", "+687", "Océanie"],
  ["PF", "Polynésie française", "+689", "Océanie"],
  ["WS", "Samoa", "+685", "Océanie"],
  ["TO", "Tonga", "+676", "Océanie"],
  ["VU", "Vanuatu", "+678", "Océanie"],
  ["SB", "Îles Salomon", "+677", "Océanie"],
  ["KI", "Kiribati", "+686", "Océanie"],
  ["TV", "Tuvalu", "+688", "Océanie"],
  ["NR", "Nauru", "+674", "Océanie"],
  ["PW", "Palaos", "+680", "Océanie"],
  ["FM", "Micronésie", "+691", "Océanie"],
  ["MH", "Îles Marshall", "+692", "Océanie"],
];

export const COUNTRY_CODES: CountryCode[] = RAW.map(([iso, name, dial, region]) => ({
  iso,
  name,
  dial,
  region,
  flag: flagFromIso(iso),
}));

export const REGION_ORDER: CountryRegion[] = [
  "Europe",
  "Afrique",
  "Amériques",
  "Amérique du Sud",
  "Asie",
  "Océanie",
];

export function getCountryByIso(iso: string): CountryCode | undefined {
  return COUNTRY_CODES.find((c) => c.iso === iso);
}

export function getCountryByDial(dial: string): CountryCode | undefined {
  return COUNTRY_CODES.find((c) => c.dial === dial);
}

export function splitPhoneNumber(
  input: string,
  fallbackIso = "FR",
): {
  iso: string;
  local: string;
} {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { iso: fallbackIso, local: "" };

  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  const normalized = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  for (const c of sorted) {
    if (normalized.startsWith(c.dial)) {
      return { iso: c.iso, local: normalized.slice(c.dial.length).trim() };
    }
  }
  return { iso: fallbackIso, local: trimmed };
}
