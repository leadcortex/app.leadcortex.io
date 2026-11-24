// backend/academy/internal/adaptivity/planner.go

package adaptivity

import (
	"fmt"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type PlanMode string

const (
	PlanMicro PlanMode = "micro"

	PlanStandard PlanMode = "standard"

	PlanDeep PlanMode = "deep"

	PlanReviewOnly PlanMode = "review_only"
)

func (m PlanMode) IsKnown() bool {
	switch m {
	case PlanMicro, PlanStandard, PlanDeep, PlanReviewOnly:
		return true
	}
	return false
}

type PlanStep struct {
	Order int `json:"order"`

	Kind RecommendationKind `json:"kind"`

	LessonID string `json:"lesson_id,omitempty"`

	ConceptID string `json:"concept_id,omitempty"`

	DurationMin int `json:"duration_minutes"`

	Description string `json:"description"`
}

type SessionPlan struct {
	Mode         PlanMode   `json:"mode"`
	TotalMinutes int        `json:"total_minutes"`
	Steps        []PlanStep `json:"steps"`
	Reason       string     `json:"reason"`
}

type PlanOptions struct {
	Registry *curriculum.Registry
	SrsCards []domain.SrsCard
	Now      time.Time
}

func PlanSession(
	learner *domain.Learner,
	mode PlanMode,
	opts PlanOptions,
) (SessionPlan, error) {
	if learner == nil {
		return SessionPlan{}, ErrNilLearner
	}
	if !mode.IsKnown() {
		return SessionPlan{}, fmt.Errorf("%w : %q", ErrInvalidMode, mode)
	}

	dur := durationForMode(mode)
	plan := SessionPlan{
		Mode:         mode,
		TotalMinutes: dur,
	}

	switch mode {
	case PlanReviewOnly:
		plan.Steps = buildReviewSteps(learner, opts, dur)
		plan.Reason = "Session de rattrapage : consolidation uniquement."
	case PlanMicro:
		plan.Steps = buildMicroSteps(learner, opts)
		plan.Reason = "Session courte pour garder le rythme."
	case PlanStandard:
		plan.Steps = buildStandardSteps(learner, opts)
		plan.Reason = "Session standard pour progresser régulièrement."
	case PlanDeep:
		plan.Steps = buildDeepSteps(learner, opts)
		plan.Reason = "Session longue pour un progrès significatif."
	}

	real := 0
	for i := range plan.Steps {
		plan.Steps[i].Order = i + 1
		real += plan.Steps[i].DurationMin
	}
	plan.TotalMinutes = real

	return plan, nil
}


func buildReviewSteps(l *domain.Learner, opts PlanOptions, dur int) []PlanStep {
	steps := []PlanStep{}
	weak := weakConcepts(l)
	for _, cid := range weak {
		if stepsMinutes(steps) >= dur {
			break
		}
		steps = append(steps, PlanStep{
			Kind:        RecoReviewConcept,
			ConceptID:   cid,
			DurationMin: 3,
			Description: fmt.Sprintf("Réviser le concept %q", cid),
		})
	}
	if len(steps) == 0 {
		steps = append(steps, PlanStep{
			Kind:        RecoReviewConcept,
			DurationMin: 5,
			Description: "Aucun concept fragile : révision libre.",
		})
	}
	return steps
}

func buildMicroSteps(l *domain.Learner, opts PlanOptions) []PlanStep {
	rec := Recommend(l, RecommendOptions{
		Registry: opts.Registry,
		SrsCards: opts.SrsCards,
		Now:      opts.Now,
	})
	return []PlanStep{
		{
			Kind:        rec.Kind,
			LessonID:    rec.LessonID,
			ConceptID:   rec.ConceptID,
			DurationMin: 5,
			Description: rec.Reason,
		},
	}
}

func buildStandardSteps(l *domain.Learner, opts PlanOptions) []PlanStep {
	steps := []PlanStep{}

	weak := weakConcepts(l)
	if len(weak) > 0 {
		steps = append(steps, PlanStep{
			Kind:        RecoReviewConcept,
			ConceptID:   weak[0],
			DurationMin: 3,
			Description: "Réviser un concept fragile",
		})
	}

	rec := Recommend(l, RecommendOptions{
		Registry: opts.Registry,
		SrsCards: opts.SrsCards,
		Now:      opts.Now,
	})
	if rec.Kind == RecoResumeLesson || rec.Kind == RecoStartLesson {
		steps = append(steps, PlanStep{
			Kind:        rec.Kind,
			LessonID:    rec.LessonID,
			DurationMin: 10,
			Description: rec.Reason,
		})
	}

	steps = append(steps, PlanStep{
		Kind:        RecoReviewConcept,
		DurationMin: 2,
		Description: "Mini-révision finale",
	})

	return steps
}

func buildDeepSteps(l *domain.Learner, opts PlanOptions) []PlanStep {
	steps := []PlanStep{}

	for i, cid := range weakConcepts(l) {
		if i >= 3 {
			break
		}
		steps = append(steps, PlanStep{
			Kind:        RecoReviewConcept,
			ConceptID:   cid,
			DurationMin: 3,
			Description: fmt.Sprintf("Réviser %q", cid),
		})
	}

	rec := Recommend(l, RecommendOptions{
		Registry: opts.Registry,
		SrsCards: opts.SrsCards,
		Now:      opts.Now,
	})
	if rec.Kind == RecoResumeLesson || rec.Kind == RecoStartLesson {
		steps = append(steps, PlanStep{
			Kind:        rec.Kind,
			LessonID:    rec.LessonID,
			DurationMin: 15,
			Description: rec.Reason,
		})
	}

	steps = append(steps, PlanStep{
		Kind:        RecoReviewConcept,
		DurationMin: 5,
		Description: "Consolidation finale",
	})

	return steps
}


func durationForMode(m PlanMode) int {
	switch m {
	case PlanMicro:
		return 5
	case PlanStandard:
		return 15
	case PlanDeep:
		return 30
	case PlanReviewOnly:
		return 10
	}
	return 10
}

func weakConcepts(l *domain.Learner) []string {
	type entry struct {
		id    string
		level domain.MasteryLevel
	}
	var entries []entry
	for cid, m := range l.ConceptMastery {
		if m.IsMastered() {
			continue
		}
		if m.Attempts == 0 {
			continue
		}
		entries = append(entries, entry{id: cid, level: m.Level})
	}
	for i := 1; i < len(entries); i++ {
		for j := i; j > 0 && entries[j-1].level > entries[j].level; j-- {
			entries[j-1], entries[j] = entries[j], entries[j-1]
		}
	}
	out := make([]string, len(entries))
	for i, e := range entries {
		out[i] = e.id
	}
	return out
}

func stepsMinutes(steps []PlanStep) int {
	n := 0
	for _, s := range steps {
		n += s.DurationMin
	}
	return n
}