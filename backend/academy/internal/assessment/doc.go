// Package assessment évalue les réponses d'un apprenant à un exercice.
//
// # Rôle
//
// Ce package transforme un couple (Exercise, Answer) en un Result :
//   - Score int (0-100)
//   - Correct bool (score >= seuil de réussite)
//   - FeedbackMD string (Markdown prêt à afficher)
//   - ConceptsTouched []string (concepts à mettre à jour dans le Learner)
//
// Le package est PUR : aucun effet de bord, aucune mutation. Il ne connaît
// ni le Learner, ni le curriculum, ni la progression. Il est appelé par
// progress.Engine (Partie 4) qui, lui, applique les conséquences.
//
// # Architecture
//
//	┌─────────────────┐         ┌─────────────────┐
//	│  domain.Exercise│         │      Answer     │
//	│  (kind, payload)│         │  (user response)│
//	└────────┬────────┘         └────────┬────────┘
//	         │                            │
//	         └──────────┬─────────────────┘
//	                    ▼
//	         ┌─────────────────────┐
//	         │     Evaluator       │
//	         │  dispatch → Scorer  │
//	         └──────────┬──────────┘
//	                    ▼
//	         ┌─────────────────────┐
//	         │       Result        │
//	         │  Score, Correct,    │
//	         │  FeedbackMD,        │
//	         │  ConceptsTouched    │
//	         └─────────────────────┘
//
// # Types d'exercices supportés
//
//	1. MCQ            → score binaire (100 / 0)
//	2. MultiSelect    → score partiel (Jaccard pondéré)
//	3. FillBlank      → score par trou, tolérant aux accents/casse
//	4. OrderSteps     → score partiel (Kendall tau)
//	5. MatchPairs     → score par paire
//	6. FreeText       → score hybride (longueur + mots-clés), upgradable LLM
//	7. Scenario       → score par étape
//	8. InAppMission   → jamais évalué ici (validé par événement métier)
//
// # Seuil de réussite
//
// Par défaut : 70/100. Configurable par le champ `Evaluator.PassingScore`.
// Un exercice est "réussi" si son score final >= PassingScore.
//
// # Normalisation
//
// Toutes les réponses textuelles (FillBlank, FreeText) sont normalisées
// avant comparaison : minuscule, sans accents, espaces collapsés, ponctuation
// finale retirée. Voir normalizer.go.
//
// # Évolutivité
//
// Le scorer FreeText utilise actuellement une heuristique locale
// (comptage de mots + mots-clés). Il est conçu pour être remplacé par un
// appel LLM en production, sans changer le reste du moteur.
package assessment