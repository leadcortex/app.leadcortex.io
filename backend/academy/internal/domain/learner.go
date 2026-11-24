// backend/academy/internal/domain/learner.go

package domain

import (
	"time"
)

type Learner struct {
	ID string

	DisplayName string

	Email string

	TenantID string

	CreatedAt time.Time

	LastActivityAt time.Time


	XP int

	Level int

	StreakDays int

	BestStreakDays int

	Hearts int


	ProgramProgress map[string]ProgramProgress

	LessonProgress map[string]LessonProgress

	ConceptMastery map[string]Mastery


	UnlockedAvatarIDs []string

	EquippedAvatarID string

	EarnedBadges []BadgeEarned


	MissionProgress map[string]MissionProgress
}

const MaxHearts = 5

func NewLearner(id, displayName, email string) *Learner {
	now := time.Now().UTC()
	return &Learner{
		ID:               id,
		DisplayName:      displayName,
		Email:            email,
		CreatedAt:        now,
		LastActivityAt:   now,
		XP:               0,
		Level:            1,
		StreakDays:       0,
		BestStreakDays:   0,
		Hearts:           MaxHearts,
		ProgramProgress:  make(map[string]ProgramProgress),
		LessonProgress:   make(map[string]LessonProgress),
		ConceptMastery:   make(map[string]Mastery),
		UnlockedAvatarIDs: []string{},
		EquippedAvatarID: "",
		EarnedBadges:     []BadgeEarned{},
		MissionProgress:  make(map[string]MissionProgress),
	}
}

func (l Learner) Validate() error {
	if l.ID == "" {
		return NewValidationError("Learner", "id", "obligatoire")
	}
	if l.DisplayName == "" {
		return NewValidationError("Learner", "display_name", "obligatoire")
	}
	if l.XP < 0 {
		return NewValidationError("Learner", "xp", "ne peut pas être négatif")
	}
	if l.Hearts < 0 || l.Hearts > MaxHearts {
		return NewValidationError("Learner", "hearts",
			"doit être entre 0 et MaxHearts")
	}
	return nil
}

func (l *Learner) AddXP(amount int) {
	if amount <= 0 {
		return
	}
	l.XP += amount
	l.Level = LevelFromXP(l.XP)
}

func LevelFromXP(xp int) int {
	if xp < 0 {
		return 1
	}
	level := 1
	for level < 100 {
		threshold := XPForLevel(level + 1)
		if xp < threshold {
			break
		}
		level++
	}
	return level
}

func XPForLevel(level int) int {
	if level <= 1 {
		return 0
	}
	n := float64(level - 1)
	f := n * n * n
	return int(100 * float64(int(f*100))/100) / 1
}

func (l *Learner) RecordActivity(now time.Time) bool {
	prev := l.LastActivityAt
	l.LastActivityAt = now

	if sameDay(prev, now) {
		return false
	}

	if isNextDay(prev, now) {
		l.StreakDays++
		if l.StreakDays > l.BestStreakDays {
			l.BestStreakDays = l.StreakDays
		}
		return true
	}

	l.StreakDays = 1
	return true
}

func (l *Learner) ConsumeHeart() bool {
	if l.Hearts <= 0 {
		return false
	}
	l.Hearts--
	return true
}

func (l *Learner) RestoreHearts() {
	l.Hearts = MaxHearts
}

func (l *Learner) UnlockAvatar(avatarID string) bool {
	for _, id := range l.UnlockedAvatarIDs {
		if id == avatarID {
			return false
		}
	}
	l.UnlockedAvatarIDs = append(l.UnlockedAvatarIDs, avatarID)
	return true
}

func (l *Learner) EarnBadge(badgeID string, at time.Time) bool {
	for _, b := range l.EarnedBadges {
		if b.BadgeID == badgeID {
			return false
		}
	}
	l.EarnedBadges = append(l.EarnedBadges, BadgeEarned{
		BadgeID: badgeID,
		EarnedAt: at,
	})
	return true
}


func sameDay(a, b time.Time) bool {
	ay, am, ad := a.Date()
	by, bm, bd := b.Date()
	return ay == by && am == bm && ad == bd
}

func isNextDay(prev, now time.Time) bool {
	expected := prev.AddDate(0, 0, 1)
	return sameDay(expected, now)
}