// Package missions orchestre l'exécution et la validation des missions
// in-app : l'apprenant doit réellement agir dans l'app LeadCortex.
//
// # Rôle
//
// Une mission est validée lorsqu'un événement métier externe (ex.
// `lead.created`, `email.sent`, `company.viewed`) satisfait ses conditions.
// Ce package :
//
//   - reçoit ces événements via un EventBus typé ;
//   - les confronte aux missions en attente (non encore réussies) ;
//   - renvoie la liste des missions validées, sans muter le Learner.
//
// Le câblage vers progress.Engine (émission d'un MissionSucceeded) est
// laissé à la charge de l'appelant.
//
// # Architecture
//
//	App LeadCortex ──► BusinessEvent ──► EventBus
//	                                         │
//	                                         ▼
//	                                    Orchestrator
//	                                         │
//	                                         ├──► Registry.AllLessons()
//	                                         │       │
//	                                         │       └──► MissionBlock
//	                                         │
//	                                         └──► Validator
//	                                                │
//	                                                ▼
//	                                       []ValidatedMission
//
// # Événements métier
//
// Un BusinessEvent porte :
//
//   - un Kind (string, ex. "lead.created") ;
//   - un Timestamp ;
//   - un Payload (map[string]any) arbitraire.
//
// Le payload est aplati en chemins pointés pour être injecté dans le
// gamification.Context :
//
//	Payload: {"lead": {"score": 8, "country": "FR"}}
//	→ Values["lead.score"] = 8
//	→ Values["lead.country"] = "FR"
//	→ Values["event.kind"]  = "lead.created"
//	→ Values["event.at"]    = <timestamp>
//
// Ainsi une Condition YAML `{path: lead.score, op: ">=", value: 7}`
// matchera.
//
// # Validation
//
// Le Validator vérifie :
//
//  1. Que le Kind de l'événement correspond au Trigger de la mission.
//     Si Trigger est vide, la mission est ignorée (elle sera validée par
//     un autre mécanisme de polling d'état).
//  2. Que les Conditions (ConditionGroup) sont satisfaites, en
//     réutilisant l'évaluateur du package gamification.
//
// # Orchestrator
//
// L'Orchestrator parcourt les missions du registre de curriculum et
// renvoie celles qui viennent d'être validées, en sautant :
//
//   - les missions déjà marquées `completed` dans Learner.MissionProgress ;
//   - les missions sans Trigger.
//
// Il ne mute jamais le Learner. C'est l'appelant qui applique les
// conséquences (XP, unlocks, émission vers progress.Engine).
//
// # Simulation
//
// Le Simulator permet de rejouer une séquence d'événements fictifs sur
// un Learner, pour tester le contenu pédagogique ou reproduire un bug en
// dev. Voir simulator.go.
//
// # Déterminisme
//
// Aucune fonction de ce package n'appelle time.Now() en interne : le
// Timestamp de chaque événement est explicite. Les tests peuvent donc
// figer le temps.
package missions