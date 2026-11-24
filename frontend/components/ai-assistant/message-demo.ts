// frontend/components/ai-assistant/message-demo.ts

import type { AssistantAttachment, AssistantMessage } from "./assistant-engine";

let seq = 0;
const id = () => `demo_${Date.now()}_${seq++}`;

export function demoConversation(): AssistantMessage[] {
  const now = Date.now();
  return [
    {
      id: id(),
      role: "user",
      text: "Peux-tu me montrer comment scorer un lead en TypeScript ?",
      createdAt: now - 60_000,
    },
    {
      id: id(),
      role: "agent",
      text: [
        "Voici une implémentation **pondérée** du score, avec un signal d'intention qui pèse plus lourd que la taille d'entreprise.",
        "",
        "```typescript",
        "type Lead = {",
        "  employees: number;",
        "  signal: 'recrutement' | 'levee' | 'expansion' | null;",
        "  lastTouchDays: number;",
        "};",
        "",
        "const SIGNAL_WEIGHT: Record<string, number> = {",
        "  recrutement: 0.4,",
        "  levee: 0.35,",
        "  expansion: 0.25,",
        "};",
        "",
        "export function scoreLead(lead: Lead): number {",
        "  const size = Math.min(1, lead.employees / 200);",
        "  const signal = lead.signal ? SIGNAL_WEIGHT[lead.signal] : 0;",
        "  const freshness = Math.max(0, 1 - lead.lastTouchDays / 30);",
        "  return Math.round((size * 0.3 + signal * 0.5 + freshness * 0.2) * 100);",
        "}",
        "```",
        "",
        "Le score final va de `0` à `100`. Au-delà de **70**, je recommande d'enrôler dans la séquence `Priorité haute`.",
      ].join("\n"),
      createdAt: now - 55_000,
    },
    {
      id: id(),
      role: "user",
      text: "Top. Maintenant compare-moi mes 4 meilleurs comptes par potentiel.",
      createdAt: now - 40_000,
    },
    {
      id: id(),
      role: "agent",
      text: [
        "Voici les 4 comptes à traiter cette semaine, classés par intention détectée :",
        "",
        "| Compte | Secteur | Signal | Score | Action |",
        "|--------|---------|--------|-------|--------|",
        "| Novacorp | SaaS | Recrutement CTO | 92 | Enrôler aujourd'hui |",
        "| Helios Labs | FinTech | Levée 12 M€ | 87 | Appel J+2 |",
        "| Kiwix | Retail | Expansion US | 78 | LinkedIn J+1 |",
        "| Atria Cloud | Infra | Aucun | 61 | Nurturing mensuel |",
        "",
        "Les trois premiers cumulent **plus de 60 % du potentiel** de votre pipeline.",
      ].join("\n"),
      createdAt: now - 35_000,
    },
    {
      id: id(),
      role: "user",
      text: "Résume-moi les 3 actions concrètes à lancer avant vendredi.",
      createdAt: now - 20_000,
    },
    {
      id: id(),
      role: "agent",
      text: [
        "Voici vos 3 actions prioritaires :",
        "",
        "- **Aujourd'hui** : enrôler Novacorp dans la séquence `Recrutement CTO`, ton direct.",
        "- **Demain** : préparer le call Helios Labs (levée récente → angle série B).",
        "- **Jeudi** : relance LinkedIn courte sur Kiwix, sans pièce jointe.",
        "",
        "Je peux exécuter la première dès maintenant si vous validez.",
      ].join("\n"),
      createdAt: now - 15_000,
    },
    {
      id: id(),
      role: "user",
      text: "Démo fichiers : envoi d'un CSV, d'une note TXT et d'un fichier JSON.",
      createdAt: now - 10_000,
      attachments: [
        { id: id(), name: "prospects.csv", size: 12_480, kind: "document" },
        { id: id(), name: "brief.txt", size: 2_104, kind: "document" },
        { id: id(), name: "parametres.json", size: 3_260, kind: "document" },
      ],
    },
    {
      id: id(),
      role: "agent",
      text: [
        "Les fichiers **CSV**, **TXT** et **JSON** peuvent être lus et transmis avec la demande.",
        "",
        "Les fichiers **Adobe** (PSD, AI…), **3D** (BLEND…), **audio**, **vidéo**, les archives ZIP et les PDF/Office binaires restent dans la zone de dépôt : le modèle ne reçoit pas leur contenu dans cette version.",
        "",
        "La limite est de 8 fichiers texte et 40 000 caractères par envoi. Les fichiers conservés ne sont pas envoyés tant que vous ne les retirez pas.",
      ].join("\n"),
      createdAt: now - 5_000,
    },
  ];
}

export function demoQueuedAttachments(): AssistantAttachment[] {
  return [
    { id: id(), name: "maquette.psd", size: 4_800_000, kind: "document" },
    { id: id(), name: "logo.ai", size: 1_240_000, kind: "document" },
    { id: id(), name: "scene.blend", size: 8_510_000, kind: "document" },
    { id: id(), name: "podcast.wav", size: 12_100_000, kind: "document" },
    { id: id(), name: "presentation.mp4", size: 18_400_000, kind: "document" },
    { id: id(), name: "archive.zip", size: 860_000, kind: "document" },
    { id: id(), name: "rapport.pdf", size: 640_000, kind: "document" },
  ];
}
