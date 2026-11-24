// backend/academy/internal/adaptivity/signals.go

package adaptivity

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type SignalKind string

const (
	SignalWeakConcept SignalKind = "weak_concept"

	SignalLowScores SignalKind = "low_scores"

	SignalLapsedCards SignalKind = "lapsed_cards"

	SignalOverdueReviews SignalKind = "overdue_reviews"

	SignalStreakBroken SignalKind = "streak_broken"

	SignalBlockedLesson SignalKind = "blocked_lesson"

	SignalStalled SignalKind = "stalled"
)

type Signal struct {
	Kind SignalKind `json:"kind"`

	TargetID string `json:"target_id,omitempty"`

	Severity float64 `json:"severity"`

	Reason string `json:"reason"`

	Meta map[string]any `json:"meta,omitempty"`
}

type SignalOptions struct {
	Registry *curriculum.Registry

	SrsCards []domain.SrsCard

	Now time.Time

	StallThresholdDays int

	WeakThreshold domain.MasteryLevel

	LowScoreThreshold float64

	OverdueDays int
}

func DefaultSignalOptions(now time.Time) SignalOptions {
	return SignalOptions{
		Now:                now,
		StallThresholdDays: 3,
		WeakThreshold:      domain.MasteryOK,
		LowScoreThreshold:  60,
		OverdueDays:        3,
	}
}

func DetectSignals(learner *domain.Learner, opts SignalOptions) []Signal {
	if learner == nil {
		return nil
	}

	opts = normalizeSignalOptions(opts)

	var signals []Signal

	for cid, mastery := range learner.ConceptMastery {
		if mastery.Attempts == 0 {
			continue
		}

		if mastery.Level < opts.WeakThreshold {
			sev := severityFromMastery(mastery.Level, opts.WeakThreshold)
			signals = append(signals, Signal{
				Kind:     SignalWeakConcept,
				TargetID: cid,
				Severity: sev,
				Reason: fmt.Sprintf("Concept fragile : %d/%d",
					int(mastery.Level), int(domain.MasteryMastered)),
				Meta: map[string]any{
					"level":    int(mastery.Level),
					"attempts": mastery.Attempts,
					"correct":  mastery.Correct,
				},
			})
			continue
		}

		acc := mastery.Accuracy() * 100
		if acc > 0 && acc < opts.LowScoreThreshold {
			signals = append(signals, Signal{
				Kind:     SignalLowScores,
				TargetID: cid,
				Severity: 0.4,
				Reason:   "Scores récents sous la moyenne",
				Meta: map[string]any{
					"accuracy": acc,
					"attempts": mastery.Attempts,
				},
			})
		}
	}

	if len(opts.SrsCards) > 0 {
		var lapsedByConcept = map[string]int{}
		var overdueByConcept = map[string]int{}
		overdueThreshold := opts.Now.AddDate(0, 0, -opts.OverdueDays)

		for _, c := range opts.SrsCards {
			if c.Lapses > 0 {
				lapsedByConcept[c.ConceptID]++
			}
			if !c.DueAt.IsZero() && c.DueAt.Before(overdueThreshold) {
				overdueByConcept[c.ConceptID]++
			}
		}

		for cid, n := range lapsedByConcept {
			signals = append(signals, Signal{
				Kind:     SignalLapsedCards,
				TargetID: cid,
				Severity: clamp01(float64(n) * 0.2),
				Reason:   fmt.Sprintf("%d carte(s) SRS échouée(s)", n),
				Meta:     map[string]any{"count": n},
			})
		}
		for cid, n := range overdueByConcept {
			signals = append(signals, Signal{
				Kind:     SignalOverdueReviews,
				TargetID: cid,
				Severity: clamp01(float64(n) * 0.15),
				Reason:   fmt.Sprintf("%d révision(s) en retard", n),
				Meta:     map[string]any{"count": n},
			})
		}
	}

	if learner.StreakDays == 0 && !learner.LastActivityAt.IsZero() {
		daysSince := int(opts.Now.Sub(learner.LastActivityAt).Hours() / 24)
		if daysSince >= opts.StallThresholdDays {
			signals = append(signals, Signal{
				Kind:     SignalStreakBroken,
				Severity: clamp01(float64(daysSince) / 14),
				Reason:   fmt.Sprintf("Aucune activité depuis %d jour(s)", daysSince),
				Meta:     map[string]any{"days_since": daysSince},
			})
		}
	}

	if opts.Registry != nil {
		for _, lesson := range opts.Registry.AllLessons() {
			lp, ok := learner.LessonProgress[lesson.ID]
			if ok && lp.Status != domain.LessonStatusLocked {
				continue
			}
			missing := countMissingPrereqs(learner, lesson)
			if missing == 1 {
				signals = append(signals, Signal{
					Kind:     SignalBlockedLesson,
					TargetID: lesson.ID,
					Severity: 0.3,
					Reason:   "Une seule leçon vous sépare de la suite",
					Meta:     map[string]any{"missing_prereqs": missing},
				})
			}
		}
	}

	sortSignalsBySeverity(signals)
	return signals
}


func normalizeSignalOptions(o SignalOptions) SignalOptions {
	if o.StallThresholdDays <= 0 {
		o.StallThresholdDays = 3
	}
	if o.WeakThreshold <= 0 {
		o.WeakThreshold = domain.MasteryOK
	}
	if o.LowScoreThreshold <= 0 {
		o.LowScoreThreshold = 60
	}
	if o.OverdueDays <= 0 {
		o.OverdueDays = 3
	}
	return o
}

func severityFromMastery(level, threshold domain.MasteryLevel) float64 {
	if threshold <= 0 {
		return 1
	}
	ratio := float64(level) / float64(threshold)
	if ratio < 0 {
		ratio = 0
	}
	if ratio > 1 {
		ratio = 1
	}
	return 1 - ratio
}

func countMissingPrereqs(l *domain.Learner, lesson *domain.Lesson) int {
	n := 0
	for _, pid := range lesson.Prerequisites.PreviousLessonIDs {
		lp, ok := l.LessonProgress[pid]
		if !ok || !lp.IsCompleted() {
			n++
		}
	}
	for _, cid := range lesson.Prerequisites.RequiredConceptIDs {
		m, ok := l.ConceptMastery[cid]
		if !ok || !m.IsMastered() {
			n++
		}
	}
	return n
}

func sortSignalsBySeverity(s []Signal) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1].Severity < s[j].Severity; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}