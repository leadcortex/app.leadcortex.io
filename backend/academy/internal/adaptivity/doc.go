// Package adaptivity produit une vue personnalisée de l'apprentissage :
// détection de lacunes, profil de compétences, ajustement de difficulté,
// recommandations et plans de session.
//
// # Rôle
//
// Ce package transforme un Learner (état brut) + un registry (curriculum)
// + éventuellement des cartes SRS en un ensemble de décisions concrètes :
//
//   - quels concepts sont fragiles ? (signals.go)
//   - quel est mon niveau réel en ce moment ? (profile.go)
//   - quelle difficulté viser pour les prochains exercices ? (difficulty.go)
//   - que faire maintenant ? (recommender.go)
//   - comment structurer la session ? (planner.go)
//
// Il est PUR : aucune fonction ne mute le Learner, le registry ou les
// cartes SRS. Toutes les décisions sont retournées à l'appelant qui les
// affichera ou les appliquera.
//
// # Architecture
//
//	Learner + Registry + SrsCards
//	          │
//	          ▼
//	   ┌─────────────┐
//	   │  Detect     │──► []Signal      (lacunes, inactivité…)
//	   │  Signals    │
//	   └─────┬───────┘
//	         │
//	         ▼
//	   ┌─────────────┐
//	   │  Build      │──► Profile       (forces, faiblesses, difficulté cible)
//	   │  Profile    │
//	   └─────┬───────┘
//	         │
//	         ├──► Recommend    ──► Recommendation  (1 action prioritaire)
//	         │
//	         └──► PlanSession ──► SessionPlan      (séquence d'actions)
//
// # Déterminisme
//
// Aucune fonction n'appelle time.Now() : un `now time.Time` explicite est
// toujours fourni par l'appelant. Les tests peuvent donc figer le temps.
//
// # Intégration
//
// L'API HTTP expose typiquement :
//
//	GET /me/profile          → Profile
//	GET /me/recommendation   → Recommendation
//	POST /me/plan            → SessionPlan (mode demandé dans le body)
//
// Le package est volontairement découplé de la persistance : l'appelant
// fournit un Learner déjà chargé et un registre immuable.
package adaptivity