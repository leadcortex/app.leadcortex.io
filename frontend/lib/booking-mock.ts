//frontend\lib\booking-mock.ts
export type BookingDuration = 15 | 30 | 45 | 60;

export type BookingLocation = "google-meet" | "zoom" | "teams" | "phone" | "onsite";

export type BookingWeekday = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";

export type BookingAvailability = {
  days: BookingWeekday[];
  start: string;
  end: string;
  timezone: string;
  buffer: number;
};

export type BookingQuestion = {
  id: string;
  label: string;
  required: boolean;
};

export type BookingLink = {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: BookingDuration;
  location: BookingLocation;
  color: "primary" | "amber" | "emerald" | "sky";
  availability: BookingAvailability;
  questions: BookingQuestion[];
  active: boolean;
  createdAt: string;
  views: number;
  bookings: number;
};

export const WEEKDAYS: { key: BookingWeekday; label: string }[] = [
  { key: "lun", label: "Lun" },
  { key: "mar", label: "Mar" },
  { key: "mer", label: "Mer" },
  { key: "jeu", label: "Jeu" },
  { key: "ven", label: "Ven" },
  { key: "sam", label: "Sam" },
  { key: "dim", label: "Dim" },
];

export const LOCATION_LABELS: Record<BookingLocation, string> = {
  "google-meet": "Google Meet",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  phone: "Appel téléphonique",
  onsite: "Sur site",
};

export const BOOKING_BASE_URL = "leadcortex.io/Utilisateur";

export const DEFAULT_AVAILABILITY: BookingAvailability = {
  days: ["lun", "mar", "mer", "jeu", "ven"],
  start: "09:00",
  end: "18:00",
  timezone: "Europe/Paris (GMT+1)",
  buffer: 15,
};

export const DEFAULT_QUESTIONS: BookingQuestion[] = [
  { id: "q1", label: "Nom de l'entreprise", required: true },
  { id: "q2", label: "Quel est votre principal enjeu ?", required: false },
];

export const mockBookingLinks: BookingLink[] = [
  {
    id: "bl1",
    name: "Discovery call — 30 min",
    slug: "discovery-30",
    description: "Premier échange pour qualifier votre besoin et vos priorités.",
    duration: 30,
    location: "google-meet",
    color: "primary",
    availability: DEFAULT_AVAILABILITY,
    questions: DEFAULT_QUESTIONS,
    active: true,
    createdAt: "12 janv.",
    views: 428,
    bookings: 37,
  },
  {
    id: "bl2",
    name: "Démo produit — 45 min",
    slug: "demo-45",
    description: "Démonstration guidée de LeadCortex sur votre cas d'usage.",
    duration: 45,
    location: "zoom",
    color: "amber",
    availability: { ...DEFAULT_AVAILABILITY, days: ["mar", "mer", "jeu"], start: "10:00" },
    questions: [{ id: "q1", label: "Combien de commerciaux dans l'équipe ?", required: true }],
    active: true,
    createdAt: "3 févr.",
    views: 216,
    bookings: 21,
  },
  {
    id: "bl3",
    name: "Point closing — 60 min",
    slug: "closing-60",
    description: "Validation contractuelle et plan de déploiement.",
    duration: 60,
    location: "teams",
    color: "emerald",
    availability: { ...DEFAULT_AVAILABILITY, days: ["lun", "ven"], end: "17:00" },
    questions: [],
    active: false,
    createdAt: "18 févr.",
    views: 74,
    bookings: 6,
  },
];

export type BookingRequest = {
  id: string;
  linkId: string;
  name: string;
  company: string;
  slot: string;
  status: "confirmé" | "en attente";
};

export const mockBookingRequests: BookingRequest[] = [
  {
    id: "br1",
    linkId: "bl1",
    name: "Jean-Luc Morel",
    company: "Aéronautique Lyon",
    slot: "Jeudi 14:00",
    status: "confirmé",
  },
  {
    id: "br2",
    linkId: "bl2",
    name: "Elena Rossi",
    company: "Motive France",
    slot: "Demain 10:30",
    status: "confirmé",
  },
  {
    id: "br3",
    linkId: "bl1",
    name: "Sophie Laurent",
    company: "Naval Systems",
    slot: "Vendredi 09:30",
    status: "en attente",
  },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function bookingUrl(slug: string): string {
  return `${BOOKING_BASE_URL}/${slug || "nouveau-rdv"}`;
}

/** Créneaux fictifs proposés dans l'aperçu du lien public. */
export function previewSlots(availability: BookingAvailability): string[] {
  const [h] = availability.start.split(":").map(Number);
  return Array.from({ length: 5 }, (_, i) => {
    const hour = (h ?? 9) + i;
    return `${String(hour).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
  });
}
