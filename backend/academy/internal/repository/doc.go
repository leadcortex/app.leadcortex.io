// Package repository abstrait la persistance de l'academy.
//
// # Rôle
//
// Ce package expose l'interface Repository : le contrat unique auquel
// l'API et les services se branchent. L'implémentation concrète varie :
//
//   - dev     : Memory (in-memory, thread-safe) — par défaut
//   - prod    : PostgreSQL (à brancher ultérieurement)
//
// L'API ne connaît que l'interface. Changer d'implémentation ne nécessite
// aucune modification ailleurs.
//
// # Mono-utilisateur vs multi-tenant
//
// En V1, un seul Learner est stocké sous l'identifiant "default". Le champ
// TenantID du domain.Learner reste vide. Pour passer en multi-tenant plus
// tard, il suffira de préfixer les clés par TenantID dans l'implémentation
// SQL — l'interface ne changera pas.
//
// # Idempotence
//
// AppendEvent / ListRecentEvents fournissent un journal minimal
// d'événements métier par apprenant. Il sert à :
//
//   - déboguer (rejouer une séquence)
//   - éviter les doubles traitements lors de retries HTTP
//
// Le journal n'est PAS un event sourcing complet : c'est un tampon borné.
//
// # Concurrence
//
// Toutes les méthodes de Repository sont safe pour un usage concurrent.
// L'implémentation Memory utilise un sync.RWMutex global (suffisant en dev).
//
// # Deep-copy défensif
//
// Les méthodes retournent toujours des copies. Modifier un *Learner
// récupéré n'affecte JAMAIS l'état interne du repository. Cela évite les
// mutations accidentelles côté API.
package repository