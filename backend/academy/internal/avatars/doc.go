// Package avatars gère le catalogue, les déblocages et le rendu des
// avatars de LeadCortex Academy.
//
// # Rôle
//
// Un avatar est une mascotte débloquable que l'apprenant peut équiper
// pour personnaliser son expérience. Il existe 12 avatars en deux tiers :
//
//   - Classic (6)    : progression standard du curriculum
//   - Collector (6)  : méta-progression, plus rares et plus longs à obtenir
//
// Chaque avatar a une ou plusieurs poses (neutral, happy, curious,
// thinking, celebrating). Le rendu SVG est piloté côté frontend à partir
// d'un chemin d'asset résolu par ce package.
//
// # Architecture
//
//	Catalog  ──► []domain.Avatar (12 entrées immuables)
//	   │
//	   ├──► Unlock   : évalue les conditions de déblocage
//	   ├──► Pipeline : résout (avatarID, pose) → chemin SVG
//	   └──► Service  : orchestre : « quels avatars débloquer maintenant ? »
//
// # Déblocage
//
// Le déblocage s'appuie sur `domain.AvatarUnlockKind` :
//
//	program       → avoir terminé Value (ProgramID)
//	streak        → streak >= Value (jours)
//	lessons       → leçons terminées >= Value
//	mission_count → missions réussies >= Value
//	all_programs  → tous les programmes du tronc commun terminés
//	secret        → condition cachée (signal externe via ctx.Values)
//	founding      → condition spéciale (complétion totale)
//
// # Pipeline SVG
//
//	(tier, avatarID, pose) ──► /images/SVG-avatar/{tier}/{Name}.svg
//
// Le rendu concret est fait côté React : ce package ne fournit que les
// chemins et les styles de tier (couleurs, ombres).
//
// # Déterminisme
//
// Aucune fonction de ce package n'appelle time.Now() : toutes reçoivent
// un `now time.Time` explicite. Les fonctions sont pures (aucune mutation
// de Learner) sauf le Service qui peut appliquer des déblocages.
package avatars