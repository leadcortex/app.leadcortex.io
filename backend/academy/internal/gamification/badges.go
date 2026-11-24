// backend/academy/internal/gamification/badges.go

package gamification

import (
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type BadgeAward struct {
	BadgeID   string    `json:"badge_id"`
	EarnedAt  time.Time `json:"earned_at"`
	Condition string    `json:"condition"`
}

func EvaluateAndAwardBadges(
	learner *domain.Learner,
	registry *curriculum.Registry,
	ctx Context,
) []BadgeAward {
	if learner == nil || registry == nil {
		return nil
	}
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
		if badge.Condition.IsEmpty() {
			continue
		}
		ok, err := Evaluate(badge.Condition, ctx)
		if err != nil {
			continue
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