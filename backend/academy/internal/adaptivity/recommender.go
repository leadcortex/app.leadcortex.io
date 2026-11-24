// backend/academy/internal/adaptivity/recommender.go

package adaptivity

import (
	"sort"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

type RecommendationKind string

const (
	RecoReviewConcept RecommendationKind = "review_concept"

	RecoPracticeConcept RecommendationKind = "practice_concept"

	RecoResumeLesson RecommendationKind = "resume_lesson"

	RecoStartLesson RecommendationKind = "start_lesson"

	RecoRestDay RecommendationKind = "rest_day"

	RecoNone RecommendationKind = "none"
)

type Recommendation struct {
	Kind RecommendationKind `json:"kind"`

	LessonID string `json:"lesson_id,omitempty"`

	ConceptID string `json:"concept_id,omitempty"`

	Reason string `json:"reason"`

	Priority int `json:"priority"`

	EstimatedMin int `json:"estimated_minutes"`

	Score float64 `json:"-"`
}

type RecommendOptions struct {
	Registry *curriculum.Registry
	SrsCards []domain.SrsCard
	Now      time.Time

	PreferReview bool
}

func Recommend(learner *domain.Learner, opts RecommendOptions) Recommendation {
	if learner == nil {
		return Recommendation{
			Kind:     RecoNone,
			Reason:   "Learner introuvable",
			Priority: 3,
		}
	}

	candidates := collectCandidates(learner, opts)
	if len(candidates) == 0 {
		return Recommendation{
			Kind:     RecoNone,
			Reason:   "Tout est à jour !",
			Priority: 3,
		}
	}

	sort.SliceStable(candidates, func(i, j int) bool {
		if candidates[i].Score != candidates[j].Score {
			return candidates[i].Score > candidates[j].Score
		}
		if candidates[i].Priority != candidates[j].Priority {
			return candidates[i].Priority < candidates[j].Priority
		}
		return candidates[i].Kind < candidates[j].Kind
	})

	return candidates[0]
}


func collectCandidates(l *domain.Learner, opts RecommendOptions) []Recommendation {
	var out []Recommendation

	for lessonID, lp := range l.LessonProgress {
		if lp.Status == domain.LessonStatusInProgress {
			out = append(out, Recommendation{
				Kind:         RecoResumeLesson,
				LessonID:     lessonID,
				Reason:       "Reprendre la leçon en cours",
				Priority:     0,
				EstimatedMin: 8,
				Score:        95,
			})
		}
	}

	if opts.PreferReview || learnerHasOverdueCards(l, opts) {
		for cid, m := range l.ConceptMastery {
			if m.IsMastered() {
				continue
			}
			gap := domain.MasteryMastered - m.Level
			score := 70 + float64(gap)
			out = append(out, Recommendation{
				Kind:         RecoReviewConcept,
				ConceptID:    cid,
				Reason:       "Consolider un concept fragile",
				Priority:     1,
				EstimatedMin: 3,
				Score:        score,
			})
		}
	}

	if opts.Registry != nil {
		for _, lesson := range opts.Registry.AllLessons() {
			lp, ok := l.LessonProgress[lesson.ID]
			if ok && lp.IsCompleted() {
				continue
			}
			if isLessonUnlocked(l, lesson) {
				out = append(out, Recommendation{
					Kind:         RecoStartLesson,
					LessonID:     lesson.ID,
					Reason:       "Démarrer une nouvelle leçon",
					Priority:     2,
					EstimatedMin: lesson.DurationMin,
					Score:        60,
				})
				break
			}
		}
	}

	return out
}


func learnerHasOverdueCards(l *domain.Learner, opts RecommendOptions) bool {
	for _, c := range opts.SrsCards {
		if !c.DueAt.IsZero() && !c.DueAt.After(opts.Now) {
			return true
		}
	}
	return false
}

func isLessonUnlocked(l *domain.Learner, lesson *domain.Lesson) bool {
	for _, pid := range lesson.Prerequisites.PreviousLessonIDs {
		lp, ok := l.LessonProgress[pid]
		if !ok || !lp.IsCompleted() {
			return false
		}
	}
	for _, cid := range lesson.Prerequisites.RequiredConceptIDs {
		m, ok := l.ConceptMastery[cid]
		if !ok || !m.IsMastered() {
			return false
		}
	}
	return true
}
