package gamification

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

// StreakMilestone décrit un palier de streak qui donne lieu à une
// récompense et un message de la mascotte.
type StreakMilestone struct {
	Day      int    `json:"day"`
	XP       int    `json:"xp"`
	Message  string `json:"message"`
	BadgeID  string `json:"badge_id,omitempty"`
	AvatarID string `json:"avatar_id,omitempty"`
}

// StreakMilestones — liste ordonnée des paliers.
//
// Les valeurs d'XP sont volontairement croissantes pour récompenser la
// fidélité sur la durée. Les badges sont optionnels et doivent exister
// dans le catalogue (voir content/badges/).
var StreakMilestones = []StreakMilestone{
	{Day: 3, XP: 20, Message: "3 jours d'affilée — bel élan !"},
	{Day: 7, XP: 50, Message: "Une semaine complète sans rater un jour !", BadgeID: "streak-7"},
	{Day: 14, XP: 100, Message: "Deux semaines — tu es régulier."},
	{Day: 30, XP: 250, Message: "Un mois entier. Impressionnant.", BadgeID: "streak-30"},
	{Day: 100, XP: 1000, Message: "Cent jours. Tu fais partie des rares.", BadgeID: "streak-100"},
}

// StreakBonus décrit le bonus exact attribué lorsqu'un streak atteint un
// palier.
type StreakBonus struct {
	Milestone StreakMilestone `json:"milestone"`
	// Applied — vrai si le bonus a été effectivement attribué (nouveau
	// palier atteint pour la première fois).
	Applied bool `json:"applied"`
}

// BonusForStreakDay renvoie le palier correspondant exactement à `day`,
// ou nil si `day` n'est pas un palier.
func BonusForStreakDay(day int) *StreakMilestone {
	for i := range StreakMilestones {
		if StreakMilestones[i].Day == day {
			m := StreakMilestones[i]
			return &m
		}
	}
	return nil
}

// ComputeStreakBonus détermine quel bonus doit être attribué après un
// passage de `previousStreak` à `currentStreak`.
//
// Plusieurs paliers peuvent être traversés en une fois si le streak a été
// manipulé (import, migration). On les renvoie tous.
func ComputeStreakBonus(previousStreak, currentStreak int) []StreakMilestone {
	if currentStreak <= previousStreak {
		return nil
	}
	var out []StreakMilestone
	for _, m := range StreakMilestones {
		if m.Day > previousStreak && m.Day <= currentStreak {
			out = append(out, m)
		}
	}
	return out
}

// ─── Freeze (protection de streak) ──────────────────────────────────────

// MaxFreezes — nombre maximum de freezes cumulables par apprenant.
const MaxFreezes = 3

// CanFreeze indique si un nouveau freeze peut être accordé.
func CanFreeze(currentFreezes int) bool {
	return currentFreezes < MaxFreezes
}

// IsStreakBroken indique si le streak est cassé par rapport à une date
// d'activité précédente.
//
//	lastActivity : dernière activité enregistrée
//	now          : instant de vérification
//
// Le streak est considéré comme cassé si le jour de `now` est strictement
// postérieur à (jour de `lastActivity` + 1).
func IsStreakBroken(lastActivity, now time.Time) bool {
	ly, lm, ld := lastActivity.Date()
	ny, nm, nd := now.Date()
	last := time.Date(ly, lm, ld, 0, 0, 0, 0, time.UTC)
	today := time.Date(ny, nm, nd, 0, 0, 0, 0, time.UTC)
	return today.After(last.AddDate(0, 0, 1))
}

// ShouldFreezeOnAbsence — renvoie true si un freeze devrait être consommé
// pour préserver le streak, compte tenu du stock disponible et de la
// dernière activité.
//
// Règle : si le streak est cassé mais que le stock de freezes est > 0, on
// consomme un freeze (retourne true) et le streak reste inchangé.
func ShouldFreezeOnAbsence(lastActivity, now time.Time, freezesAvailable int) bool {
	if freezesAvailable <= 0 {
		return false
	}
	return IsStreakBroken(lastActivity, now)
}

// StreakStatus résume l'état du streak pour l'UI.
type StreakStatus struct {
	CurrentDays       int  `json:"current_days"`
	BestDays          int  `json:"best_days"`
	FreezesAvailable  int  `json:"freezes_available"`
	IsActiveToday     bool `json:"is_active_today"`
	DaysUntilNextMile int  `json:"days_until_next_milestone,omitempty"`
	NextMilestoneDay  int  `json:"next_milestone_day,omitempty"`
	NextMilestoneXP   int  `json:"next_milestone_xp,omitempty"`
}

// BuildStreakStatus construit l'état du streak à afficher dans l'UI.
func BuildStreakStatus(l *domain.Learner, freezesAvailable int, now time.Time) StreakStatus {
	s := StreakStatus{
		CurrentDays:      l.StreakDays,
		BestDays:         l.BestStreakDays,
		FreezesAvailable: freezesAvailable,
	}
	// Actif aujourd'hui ?
	ly, lm, ld := l.LastActivityAt.Date()
	ny, nm, nd := now.Date()
	if ly == ny && lm == nm && ld == nd {
		s.IsActiveToday = true
	}

	// Prochain palier.
	for _, m := range StreakMilestones {
		if m.Day > l.StreakDays {
			s.NextMilestoneDay = m.Day
			s.NextMilestoneXP = m.XP
			s.DaysUntilNextMile = m.Day - l.StreakDays
			break
		}
	}
	return s
}