// Package api expose le serveur HTTP de LeadCortex Academy.
//
// # Rôle
//
// Ce package est la seule couche qui connaît HTTP. Il :
//
//   - traduit les requêtes HTTP en appels aux services internes
//     (progress.Engine, assessment.Evaluator, missions.Orchestrator…) ;
//   - sérialise les réponses en JSON ;
//   - diffuse les événements temps réel via SSE.
//
// Aucun package interne n'importe api. La dépendance est strictement
// unidirectionnelle : api → tous les autres.
//
// # Conventions REST
//
//   - Préfixe : /api/v1
//   - Contenu : application/json (sauf SSE : text/event-stream)
//   - Erreurs : JSON structuré {error, message, code}
//   - Identifiants : strings stables exposés en clair (pas de hash)
//   - Dates : RFC3339 UTC (format JSON par défaut de time.Time)
//
// # Authentification (V1)
//
// Aucune auth 2.0 en V1. Un middleware « learner » lit l'en-tête
// X-Learner-ID ; si absent et que l'environnement est dev/staging,
// il retombe sur repository.DefaultLearnerID ("default").
//
// En production, l'absence de l'en-tête produit une 401. Le jour où
// l'auth 2.0 arrive, seul ce middleware changera — aucun handler
// n'aura à être modifié.
//
// # SSE
//
// L'endpoint GET /api/v1/events/stream pousse au client les événements
// métier validés par le missions.Orchestrator (mission réussie, badge
// gagné, montée de niveau…). Le hub maintient une liste de clients
// abonnés et diffuse en non-bloquant.
//
// # Structure
//
//	doc.go            ce fichier
//	errors.go         mapping erreur interne → réponse HTTP
//	dto.go            Data Transfer Objects + mappers
//	context.go        helpers d'accès au contexte de requête
//	middleware.go     middlewares HTTP (request-id, log, recovery, CORS, learner)
//	server.go         struct Server + NewServer + Start + Shutdown
//	router.go         assemblage du routeur chi
//	sse.go            hub + handler SSE
//	handlers_*.go     un fichier par domaine fonctionnel
package api