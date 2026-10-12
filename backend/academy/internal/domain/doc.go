// Package domain définit le modèle métier de LeadCortex Academy.
//
// Ce package est la fondation pure du domaine : il ne dépend d'aucune
// infrastructure (HTTP, YAML, base de données, logging). Toutes les autres
// couches (curriculum, progress, assessment, missions…) s'appuient sur lui.
//
// # Concepts clés
//
//   - Learner    : l'utilisateur qui apprend. Mono-utilisateur aujourd'hui,
//                  prêt pour du multi-tenant plus tard via TenantID optionnel.
//   - Program    : un grand ensemble pédagogique (Foundations, Outbound…).
//   - Module     : une subdivision d'un programme (3-6 modules par programme).
//   - Lesson     : l'unité d'apprentissage atomique (4-8 leçons par module).
//   - Block      : une section d'une leçon (cover, theory, practice…).
//   - Exercise   : un exercice à l'intérieur d'un bloc de pratique.
//   - Mission    : une action in-app que l'apprenant doit exécuter.
//   - Concept    : une notion enseignée, unité du spaced repetition.
//   - SrsCard    : une carte de révision SM-2 liée à un concept.
//   - Badge      : une récompense débloquée sous condition.
//   - Avatar     : une mascotte débloquée par progression (voir Partie 8).
//
// # Invariants
//
//   - Tous les identifiants sont des chaînes non vides, uniques dans leur
//     collection parente.
//   - Les références inter-entités (prerequisiteLessonIds, unlockAvatars…)
//     pointent vers des IDs existants — leur validation est effectuée par
//     le package `curriculum` (Partie 3), pas ici.
//   - Les entités sont immuables après construction : aucune méthode ne
//     mute un Program, une Lesson ou un Exercise. Seul le Learner est muté,
//     via des méthodes explicites (AddXP, RecordAnswer…).
package domain