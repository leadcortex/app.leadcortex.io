package adaptivity

import (
	"sort"
	"time"

	"github.com/leadcortex/academy/internal/curriculum"
	"github.com/leadcortex/academy/internal/domain"
)

// RecommendationKind identifie la nature de l'action recommandée.
type RecommendationKind string

const (
	// RecoReviewConcept — réviser un concept fragile (SRS en priorité).
	RecoReviewConcept RecommendationKind = "review_concept"

	// RecoPracticeConcept — s'exercer sur un concept (nouvel exercice).
	RecoPracticeConcept RecommendationKind = "practice_concept"

	// RecoResumeLesson — reprendre une leçon en cours.
	RecoResumeLesson RecommendationKind = "resume_lesson"

	// RecoStartLesson — démarrer la prochaine leçon débloquée.
	RecoStartLesson RecommendationKind = "start_lesson"

	// RecoRestDay — faire une pause, revenir demain.
	RecoRestDay RecommendationKind = "rest_day"

	// RecoNone — aucune action particulière.
	RecoNone RecommendationKind = "none"
)

// Recommendation est l'action unique que l'UI doit mettre en avant.
type Recommendation struct {
	// Kind — nature de l'action.
	Kind RecommendationKind `json:"kind"`

	// LessonID — leçon concernée (si applicable).
	LessonID string `json:"lesson_id,omitempty"`

	// ConceptID — concept concerné (si applicable).
	ConceptID string `json:"concept_id,omitempty"`

	// Reason — phrase courte affichée à l'apprenant.
	Reason string `json:"reason"`

	// Priority — 0 = haute priorité, 3 = basse.
	Priority int `json:"priority"`

	// EstimatedMin — durée estimée en minutes.
	EstimatedMin int `json:"estimated_minutes"`

	// Score — valeur interne (utilisée pour le tri) 0-100.
	Score float64 `json:"-"`
}

// RecommendOptions paramètre la recommandation.
type RecommendOptions struct {
	Registry *curriculum.Registry
	SrsCards []domain.SrsCard
	Now      time.Time

	// PreferReview — si vrai, on privilégie les révisions SRS avant
	// tout (mode "session de rattrapage").
	PreferReview bool
}

// Recommend renvoie l'action prioritaire pour l'apprenant.
//
// La fonction est PURE. Elle peut renvoyer une recommandation de type
// `RecoNone` si aucun contexte utile n'est disponible.
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

	// Tri par score décroissant, puis par priorité croissante,
	// puis par Kind (ordre déterministe).
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

/* ─── Collecte des candidats ──────────────────────────────────────────── */

func collectCandidates(l *domain.Learner, opts RecommendOptions) []Recommendation {
	var out []Recommendation

	// ─── 1. Reprendre une leçon en cours (haute priorité) ────────────
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

	// ─── 2. Réviser un concept fragile (SRS) ─────────────────────────
	if opts.PreferReview || learnerHasOverdueCards(l, opts) {
		for cid, m := range l.ConceptMastery {
			if m.IsMastered() {
				continue
			}
			// Priorité selon l'écart au palier "maîtrisé".
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

	// ─── 3. Démarrer une nouvelle leçon ──────────────────────────────
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
				break // première leçon débloquée seulement
			}
		}
	}

	return out
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

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
