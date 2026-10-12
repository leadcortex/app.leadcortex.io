package gamification

import (
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// BadgeAward décrit un badge nouvellement obtenu par un Learner.
type BadgeAward struct {
	BadgeID   string    `json:"badge_id"`
	EarnedAt  time.Time `json:"earned_at"`
	Condition string    `json:"condition"` // description lisible
}

// EvaluateAndAwardBadges parcourt tous les badges du registre et renvoie
// ceux que le Learner vient de satisfaire et qu'il ne possède pas encore.
//
// La fonction est PURE : elle ne mute pas le Learner. L'appelant est
// responsable de l'attribution effective (par exemple en appelant
// `learner.EarnBadge` pour chaque badge retourné).
//
// Les erreurs d'évaluation par condition individuelle sont silencieuses :
// un badge dont la condition ne peut être résolue est ignoré (log côté
// appelant si nécessaire). Cela évite qu'un badge malformé bloque toute
// l'attribution.
func EvaluateAndAwardBadges(
	learner *domain.Learner,
	registry *curriculum.Registry,
	ctx Context,
) []BadgeAward {
	if learner == nil || registry == nil {
		return nil
	}
	// Force le Learner dans le contexte.
	ctx.Learner = learner

	already := make(map[string]struct{}, len(learner.EarnedBadges))
	for _, b := range learner.EarnedBadges {
		already[b.BadgeID] = struct{}{}
	}

	now := ctx.Now
	if now.IsZero() {
		now = time.Now().UTC()
	}

	var out []BadgeAward
	for _, badge := range registry.AllBadges() {
		if _, ok := already[badge.ID]; ok {
			continue
		}
		// Un badge sans condition est considéré comme acquis d'office ;
		// on l'ignore pour éviter les attributions fantômes.
		if badge.Condition.IsEmpty() {
			continue
		}
		ok, err := Evaluate(badge.Condition, ctx)
		if err != nil {
			continue // badge malformé : on passe
		}
		if !ok {
			continue
		}
		out = append(out, BadgeAward{
			BadgeID:   badge.ID,
			EarnedAt:  now,
			Condition: describeConditionGroup(badge.Condition),
		})
	}
	return out
}

// ApplyBadgeAwards attribue effectivement les badges au Learner.
// Renvoie les IDs qui ont été ajoutés (idempotent).
func ApplyBadgeAwards(learner *domain.Learner, awards []BadgeAward) []string {
	if learner == nil || len(awards) == 0 {
		return nil
	}
	var added []string
	for _, a := range awards {
		if learner.EarnBadge(a.BadgeID, a.EarnedAt) {
			added = append(added, a.BadgeID)
		}
	}
	return added
}

// HasBadge — accesseur simple.
func HasBadge(learner *domain.Learner, badgeID string) bool {
	if learner == nil {
		return false
	}
	for _, b := range learner.EarnedBadges {
		if b.BadgeID == badgeID {
			return true
		}
	}
	return false
}

// describeConditionGroup produit une description courte et lisible,
// utile pour le debug et les notifications UI.
func describeConditionGroup(g domain.ConditionGroup) string {
	switch {
	case len(g.All) == 1 && len(g.Any) == 0 && len(g.Not) == 0:
		c := g.All[0]
		return describeCondition(c)
	case len(g.All) > 1:
		return "toutes les conditions requises"
	case len(g.Any) > 0:
		return "au moins une condition requise"
	case len(g.Not) > 0:
		return "aucune condition ne doit être vraie"
	default:
		return ""
	}
}

func describeCondition(c domain.Condition) string {
	return string(c.Op) + " " + c.Path
}