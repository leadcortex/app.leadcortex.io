// Package progress implémente le moteur de progression de l'academy.
//
// # Rôle
//
// Ce package orchestre l'avancement d'un apprenant à travers le curriculum :
//   - évaluation des conditions de déblocage (gates)
//   - transitions d'état (FSM : locked → available → in_progress → completed → mastered)
//   - application des événements métier (exercice répondu, mission réussie…)
//   - calcul des snapshots pour l'UI
//   - calcul du « prochain recommandé »
//
// # Architecture
//
//	         ┌──────────────────┐
//	         │  curriculum.Reg  │  (immuable)
//	         └────────┬─────────┘
//	                  │
//	    ┌─────────────┴──────────────┐
//	    │                            │
//	    ▼                            ▼
//	┌─────────┐              ┌───────────────┐
//	│  Gates  │              │      FSM      │
//	│ unlock? │──transition─▶│  state change │
//	└─────────┘              └───────┬───────┘
//	    ▲                            │
//	    │                            ▼
//	    │                    ┌───────────────┐
//	    │  domain.Learner    │    Engine     │──▶ emits []domain.Event
//	    └────────────────────│   ApplyEvent  │
//	                         └───────┬───────┘
//	                                 │
//	                                 ▼
//	                         ┌───────────────┐
//	                         │   Snapshot    │──▶ ProgressSnapshot (UI)
//	                         └───────────────┘
//
// # Concepts clés
//
//   - **Gate** : condition d'accès à une leçon/un module/un programme.
//     Les gates sont évaluées à la demande, jamais stockées.
//
//   - **Transition** : passage d'un LessonStatus à un autre. Toutes les
//     transitions sont centralisées dans `fsm.go` et validées avant
//     application.
//
//   - **Event** : fait métier (leçon démarrée, exercice répondu, mission
//     réussie…). Le moteur reçoit des événements et met à jour le Learner.
//
//   - **Snapshot** : vue immuable et sérialisable de la progression d'un
//     apprenant, optimisée pour l'UI React. Ne contient que ce dont l'UI a
//     besoin, pas tout le Learner.
//
// # Déterminisme et testabilité
//
// L'Engine prend un `Clock` injectable (par défaut `time.Now`). Cela permet
// de tester le calcul de streak sur des dates figées, sans dépendre du
// temps réel.
//
// # Thread-safety
//
// L'Engine est safe en lecture concurrente (registry immuable). Les
// mutations du Learner doivent être sérialisées côté appelant (repository
// ou service layer), pas par ce package.
package progress