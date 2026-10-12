//frontend\lib\conversations-mock.ts
import { Linkedin, Mail, MessageCircle, MessageSquare, Instagram } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ChannelId = "linkedin" | "whatsapp" | "email" | "sms" | "instagram";

export type ChannelTheme = {
  id: ChannelId;
  label: string;
  icon: LucideIcon;

  accent: string;
  placeholder: string;

  handleLabel: string;
};

export const CHANNELS: Record<ChannelId, ChannelTheme> = {
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    accent: "var(--channel-linkedin)",
    placeholder: "Écrire un message LinkedIn...",
    handleLabel: "Profil",
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    accent: "var(--channel-whatsapp)",
    placeholder: "Écrire un message WhatsApp...",
    handleLabel: "Numéro",
  },
  email: {
    id: "email",
    label: "Email",
    icon: Mail,
    accent: "var(--channel-email)",
    placeholder: "Rédiger un email...",
    handleLabel: "Email",
  },
  sms: {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    accent: "var(--channel-sms)",
    placeholder: "Écrire un SMS...",
    handleLabel: "Mobile",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    accent: "var(--channel-instagram)",
    placeholder: "Écrire un message Instagram...",
    handleLabel: "Compte",
  },
};

export const CHANNEL_ORDER: ChannelId[] = ["linkedin", "whatsapp", "email", "sms", "instagram"];

export type ChatAttachment = {
  id: string;
  name: string;
  size: number;
  kind: "image" | "document";
  url?: string;
};

export type ChatMessage = {
  id: string;
  me: boolean;
  text: string;
  time: string;
  status?: "envoyé" | "délivré" | "lu";
  attachments?: ChatAttachment[];
};

export type ProspectThread = {
  id: string;
  contact: string;
  role: string;
  company: string;
  avatarTone: "primary" | "amber" | "emerald" | "sky";
  channel: ChannelId;
  channels: ChannelId[];
  handles: Partial<Record<ChannelId, string>>;
  last: string;
  time: string;
  unread: number;
  stage: string;
  location: string;
  tags: string[];
  notes: string;
  messages: Record<ChannelId, ChatMessage[]>;

  favorite?: boolean;
};

const empty: Record<ChannelId, ChatMessage[]> = {
  linkedin: [],
  whatsapp: [],
  email: [],
  sms: [],
  instagram: [],
};

