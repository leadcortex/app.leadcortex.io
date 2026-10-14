// academy/src/data/curriculum/index.ts
/**
 * Programs de l'Académie LeadCortex.
 *
 * Le curriculum est découpé en 5 fichiers JSON indépendants (un par
 * programme) pour faciliter la maintenance. Chaque fichier respecte le
 * même schéma (schema_version 1.0) et contient un seul programme complet.
 *
 * Ce module les réunit dans un tableau ordonné et exporte le tableau
 * `programs` tel qu'attendu par le reste de l'application (modèle,
 * composants Academy, tests).
 */
import p1Foundations from "./p1-foundations.json";
import p2Outbound from "./p2-outbound.json";
import p3Discovery from "./p3-discovery.json";
import p4Closing from "./p4-closing.json";
import p5Strategic from "./p5-strategic.json";

export const programs = [
  p1Foundations,
  p2Outbound,
  p3Discovery,
  p4Closing,
  p5Strategic,
];

export default programs;