// backend/academy/internal/adaptivity/profile.go

package adaptivity

import (
	"time"

	"github.com/leadcortex/academy/internal/domain"
)

type ConceptStrength struct {
	ConceptID string             `json:"concept_id"`
	Level     domain.MasteryLevel `json:"level"`
	Accuracy  float64            `json:"accuracy"`
	Attempts  int                `json:"attempts"`
	Correct   int                `json:"correct"`
	LastSeen  time.Time          `json:"last_seen,omitempty"`
}

func (s ConceptStrength) IsMastered() bool { return s.Level >= domain.MasteryMastered }

func (s ConceptStrength) IsWeak(threshold domain.MasteryLevel) bool {
	return s.Level < threshold
}

type Profile struct {
	LearnerID   string    `json:"learner_id"`
	DisplayName string    `json:"display_name"`
	GeneratedAt time.Time `json:"generated_at"`


	XP    int `json:"xp"`
	Level int `json:"level"`


	StreakDays     int  `json:"streak_days"`
	BestStreakDays int  `json:"best_streak_days"`
	ActiveToday    bool `json:"active_today"`
	Hearts         int  `json:"hearts"`


	Strengths []ConceptStrength `json:"strengths"`

	Weaknesses []ConceptStrength `json:"weaknesses"`


	Signals []Signal `json:"signals"`


	TargetDifficulty int `json:"target_difficulty"`

	EstimatedFocusMinutes int `json:"estimated_focus_minutes"`

	ProgressRatio float64 `json:"progress_ratio"`
}

func BuildProfile(learner *domain.Learner, opts SignalOptions) Profile {
	if learner == nil {
		return Profile{}
	}
	opts = normalizeSignalOptions(opts)

	p := Profile{
		LearnerID:   learner.ID,
		DisplayName: learner.DisplayName,
		GeneratedAt: opts.Now,
		XP:          learner.XP,
		Level:       learner.Level,
		StreakDays:  learner.StreakDays,
		BestStreakDays: learner.BestStreakDays,
		Hearts:      learner.Hearts,
	}
	p.ActiveToday = isActiveOn(learner, opts.Now)

	for cid, m := range learner.ConceptMastery {
		cs := ConceptStrength{
			ConceptID: cid,
			Level:     m.Level,
			Accuracy:  m.Accuracy(),
			Attempts:  m.Attempts,
			Correct:   m.Correct,
			LastSeen:  m.LastReviewed,
		}
		if cs.IsMastered() {
			p.Strengths = append(p.Strengths, cs)
		} else if m.Attempts > 0 {
			p.Weaknesses = append(p.Weaknesses, cs)
		}
	}
	sortStrengthsDesc(p.Strengths)
	sortWeaknessesAsc(p.Weaknesses)

	p.Signals = DetectSignals(learner, opts)

	p.TargetDifficulty = ComputeTargetDifficulty(learner, DifficultyOptions{
		Now: opts.Now,
	})
	p.EstimatedFocusMinutes = estimateFocusMinutes(learner, p.Weaknesses, opts)

	if opts.Registry != nil {
		p.ProgressRatio = computeProgressRatio(learner, opts.Registry)
	}

	return p
}


func isActiveOn(l *domain.Learner, now time.Time) bool {
	if l.LastActivityAt.IsZero() {
		return false
	}
	ly, lm, ld := l.LastActivityAt.Date()
	ny, nm, nd := now.Date()
	return ly == ny && lm == nm && ld == nd
}

func sortStrengthsDesc(s []ConceptStrength) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1].Level < s[j].Level; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}

func sortWeaknessesAsc(s []ConceptStrength) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1].Level > s[j].Level; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}

func estimateFocusMinutes(
	l *domain.Learner,
	weak []ConceptStrength,
	opts SignalOptions,
) int {
	base := 10
	extra := len(weak) * 3
	if extra > 20 {
		extra = 20
	}
	if l.Hearts <= 1 {
		base = 5
		extra /= 2
	}
	total := base + extra
	if total < 5 {
		total = 5
	}
	if total > 30 {
		total = 30
	}
	return total
}

func computeProgressRatio(l *domain.Learner, reg interface {
	AllLessons() []*domain.Lesson
}) float64 {
	lessons := reg.AllLessons()
	if len(lessons) == 0 {
		return 0
	}
	done := 0
	for _, lesson := range lessons {
		if lp, ok := l.LessonProgress[lesson.ID]; ok && lp.IsCompleted() {
			done++
		}
	}
	return float64(done) / float64(len(lessons))
}