export const threads: ProspectThread[] = [
  {
    id: "cv1",
    contact: "Jean-Luc Morel",
    role: "Directeur Achats",
    company: "Aéronautique Lyon",
    avatarTone: "primary",
    channel: "linkedin",
    channels: ["linkedin", "email", "whatsapp"],
    handles: {
      linkedin: "in/jlmorel",
      email: "jl.morel@aero-lyon.fr",
      whatsapp: "+33 6 12 44 90 21",
    },
    last: "OK pour jeudi 14h, je bloque le créneau.",
    time: "10:24",
    unread: 2,
    stage: "Négociation",
    location: "Lyon, France",
    tags: ["Aéronautique", "ICP A", "Décideur"],
    notes: "Cherche à réduire le temps de qualification. Budget validé pour Q2.",
    messages: {
      ...empty,
      linkedin: [
        {
          id: "m1",
          me: true,
          text: "Bonjour Jean-Luc, j'ai vu votre intervention sur l'industrialisation des achats. On aide des équipes comme la vôtre à diviser par 3 le temps de qualification fournisseur.",
          time: "Lun 09:02",
          status: "lu",
        },
        {
          id: "m2",
          me: false,
          text: "Bonjour, sujet intéressant. Vous travaillez déjà avec des acteurs de l'aéronautique ?",
          time: "Lun 11:40",
        },
        {
          id: "m3",
          me: true,
          text: "Oui — je vous partage deux cas clients et notre one-pager technique.",
          time: "Lun 11:58",
          status: "lu",
          attachments: [
            { id: "a1", name: "LeadCortex-cas-clients.pdf", size: 482331, kind: "document" },
            { id: "a2", name: "architecture.png", size: 214880, kind: "image" },
          ],
        },
        {
          id: "m4",
          me: false,
          text: "Parfait. On cale 30 minutes cette semaine ?",
          time: "Aujourd'hui 10:12",
        },
        {
          id: "m5",
          me: false,
          text: "OK pour jeudi 14h, je bloque le créneau.",
          time: "Aujourd'hui 10:24",
        },
      ],
      email: [
        {
          id: "e1",
          me: true,
          text: "Objet : Suite à notre échange — proposition commerciale\n\nBonjour Jean-Luc, comme convenu vous trouverez la proposition en pièce jointe.",
          time: "Ven 16:20",
          status: "délivré",
          attachments: [
            { id: "a3", name: "Proposition-AeroLyon.pdf", size: 918220, kind: "document" },
          ],
        },
        { id: "e2", me: false, text: "Bien reçu, je fais circuler en interne.", time: "Ven 18:03" },
      ],
      whatsapp: [
        {
          id: "w1",
          me: false,
          text: "Je suis en déplacement, je vous rappelle ce soir 👍",
          time: "Hier 14:11",
        },
        { id: "w2", me: true, text: "Parfait, bonne route !", time: "Hier 14:12", status: "lu" },
      ],
    },
  },
  {
    id: "cv2",
    contact: "Sophie Laurent",
    role: "Responsable Innovation",
    company: "Naval Systems",
    avatarTone: "sky",
    channel: "email",
    channels: ["email", "linkedin", "sms"],
    handles: {
      email: "s.laurent@navalsystems.com",
      linkedin: "in/sophielaurent",
      sms: "+33 7 88 21 03 55",
    },
    last: "Je te partage l'appel d'offres.",
    time: "09:12",
    unread: 1,
    stage: "Qualifié",
    location: "Brest, France",
    tags: ["Naval", "Appel d'offres"],
    notes: "Deadline de réponse à l'AO : fin du mois. Sensible à la conformité RGPD.",
    messages: {
      ...empty,
      email: [
        {
          id: "e1",
          me: false,
          text: "Bonjour, je vous partage l'appel d'offres en pièce jointe. Merci de confirmer votre intention de répondre.",
          time: "Aujourd'hui 09:12",
          attachments: [{ id: "a1", name: "AO-2026-naval.pdf", size: 1244000, kind: "document" }],
        },
        {
          id: "e2",
          me: true,
          text: "Merci Sophie, nous confirmons. Je reviens vers vous avec les éléments de conformité.",
          time: "Aujourd'hui 09:40",
          status: "délivré",
        },
      ],
      linkedin: [
        {
          id: "l1",
          me: true,
          text: "Ravi de vous compter dans mon réseau Sophie !",
          time: "12 janv.",
          status: "lu",
        },
      ],
      sms: [
        {
          id: "s1",
          me: true,
          text: "Bonjour Sophie, disponible pour un point rapide ?",
          time: "Hier 08:30",
          status: "envoyé",
        },
      ],
    },
  },
  {
    id: "cv3",
    contact: "Elena Rossi",
    role: "Head of Growth",
    company: "Motive France",
    avatarTone: "amber",
    channel: "whatsapp",
    channels: ["whatsapp", "linkedin", "instagram"],
    handles: {
      whatsapp: "+33 6 74 55 12 09",
      linkedin: "in/elenarossi",
      instagram: "@elena.rossi",
    },
    last: "Ravie de vous avoir eu au téléphone 🙌",
    time: "hier",
    unread: 0,
    stage: "Démo planifiée",
    location: "Paris, France",
    tags: ["SaaS", "Growth"],
    notes: "Préfère WhatsApp. Démo produit prévue demain 10h30.",
    messages: {
      ...empty,
      whatsapp: [
        { id: "w1", me: false, text: "Ravie de vous avoir eu au téléphone 🙌", time: "Hier 17:45" },
        {
          id: "w2",
          me: true,
          text: "De même ! Voici le récap de nos échanges et le planning de démo.",
          time: "Hier 17:52",
          status: "lu",
          attachments: [{ id: "a1", name: "recap-demo.png", size: 320111, kind: "image" }],
        },
        { id: "w3", me: false, text: "Top, à demain 10h30 alors.", time: "Hier 18:01" },
      ],
      linkedin: [{ id: "l1", me: false, text: "Merci pour la connexion !", time: "3 févr." }],
      instagram: [
        {
          id: "i1",
          me: false,
          text: "J'adore votre dernier post sur la prospection 🔥",
          time: "1 févr.",
        },
      ],
    },
  },
  {
    id: "cv4",
    contact: "Pierre Vasseur",
    role: "CEO",
    company: "SteelPoint FR",
    avatarTone: "emerald",
    channel: "sms",
    channels: ["sms", "email"],
    handles: { sms: "+33 6 03 77 41 28", email: "p.vasseur@steelpoint.fr" },
    last: "Vu, je regarde et reviens vers vous.",
    time: "hier",
    unread: 0,
    stage: "Proposition",
    location: "Lille, France",
    tags: ["Industrie", "Closing"],
    notes: "Décideur unique, cycle court. Relancer vendredi si pas de réponse.",
    messages: {
      ...empty,
      sms: [
        {
          id: "s1",
          me: true,
          text: "Bonjour Pierre, la proposition est dans votre boîte mail.",
          time: "Hier 11:02",
          status: "délivré",
        },
        { id: "s2", me: false, text: "Vu, je regarde et reviens vers vous.", time: "Hier 11:20" },
      ],
      email: [
        {
          id: "e1",
          me: true,
          text: "Objet : Proposition SteelPoint — 18 000 €\n\nBonjour Pierre, voici le détail du périmètre.",
          time: "Hier 10:58",
          status: "lu",
          attachments: [
            { id: "a1", name: "Proposition-SteelPoint.pdf", size: 651200, kind: "document" },
          ],
        },
      ],
    },
  },
];

export const AVATAR_TONES: Record<ProspectThread["avatarTone"], string> = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("");
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Réponse simulée du prospect, adaptée au canal. */
export function simulatedReply(channel: ChannelId): string {
  const replies: Record<ChannelId, string[]> = {
    linkedin: [
      "Merci pour le message, je regarde ça.",
      "Intéressant, on en discute cette semaine ?",
    ],
    whatsapp: ["Bien reçu 👍", "Parfait, merci !"],
    email: ["Bien noté, je reviens vers vous après validation interne.", "Merci pour l'envoi."],
    sms: ["OK, merci.", "Reçu, je vous rappelle."],
    instagram: ["Super, merci pour l'info !", "Je regarde ça 🙌"],
  };
  const list = replies[channel];
  return list[Math.floor(Math.random() * list.length)] ?? "Bien reçu.";
}
