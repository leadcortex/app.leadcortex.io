// backend/academy/internal/gamification/streak.go

package gamification

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type StreakMilestone struct {
	Day      int    `json:"day"`
	XP       int    `json:"xp"`
	Message  string `json:"message"`
	BadgeID  string `json:"badge_id,omitempty"`
	AvatarID string `json:"avatar_id,omitempty"`
}

var StreakMilestones = []StreakMilestone{
	{Day: 3, XP: 20, Message: "3 jours d'affilée — bel élan !"},
	{Day: 7, XP: 50, Message: "Une semaine complète sans rater un jour !", BadgeID: "streak-7"},
	{Day: 14, XP: 100, Message: "Deux semaines — tu es régulier."},
	{Day: 30, XP: 250, Message: "Un mois entier. Impressionnant.", BadgeID: "streak-30"},
	{Day: 100, XP: 1000, Message: "Cent jours. Tu fais partie des rares.", BadgeID: "streak-100"},
}

type StreakBonus struct {
	Milestone StreakMilestone `json:"milestone"`
	Applied bool `json:"applied"`
}

func BonusForStreakDay(day int) *StreakMilestone {
	for i := range StreakMilestones {
		if StreakMilestones[i].Day == day {
			m := StreakMilestones[i]
			return &m
		}
	}
	return nil
}

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


const MaxFreezes = 3

func CanFreeze(currentFreezes int) bool {
	return currentFreezes < MaxFreezes
}

func IsStreakBroken(lastActivity, now time.Time) bool {
	ly, lm, ld := lastActivity.Date()
	ny, nm, nd := now.Date()
	last := time.Date(ly, lm, ld, 0, 0, 0, 0, time.UTC)
	today := time.Date(ny, nm, nd, 0, 0, 0, 0, time.UTC)
	return today.After(last.AddDate(0, 0, 1))
}

func ShouldFreezeOnAbsence(lastActivity, now time.Time, freezesAvailable int) bool {
	if freezesAvailable <= 0 {
		return false
	}
	return IsStreakBroken(lastActivity, now)
}

type StreakStatus struct {
	CurrentDays       int  `json:"current_days"`
	BestDays          int  `json:"best_days"`
	FreezesAvailable  int  `json:"freezes_available"`
	IsActiveToday     bool `json:"is_active_today"`
	DaysUntilNextMile int  `json:"days_until_next_milestone,omitempty"`
	NextMilestoneDay  int  `json:"next_milestone_day,omitempty"`
	NextMilestoneXP   int  `json:"next_milestone_xp,omitempty"`
}

func BuildStreakStatus(l *domain.Learner, freezesAvailable int, now time.Time) StreakStatus {
	s := StreakStatus{
		CurrentDays:      l.StreakDays,
		BestDays:         l.BestStreakDays,
		FreezesAvailable: freezesAvailable,
	}
	ly, lm, ld := l.LastActivityAt.Date()
	ny, nm, nd := now.Date()
	if ly == ny && lm == nm && ld == nd {
		s.IsActiveToday = true
	}

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