// Package gamification implémente la couche "jeu" de l'academy :
// XP, niveaux, streaks, cœurs, badges et quêtes quotidiennes.
//
// # Rôle
//
// Ce package transforme des événements d'apprentissage (leçon terminée,
// exercice répondu, mission réussie…) en récompenses concrètes et en
// progression visible pour l'apprenant : gain d'XP, montée de niveau,
// streak maintenu, badge débloqué, quête complétée.
//
// Il est **pur** : il ne mute pas le Learner directement. Chaque service
// expose des fonctions qui prennent un état et renvoient ce qui doit
// changer. L'orchestration (application effective sur le Learner) est
// déléguée à `progress.Engine` et au futur `repository`.
//
// # Architecture
//
//	domain.ConditionGroup ──►  conditions.Evaluate
//	                                 │
//	                                 ▼
//	                          ┌──────────────┐
//	                          │  Gamification│
//	                          │   Services   │
//	                          └──────┬───────┘
//	                                 │
//	     ┌─────────────┬─────────────┼─────────────┬──────────────┐
//	     ▼             ▼             ▼             ▼              ▼
//	  XP/Lvl        Streak        Hearts        Badges        Quests
//	  (paliers)   (bonus/freeze) (régén.)    (conditions)   (quotidien)
//
// # Sous-systèmes
//
//  1. **XP & niveaux** (xp.go)
//     Courbe : `100 * (level-1)^1.5`. À chaque palier, une ou plusieurs
//     récompenses sont attribuées (badge, avatar, cœurs bonus, titre).
//
//  2. **Streak** (streak.go)
//     Le domaine maintient `StreakDays` et `BestStreakDays`. Ici on
//     ajoute : bonus d'XP aux paliers (3/7/14/30/100 jours), badges
//     dédiés, et mécanique de "freeze" (protection en cas d'absence).
//
//  3. **Hearts** (hearts.go)
//     Régénération temporelle : 1 cœur toutes les 30 minutes (configurable)
//     tant que le total est inférieur à `domain.MaxHearts`. Fonction pure,
//     l'horodatage du dernier regain est fourni par l'appelant.
//
//  4. **Badges** (badges.go)
//     Évaluation automatique des conditions de chaque badge déclaré dans
//     le registre de curriculum. Un badge est attribué dès que sa condition
//     (`domain.ConditionGroup`) devient vraie et qu'il n'est pas déjà
//     obtenu.
//
//  5. **Quêtes quotidiennes** (quests.go)
//     Trois quêtes par jour, générées de façon déterministe à partir d'une
//     graine (la date). Chaque quête a un objectif chiffré (XP, leçons,
//     exercices, révisions, missions) et une récompense en XP.
//
// # Évaluateur de conditions
//
// Le fichier `conditions.go` fournit le socle commun : un `Context`
// (Learner + valeurs additionnelles + horodatage) et une fonction
// `Evaluate` qui résout un `domain.ConditionGroup` en booléen.
//
// Les chemins (`Path`) sont résolus dans cet ordre :
//  1. Chemins calculés exposant le Learner (`learner.xp`, `learner.level`…)
//  2. Chemins calculés dérivés (`learner.lessons_completed`, `learner.badges_count`…)
//  3. Valeurs libres fournies par l'appelant (`ctx.Values["event.type"]`…)
//
// # Déterminisme
//
// Aucun service de ce package n'appelle `time.Now()`. Tous reçoivent un
// paramètre `now time.Time` explicite. Cela permet des tests déterministes
// et un contrôle total sur les frontières temporelles (minuit, J+1, etc.).
//
// # Intégration avec progress
//
// `progress.Engine` appellera ces services au moment opportun :
//
//	result := engine.Apply(learner, event)
//	// post-traitement gamification :
//	xpReward := gamification.RewardForLevel(learner.Level)
//	gamification.ApplyStreakBonus(learner, now)
//	gamification.EvaluateAndAwardBadges(learner, registry, ctx)
//
// Aucune dépendance de ce package vers `progress` n'est autorisée.
package gamification